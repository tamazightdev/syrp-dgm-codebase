import { v } from 'convex/values';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { AbstractGame, createInputValidator, baseInputs } from '../engine/abstractGame';
import { World, serializedWorld } from './world';
import { Player, serializedPlayer } from './player';
import { Agent, serializedAgent } from './agent';
import { Conversation, serializedConversation } from './conversation';
import { playerId, conversationId } from './ids';

export class Game extends AbstractGame<World> {
  world: World;

  constructor(engine: any, engineId: Id<'engines'>, world: World) {
    super(engine, engineId);
    this.world = world;
  }

  // Input validation schemas
  static inputValidators = {
    ...baseInputs,
    join: createInputValidator({
      name: v.string(),
      character: v.string(),
      description: v.string(),
    }),
    leave: createInputValidator({
      playerId: playerId,
    }),
    sendMessage: createInputValidator({
      playerId: playerId,
      text: v.string(),
      messageUuid: v.string(),
    }),
    startConversation: createInputValidator({
      playerId: playerId,
      invitee: playerId,
    }),
    acceptInvite: createInputValidator({
      playerId: playerId,
      conversationId: conversationId,
    }),
    rejectInvite: createInputValidator({
      playerId: playerId,
      conversationId: conversationId,
    }),
    leaveConversation: createInputValidator({
      playerId: playerId,
      conversationId: conversationId,
    }),
    finishSpeaking: createInputValidator({
      playerId: playerId,
      conversationId: conversationId,
    }),
    walkTo: createInputValidator({
      playerId: playerId,
      destination: v.object({
        x: v.number(),
        y: v.number(),
      }),
    }),
    agentSendMessage: createInputValidator({
      agentId: playerId,
      text: v.string(),
      messageUuid: v.string(),
      leaveConversation: v.optional(v.boolean()),
    }),
    agentWakeUp: createInputValidator({
      agentId: playerId,
    }),
  };

  async tick(
    db: DatabaseWriter,
    inputs: { name: string; args: any }[],
  ): Promise<{ outputs?: any[]; debugOutput?: string }> {
    // Load current world state
    this.world = await this.load(db);

    // Process all inputs
    const outputs = [];
    for (const input of inputs) {
      const result = await this.processInput(db, this.world, input);
      if (result.success && result.result) {
        outputs.push(result.result);
      }
    }

    // Run world simulation step
    await this.world.tick(db, this.now());

    // Save updated world state
    await this.save(db, this.world);

    // Update engine timing
    await this.updateTiming(db);

    return {
      outputs: outputs.length > 0 ? outputs : undefined,
      debugOutput: `Processed ${inputs.length} inputs, world time: ${this.now()}`,
    };
  }

  async handleInput(db: DatabaseWriter, world: World, name: string, args: any): Promise<any> {
    switch (name) {
      case 'join':
        return await this.handleJoin(db, world, args);
      case 'leave':
        return await this.handleLeave(db, world, args);
      case 'sendMessage':
        return await this.handleSendMessage(db, world, args);
      case 'startConversation':
        return await this.handleStartConversation(db, world, args);
      case 'acceptInvite':
        return await this.handleAcceptInvite(db, world, args);
      case 'rejectInvite':
        return await this.handleRejectInvite(db, world, args);
      case 'leaveConversation':
        return await this.handleLeaveConversation(db, world, args);
      case 'finishSpeaking':
        return await this.handleFinishSpeaking(db, world, args);
      case 'walkTo':
        return await this.handleWalkTo(db, world, args);
      case 'agentSendMessage':
        return await this.handleAgentSendMessage(db, world, args);
      case 'agentWakeUp':
        return await this.handleAgentWakeUp(db, world, args);
      case 'stop':
        await this.stop(db);
        return { stopped: true };
      case 'start':
        await this.start(db);
        return { started: true };
      case 'restart':
        await this.restart(db, world);
        return { restarted: true };
      default:
        throw new Error(`Unknown input: ${name}`);
    }
  }

  async load(db: DatabaseReader): Promise<World> {
    const worldDoc = await db.get(this.world.id);
    if (!worldDoc) {
      throw new Error(`World ${this.world.id} not found`);
    }
    return new World(worldDoc);
  }

  async save(db: DatabaseWriter, world: World): Promise<void> {
    await db.patch(world.id, world.serialize());
  }

  // Input handlers
  private async handleJoin(db: DatabaseWriter, world: World, args: any) {
    const player = await world.addPlayer(db, args.name, args.character, args.description);
    return { playerId: player.id, joined: true };
  }

  private async handleLeave(db: DatabaseWriter, world: World, args: any) {
    await world.removePlayer(db, args.playerId);
    return { playerId: args.playerId, left: true };
  }

  private async handleSendMessage(db: DatabaseWriter, world: World, args: any) {
    const player = world.players.get(args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }

    if (!player.conversationId) {
      throw new Error(`Player ${args.playerId} is not in a conversation`);
    }

    const conversation = world.conversations.get(player.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${player.conversationId} not found`);
    }

    await conversation.addMessage(db, args.playerId, args.text, args.messageUuid);
    return { messageSent: true };
  }

  private async handleStartConversation(db: DatabaseWriter, world: World, args: any) {
    const conversation = await world.startConversation(db, args.playerId, args.invitee);
    return { conversationId: conversation.id, started: true };
  }

  private async handleAcceptInvite(db: DatabaseWriter, world: World, args: any) {
    const conversation = world.conversations.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }

    await conversation.acceptInvite(db, args.playerId);
    return { conversationId: args.conversationId, accepted: true };
  }

  private async handleRejectInvite(db: DatabaseWriter, world: World, args: any) {
    const conversation = world.conversations.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }

    await conversation.rejectInvite(db, args.playerId);
    return { conversationId: args.conversationId, rejected: true };
  }

  private async handleLeaveConversation(db: DatabaseWriter, world: World, args: any) {
    const conversation = world.conversations.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }

    await conversation.leave(db, args.playerId);
    return { conversationId: args.conversationId, left: true };
  }

  private async handleFinishSpeaking(db: DatabaseWriter, world: World, args: any) {
    const conversation = world.conversations.get(args.conversationId);
    if (!conversation) {
      throw new Error(`Conversation ${args.conversationId} not found`);
    }

    await conversation.finishSpeaking(db, args.playerId);
    return { conversationId: args.conversationId, finished: true };
  }

  private async handleWalkTo(db: DatabaseWriter, world: World, args: any) {
    const player = world.players.get(args.playerId);
    if (!player) {
      throw new Error(`Player ${args.playerId} not found`);
    }

    await player.walkTo(args.destination);
    return { playerId: args.playerId, walking: true };
  }

  private async handleAgentSendMessage(db: DatabaseWriter, world: World, args: any) {
    const agent = world.agents.get(args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    await agent.sendMessage(db, args.text, args.messageUuid, args.leaveConversation);
    return { agentId: args.agentId, messageSent: true };
  }

  private async handleAgentWakeUp(db: DatabaseWriter, world: World, args: any) {
    const agent = world.agents.get(args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    await agent.wakeUp(db);
    return { agentId: args.agentId, awake: true };
  }

  private async restart(db: DatabaseWriter, world: World) {
    // Reset world state
    await world.restart(db);
    await this.incrementGeneration(db);
  }
}