import { v, Infer } from 'convex/values';
import { DatabaseWriter } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { playerId, conversationId } from './ids';

export const serializedConversation = {
  id: conversationId,
  creator: playerId,
  created: v.number(),
  ended: v.optional(v.number()),
  lastMessage: v.optional(v.object({
    author: playerId,
    text: v.string(),
    timestamp: v.number(),
    messageUuid: v.string(),
  })),
  numMessages: v.number(),
  participants: v.array(playerId),
  invited: v.array(playerId),
  status: v.union(
    v.literal('waiting'),
    v.literal('active'),
    v.literal('ended'),
  ),
  currentSpeaker: v.optional(playerId),
  speakingUntil: v.optional(v.number()),
  inactivityTimeout: v.optional(v.number()),
};
export type SerializedConversation = Infer<typeof serializedConversation>;

export class Conversation {
  id: string;
  creator: string;
  created: number;
  ended?: number;
  lastMessage?: {
    author: string;
    text: string;
    timestamp: number;
    messageUuid: string;
  };
  numMessages: number;
  participants: string[];
  invited: string[];
  status: 'waiting' | 'active' | 'ended';
  currentSpeaker?: string;
  speakingUntil?: number;
  inactivityTimeout?: number;

  constructor(serialized: SerializedConversation) {
    this.id = serialized.id;
    this.creator = serialized.creator;
    this.created = serialized.created;
    this.ended = serialized.ended;
    this.lastMessage = serialized.lastMessage;
    this.numMessages = serialized.numMessages;
    this.participants = serialized.participants;
    this.invited = serialized.invited;
    this.status = serialized.status;
    this.currentSpeaker = serialized.currentSpeaker;
    this.speakingUntil = serialized.speakingUntil;
    this.inactivityTimeout = serialized.inactivityTimeout;
  }

  static create(id: string, creator: string, invited: string[]): Conversation {
    return new Conversation({
      id,
      creator,
      created: Date.now(),
      numMessages: 0,
      participants: [creator],
      invited: invited.filter(p => p !== creator),
      status: invited.length > 1 ? 'waiting' : 'active',
    });
  }

  serialize(): SerializedConversation {
    return {
      id: this.id,
      creator: this.creator,
      created: this.created,
      ended: this.ended,
      lastMessage: this.lastMessage,
      numMessages: this.numMessages,
      participants: this.participants,
      invited: this.invited,
      status: this.status,
      currentSpeaker: this.currentSpeaker,
      speakingUntil: this.speakingUntil,
      inactivityTimeout: this.inactivityTimeout,
    };
  }

