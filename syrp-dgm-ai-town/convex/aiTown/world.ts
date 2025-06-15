import { v, Infer } from 'convex/values';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { Player, serializedPlayer } from './player';
import { Agent, serializedAgent } from './agent';
import { Conversation, serializedConversation } from './conversation';
import { playerId, conversationId } from './ids';

export const serializedWorld = {
  nextId: v.number(),
  lastViewed: v.number(),
};
export type SerializedWorld = Infer<typeof serializedWorld>;

export class World {
  id: Id<'worlds'>;
  nextId: number;
  lastViewed: number;
  
  players: Map<string, Player> = new Map();
  agents: Map<string, Agent> = new Map();
  conversations: Map<string, Conversation> = new Map();

  constructor(serialized: SerializedWorld & { _id: Id<'worlds'> }) {
    this.id = serialized._id;
    this.nextId = serialized.nextId;
    this.lastViewed = serialized.lastViewed;
  }

  serialize(): SerializedWorld {
    return {
      nextId: this.nextId,
      lastViewed: this.lastViewed,
    };
  }

  // Generate next unique ID
  allocId(): string {
    const id = this.nextId.toString();
    this.nextId++;
    return id;
  }

  // Load world state from database
  async load(db: DatabaseReader): Promise<void> {
    // Load players
    const playerDocs = await db
      .query('archivedPlayers')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();

    for (const doc of playerDocs) {
      const player = new Player(doc);
      this.players.set(player.id, player);
    }

    // Load agents
    const agentDocs = await db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();

    for (const doc of agentDocs) {
      const agent = new Agent(doc);
      this.agents.set(agent.id, agent);
    }

    // Load conversations
    const conversationDocs = await db
      .query('archivedConversations')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();

    for (const doc of conversationDocs) {
      const conversation = new Conversation(doc);
      this.conversations.set(conversation.id, conversation);
    }
  }

  // Save world state to database
  async save(db: DatabaseWriter): Promise<void> {
    // Save players
    for (const player of this.players.values()) {
      await player.save(db, this.id);
    }

    // Save agents
    for (const agent of this.agents.values()) {
      await agent.save(db, this.id);
    }

    // Save conversations
    for (const conversation of this.conversations.values()) {
      await conversation.save(db, this.id);
    }
  }

  // Add a new player to the world
  async addPlayer(
    db: DatabaseWriter,
    name: string,
    character: string,
    description: string,
  ): Promise<Player> {
    const playerId = this.allocId();
    
    // Create player description
    await db.insert('playerDescriptions', {
      worldId: this.id,
      playerId,
      name,
      character,
      description,
    });

    // Create player
    const player = Player.create(playerId, name, character);
    this.players.set(playerId, player);

    return player;
  }

  // Remove a player from the world
  async removePlayer(db: DatabaseWriter, playerId: string): Promise<void> {
    const player = this.players.get(playerId);
    if (!player) {
      return;
    }

    // Leave any active conversation
    if (player.conversationId) {
      const conversation = this.conversations.get(player.conversationId);
      if (conversation) {
        await conversation.leave(db, playerId);
      }
    }

    // Remove player
    this.players.delete(playerId);

    // Archive player data
    await player.archive(db, this.id);
  }

  // Start a conversation between two players
  async startConversation(
    db: DatabaseWriter,
    creatorId: string,
    inviteeId: string,
  ): Promise<Conversation> {
    const creator = this.players.get(creatorId) || this.agents.get(creatorId);
    const invitee = this.players.get(inviteeId) || this.agents.get(inviteeId);

    if (!creator || !invitee) {
      throw new Error('One or both participants not found');
    }

    // Check if either is already in a conversation
    if (creator.conversationId || invitee.conversationId) {
      throw new Error('One or both participants are already in a conversation');
    }

    const conversationId = this.allocId();
    const conversation = Conversation.create(conversationId, creatorId, [creatorId, inviteeId]);
    
    this.conversations.set(conversationId, conversation);

    // Set conversation IDs for participants
    creator.conversationId = conversationId;
    invitee.conversationId = conversationId;

    return conversation;
  }

  // End a conversation
  async endConversation(db: DatabaseWriter, conversationId: string): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      return;
    }

    // Remove conversation ID from all participants
    for (const participantId of conversation.participants) {
      const participant = this.players.get(participantId) || this.agents.get(participantId);
      if (participant) {
        participant.conversationId = undefined;
      }
    }

    // Archive conversation
    await conversation.archive(db, this.id);
    this.conversations.delete(conversationId);
  }

  // Run world simulation step
  async tick(db: DatabaseWriter, now: number): Promise<void> {
    // Update all players
    for (const player of this.players.values()) {
      await player.tick(db, now);
    }

    // Update all agents
    for (const agent of this.agents.values()) {
      await agent.tick(db, now);
    }

    // Update all conversations
    for (const conversation of this.conversations.values()) {
      await conversation.tick(db, now);
      
      // End conversation if it's finished
      if (conversation.isFinished()) {
        await this.endConversation(db, conversation.id);
      }
    }

    // Update last viewed time
    this.lastViewed = now;
  }

  // Restart the world (clear all state)
  async restart(db: DatabaseWriter): Promise<void> {
    // Clear all collections
    this.players.clear();
    this.agents.clear();
    this.conversations.clear();

    // Reset ID counter
    this.nextId = 0;
    this.lastViewed = Date.now();

    // Clear archived data
    const archivedPlayers = await db
      .query('archivedPlayers')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();
    
    for (const doc of archivedPlayers) {
      await db.delete(doc._id);
    }

    const archivedAgents = await db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();
    
    for (const doc of archivedAgents) {
      await db.delete(doc._id);
    }

    const archivedConversations = await db
      .query('archivedConversations')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();
    
    for (const doc of archivedConversations) {
      await db.delete(doc._id);
    }

    // Clear descriptions
    const playerDescriptions = await db
      .query('playerDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();
    
    for (const doc of playerDescriptions) {
      await db.delete(doc._id);
    }

    const agentDescriptions = await db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', this.id))
      .collect();
    
    for (const doc of agentDescriptions) {
      await db.delete(doc._id);
    }
  }

  // Get all active participants (players + agents)
  getAllParticipants(): (Player | Agent)[] {
    return [...this.players.values(), ...this.agents.values()];
  }

  // Find nearby participants for a given position
  findNearbyParticipants(position: { x: number; y: number }, radius: number): (Player | Agent)[] {
    const nearby: (Player | Agent)[] = [];
    
    for (const participant of this.getAllParticipants()) {
      const distance = Math.sqrt(
        Math.pow(participant.position.x - position.x, 2) +
        Math.pow(participant.position.y - position.y, 2)
      );
      
      if (distance <= radius) {
        nearby.push(participant);
      }
    }
    
    return nearby;
  }

  // Get world statistics
  getStats() {
    return {
      players: this.players.size,
      agents: this.agents.size,
      conversations: this.conversations.size,
      nextId: this.nextId,
      lastViewed: this.lastViewed,
    };
  }
}