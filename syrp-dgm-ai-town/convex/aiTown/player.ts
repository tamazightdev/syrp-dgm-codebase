import { v, Infer } from 'convex/values';
import { DatabaseWriter } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { conversationId } from './ids';

export const serializedPlayer = {
  id: v.string(),
  name: v.string(),
  character: v.string(),
  position: v.object({
    x: v.number(),
    y: v.number(),
  }),
  facing: v.object({
    x: v.number(),
    y: v.number(),
  }),
  speed: v.number(),
  conversationId: v.optional(conversationId),
  status: v.union(
    v.literal('idle'),
    v.literal('walking'),
    v.literal('talking'),
    v.literal('thinking'),
  ),
  lastActivity: v.number(),
  pathfinding: v.optional(v.object({
    destination: v.object({
      x: v.number(),
      y: v.number(),
    }),
    path: v.array(v.object({
      x: v.number(),
      y: v.number(),
    })),
    currentStep: v.number(),
  })),
};
export type SerializedPlayer = Infer<typeof serializedPlayer>;

export class Player {
  id: string;
  name: string;
  character: string;
  position: { x: number; y: number };
  facing: { x: number; y: number };
  speed: number;
  conversationId?: string;
  status: 'idle' | 'walking' | 'talking' | 'thinking';
  lastActivity: number;
  pathfinding?: {
    destination: { x: number; y: number };
    path: { x: number; y: number }[];
    currentStep: number;
  };

  constructor(serialized: SerializedPlayer) {
    this.id = serialized.id;
    this.name = serialized.name;
    this.character = serialized.character;
    this.position = serialized.position;
    this.facing = serialized.facing;
    this.speed = serialized.speed;
    this.conversationId = serialized.conversationId;
    this.status = serialized.status;
    this.lastActivity = serialized.lastActivity;
    this.pathfinding = serialized.pathfinding;
  }

  static create(id: string, name: string, character: string): Player {
    return new Player({
      id,
      name,
      character,
      position: { x: 0, y: 0 }, // Default spawn position
      facing: { x: 0, y: 1 }, // Facing down
      speed: 1.0,
      status: 'idle',
      lastActivity: Date.now(),
    });
  }

  serialize(): SerializedPlayer {
    return {
      id: this.id,
      name: this.name,
      character: this.character,
      position: this.position,
      facing: this.facing,
      speed: this.speed,
      conversationId: this.conversationId,
      status: this.status,
      lastActivity: this.lastActivity,
      pathfinding: this.pathfinding,
    };
  }

  // Save player to database
  async save(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<void> {
    const existing = await db
      .query('archivedPlayers')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', this.id))
      .first();

    if (existing) {
      await db.patch(existing._id, this.serialize());
    } else {
      await db.insert('archivedPlayers', {
        worldId,
        ...this.serialize(),
      });
    }
  }

  // Archive player data
  async archive(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<void> {
    await this.save(db, worldId);
  }

  // Start walking to a destination
  async walkTo(destination: { x: number; y: number }): Promise<void> {
    // Simple pathfinding - direct line for now
    const path = [destination];
    
    this.pathfinding = {
      destination,
      path,
      currentStep: 0,
    };
    
    this.status = 'walking';
    this.lastActivity = Date.now();
  }

  // Stop walking
  stopWalking(): void {
    this.pathfinding = undefined;
    this.status = 'idle';
    this.lastActivity = Date.now();
  }

  // Update player state
  async tick(db: DatabaseWriter, now: number): Promise<void> {
    // Handle walking
    if (this.status === 'walking' && this.pathfinding) {
      const { destination, path, currentStep } = this.pathfinding;
      
      if (currentStep < path.length) {
        const target = path[currentStep];
        const dx = target.x - this.position.x;
        const dy = target.y - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.1) {
          // Reached current step
          this.pathfinding.currentStep++;
          
          if (this.pathfinding.currentStep >= path.length) {
            // Reached destination
            this.position = destination;
            this.stopWalking();
          }
        } else {
          // Move towards target
          const moveDistance = this.speed * 0.016; // 16ms tick
          const moveX = (dx / distance) * moveDistance;
          const moveY = (dy / distance) * moveDistance;
          
          this.position.x += moveX;
          this.position.y += moveY;
          
          // Update facing direction
          this.facing.x = dx / distance;
          this.facing.y = dy / distance;
        }
      }
    }

    // Update activity timestamp
    this.lastActivity = now;
  }

  // Join a conversation
  joinConversation(conversationId: string): void {
    this.conversationId = conversationId;
    this.status = 'talking';
    this.stopWalking(); // Stop any movement
    this.lastActivity = Date.now();
  }

  // Leave a conversation
  leaveConversation(): void {
    this.conversationId = undefined;
    this.status = 'idle';
    this.lastActivity = Date.now();
  }

  // Check if player is near another position
  isNear(position: { x: number; y: number }, radius: number = 2.0): boolean {
    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= radius;
  }

  // Get player's current activity description
  getActivityDescription(): string {
    switch (this.status) {
      case 'walking':
        return `${this.name} is walking`;
      case 'talking':
        return `${this.name} is in a conversation`;
      case 'thinking':
        return `${this.name} is thinking`;
      case 'idle':
      default:
        return `${this.name} is standing around`;
    }
  }

  // Check if player can start a conversation
  canStartConversation(): boolean {
    return this.status === 'idle' && !this.conversationId;
  }

  // Check if player is available for interaction
  isAvailable(): boolean {
    return this.status !== 'talking' || !this.conversationId;
  }
}