  // Save conversation to database
  async save(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<void> {
    const existing = await db
      .query('archivedConversations')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', this.id))
      .first();

    if (existing) {
      await db.patch(existing._id, this.serialize());
    } else {
      await db.insert('archivedConversations', {
        worldId,
        ...this.serialize(),
      });
    }
  }

  // Archive conversation data
  async archive(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<void> {
    this.status = 'ended';
    this.ended = Date.now();
    await this.save(db, worldId);
  }

  // Accept an invitation to join the conversation
  async acceptInvite(db: DatabaseWriter, playerId: string): Promise<void> {
    if (!this.invited.includes(playerId)) {
      throw new Error(`Player ${playerId} was not invited to this conversation`);
    }

    // Move from invited to participants
    this.invited = this.invited.filter(p => p !== playerId);
    this.participants.push(playerId);

    // Start conversation if all invites are resolved
    if (this.invited.length === 0 && this.status === 'waiting') {
      this.status = 'active';
      this.inactivityTimeout = Date.now() + 30000; // 30 second timeout
    }
  }

  // Reject an invitation
  async rejectInvite(db: DatabaseWriter, playerId: string): Promise<void> {
    if (!this.invited.includes(playerId)) {
      throw new Error(`Player ${playerId} was not invited to this conversation`);
    }

    // Remove from invited list
    this.invited = this.invited.filter(p => p !== playerId);

    // End conversation if no one accepted
    if (this.invited.length === 0 && this.participants.length === 1) {
      this.status = 'ended';
      this.ended = Date.now();
    }
  }

  // Add a message to the conversation
  async addMessage(
    db: DatabaseWriter,
    author: string,
    text: string,
    messageUuid: string,
  ): Promise<void> {
    if (!this.participants.includes(author)) {
      throw new Error(`Player ${author} is not a participant in this conversation`);
    }

    if (this.status !== 'active') {
      throw new Error('Conversation is not active');
    }

    // Check if it's the speaker's turn
    if (this.currentSpeaker && this.currentSpeaker !== author) {
      throw new Error(`It's ${this.currentSpeaker}'s turn to speak`);
    }

    const timestamp = Date.now();

    // Store message in database
    await db.insert('messages', {
      conversationId: this.id,
      messageUuid,
      author,
      text,
    });

    // Update conversation state
    this.lastMessage = {
      author,
      text,
      timestamp,
      messageUuid,
    };
    this.numMessages++;
    this.currentSpeaker = author;
    this.speakingUntil = timestamp + 10000; // 10 seconds to continue speaking
    this.inactivityTimeout = timestamp + 60000; // 1 minute inactivity timeout
  }

  // Finish speaking (pass turn to next participant)
  async finishSpeaking(db: DatabaseWriter, playerId: string): Promise<void> {
    if (this.currentSpeaker !== playerId) {
      throw new Error(`Player ${playerId} is not the current speaker`);
    }

    // Clear current speaker
    this.currentSpeaker = undefined;
    this.speakingUntil = undefined;
    
    // Reset inactivity timeout
    this.inactivityTimeout = Date.now() + 30000; // 30 seconds for next person to speak
  }

  // Leave the conversation
  async leave(db: DatabaseWriter, playerId: string): Promise<void> {
    // Remove from participants
    this.participants = this.participants.filter(p => p !== playerId);
    
    // Remove from invited if still pending
    this.invited = this.invited.filter(p => p !== playerId);

    // Clear speaker if they were speaking
    if (this.currentSpeaker === playerId) {
      this.currentSpeaker = undefined;
      this.speakingUntil = undefined;
    }

    // End conversation if no participants left
    if (this.participants.length === 0) {
      this.status = 'ended';
      this.ended = Date.now();
    } else if (this.participants.length === 1) {
      // End conversation if only one person left
      this.status = 'ended';
      this.ended = Date.now();
    }
  }

  // Update conversation state
  async tick(db: DatabaseWriter, now: number): Promise<void> {
    if (this.status !== 'active') {
      return;
    }

    // Check speaking timeout
    if (this.speakingUntil && now > this.speakingUntil) {
      this.currentSpeaker = undefined;
      this.speakingUntil = undefined;
    }

    // Check inactivity timeout
    if (this.inactivityTimeout && now > this.inactivityTimeout) {
      this.status = 'ended';
      this.ended = now;
    }
  }

  // Check if conversation is finished
  isFinished(): boolean {
    return this.status === 'ended';
  }

  // Check if a player can speak
  canSpeak(playerId: string): boolean {
    if (!this.participants.includes(playerId)) {
      return false;
    }

    if (this.status !== 'active') {
      return false;
    }

    // Can speak if no current speaker or if they are the current speaker
    return !this.currentSpeaker || this.currentSpeaker === playerId;
  }

  // Get conversation summary
  getSummary(): string {
    const participantCount = this.participants.length;
    const messageCount = this.numMessages;
    
    if (this.status === 'waiting') {
      return `Waiting for ${this.invited.length} participants to join`;
    } else if (this.status === 'active') {
      return `Active conversation with ${participantCount} participants (${messageCount} messages)`;
    } else {
      return `Ended conversation with ${participantCount} participants (${messageCount} messages)`;
    }
  }

  // Get next speaker (simple round-robin)
  getNextSpeaker(): string | undefined {
    if (this.participants.length === 0) {
      return undefined;
    }

    if (!this.currentSpeaker) {
      return this.participants[0];
    }

    const currentIndex = this.participants.indexOf(this.currentSpeaker);
    const nextIndex = (currentIndex + 1) % this.participants.length;
    return this.participants[nextIndex];
  }

  // Check if conversation needs attention (timeouts, etc.)
  needsAttention(now: number): boolean {
    if (this.status !== 'active') {
      return false;
    }

    // Check if speaking timeout expired
    if (this.speakingUntil && now > this.speakingUntil) {
      return true;
    }

    // Check if inactivity timeout is approaching
    if (this.inactivityTimeout && now > this.inactivityTimeout - 10000) {
      return true;
    }

    return false;
  }
}