import { v, Infer } from 'convex/values';
import { DatabaseWriter } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { conversationId } from './ids';

export const serializedAgent = {
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
    v.literal('sleeping'),
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
  // SYRP-DGM specific fields
  trustScore: v.number(),
  reputationHistory: v.array(v.object({
    timestamp: v.number(),
    action: v.string(),
    impact: v.number(),
    context: v.string(),
  })),
  socialConnections: v.array(v.object({
    agentId: v.string(),
    trustLevel: v.number(),
    interactionCount: v.number(),
    lastInteraction: v.number(),
  })),
  currentGoal: v.optional(v.object({
    type: v.string(),
    target: v.optional(v.string()),
    priority: v.number(),
    deadline: v.optional(v.number()),
  })),
  emotionalState: v.object({
    happiness: v.number(),
    stress: v.number(),
    energy: v.number(),
    sociability: v.number(),
  }),
  lastWakeUp: v.number(),
  sleepUntil: v.optional(v.number()),
  memoryImportanceThreshold: v.number(),
};
export type SerializedAgent = Infer<typeof serializedAgent>;

export class Agent {
  id: string;
  name: string;
  character: string;
  position: { x: number; y: number };
  facing: { x: number; y: number };
  speed: number;
  conversationId?: string;
  status: 'idle' | 'walking' | 'talking' | 'thinking' | 'sleeping';
  lastActivity: number;
  pathfinding?: {
    destination: { x: number; y: number };
    path: { x: number; y: number }[];
    currentStep: number;
  };
  
  // SYRP-DGM specific properties
  trustScore: number;
  reputationHistory: Array<{
    timestamp: number;
    action: string;
    impact: number;
    context: string;
  }>;
  socialConnections: Array<{
    agentId: string;
    trustLevel: number;
    interactionCount: number;
    lastInteraction: number;
  }>;
  currentGoal?: {
    type: string;
    target?: string;
    priority: number;
    deadline?: number;
  };
  emotionalState: {
    happiness: number;
    stress: number;
    energy: number;
    sociability: number;
  };
  lastWakeUp: number;
  sleepUntil?: number;
  memoryImportanceThreshold: number;

  constructor(serialized: SerializedAgent) {
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
    this.trustScore = serialized.trustScore;
    this.reputationHistory = serialized.reputationHistory;
    this.socialConnections = serialized.socialConnections;
    this.currentGoal = serialized.currentGoal;
    this.emotionalState = serialized.emotionalState;
    this.lastWakeUp = serialized.lastWakeUp;
    this.sleepUntil = serialized.sleepUntil;
    this.memoryImportanceThreshold = serialized.memoryImportanceThreshold;
  }

  static create(id: string, name: string, character: string): Agent {
    return new Agent({
      id,
      name,
      character,
      position: { x: Math.random() * 100, y: Math.random() * 100 },
      facing: { x: 0, y: 1 },
      speed: 1.0,
      status: 'idle',
      lastActivity: Date.now(),
      trustScore: 50.0, // Start with neutral trust
      reputationHistory: [],
      socialConnections: [],
      emotionalState: {
        happiness: 50.0,
        stress: 20.0,
        energy: 80.0,
        sociability: 60.0,
      },
      lastWakeUp: Date.now(),
      memoryImportanceThreshold: 5.0,
    });
  }

  serialize(): SerializedAgent {
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
      trustScore: this.trustScore,
      reputationHistory: this.reputationHistory,
      socialConnections: this.socialConnections,
      currentGoal: this.currentGoal,
      emotionalState: this.emotionalState,
      lastWakeUp: this.lastWakeUp,
      sleepUntil: this.sleepUntil,
      memoryImportanceThreshold: this.memoryImportanceThreshold,
    };
  }

  // Save agent to database
  async save(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<void> {
    const existing = await db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', this.id))
      .first();

    if (existing) {
      await db.patch(existing._id, this.serialize());
    } else {
      await db.insert('archivedAgents', {
        worldId,
        ...this.serialize(),
      });
    }
  }

  // Archive agent data
  async archive(db: DatabaseWriter, worldId: Id<'worlds'>): Promise<void> {
    await this.save(db, worldId);
  }

  // SYRP-DGM: Update trust score based on interaction
  updateTrustScore(delta: number, action: string, context: string): void {
    const oldScore = this.trustScore;
    this.trustScore = Math.max(0, Math.min(100, this.trustScore + delta));
    
    // Record reputation history
    this.reputationHistory.push({
      timestamp: Date.now(),
      action,
      impact: delta,
      context,
    });

    // Keep only recent history (last 100 entries)
    if (this.reputationHistory.length > 100) {
      this.reputationHistory = this.reputationHistory.slice(-100);
    }

    // Update emotional state based on trust change
    if (delta > 0) {
      this.emotionalState.happiness = Math.min(100, this.emotionalState.happiness + delta * 0.5);
      this.emotionalState.stress = Math.max(0, this.emotionalState.stress - delta * 0.3);
    } else {
      this.emotionalState.stress = Math.min(100, this.emotionalState.stress + Math.abs(delta) * 0.4);
      this.emotionalState.happiness = Math.max(0, this.emotionalState.happiness + delta * 0.3);
    }
  }

  // SYRP-DGM: Update social connection with another agent
  updateSocialConnection(agentId: string, trustDelta: number): void {
    let connection = this.socialConnections.find(c => c.agentId === agentId);
    
    if (!connection) {
      connection = {
        agentId,
        trustLevel: 50.0,
        interactionCount: 0,
        lastInteraction: Date.now(),
      };
      this.socialConnections.push(connection);
    }

    connection.trustLevel = Math.max(0, Math.min(100, connection.trustLevel + trustDelta));
    connection.interactionCount++;
    connection.lastInteraction = Date.now();

    // Update sociability based on interaction
    this.emotionalState.sociability = Math.min(100, this.emotionalState.sociability + 1);
  }

  // SYRP-DGM: Get trust level with specific agent
  getTrustLevel(agentId: string): number {
    const connection = this.socialConnections.find(c => c.agentId === agentId);
    return connection ? connection.trustLevel : 50.0; // Default neutral trust
  }

  // SYRP-DGM: Decide whether to trust an agent for a specific action
  shouldTrust(agentId: string, actionType: string, threshold: number = 60): boolean {
    const trustLevel = this.getTrustLevel(agentId);
    const globalTrust = this.trustScore;
    
    // Combine personal trust with global reputation
    const combinedTrust = (trustLevel * 0.7) + (globalTrust * 0.3);
    
    // Adjust based on emotional state
    const emotionalModifier = (this.emotionalState.happiness - this.emotionalState.stress) * 0.1;
    const finalTrust = combinedTrust + emotionalModifier;
    
    return finalTrust >= threshold;
  }

  // SYRP-DGM: Set current goal
  setGoal(type: string, target?: string, priority: number = 5, deadline?: number): void {
    this.currentGoal = {
      type,
      target,
      priority,
      deadline,
    };
  }

  // SYRP-DGM: Clear current goal
  clearGoal(): void {
    this.currentGoal = undefined;
  }

  // SYRP-DGM: Check if agent should sleep
  shouldSleep(now: number): boolean {
    const hoursSinceWakeUp = (now - this.lastWakeUp) / (1000 * 60 * 60);
    const energyThreshold = 30;
    
    return this.emotionalState.energy < energyThreshold || hoursSinceWakeUp > 16;
  }

  // SYRP-DGM: Put agent to sleep
  goToSleep(duration: number = 8 * 60 * 60 * 1000): void { // Default 8 hours
    this.status = 'sleeping';
    this.sleepUntil = Date.now() + duration;
    this.emotionalState.energy = Math.min(100, this.emotionalState.energy + 20);
  }

  // SYRP-DGM: Wake up agent
  async wakeUp(db: DatabaseWriter): Promise<void> {
    this.status = 'idle';
    this.sleepUntil = undefined;
    this.lastWakeUp = Date.now();
    this.emotionalState.energy = 100;
    this.emotionalState.stress = Math.max(0, this.emotionalState.stress - 20);
  }

  // Movement and pathfinding
  async walkTo(destination: { x: number; y: number }): Promise<void> {
    if (this.status === 'sleeping') return;
    
    const path = [destination]; // Simple pathfinding for now
    
    this.pathfinding = {
      destination,
      path,
      currentStep: 0,
    };
    
    this.status = 'walking';
    this.lastActivity = Date.now();
  }

  stopWalking(): void {
    this.pathfinding = undefined;
    this.status = 'idle';
    this.lastActivity = Date.now();
  }

  // Conversation management
  joinConversation(conversationId: string): void {
    this.conversationId = conversationId;
    this.status = 'talking';
    this.stopWalking();
    this.lastActivity = Date.now();
    
    // Increase sociability when joining conversations
    this.emotionalState.sociability = Math.min(100, this.emotionalState.sociability + 2);
  }

  leaveConversation(): void {
    this.conversationId = undefined;
    this.status = 'idle';
    this.lastActivity = Date.now();
  }

  // Send message in conversation
  async sendMessage(
    db: DatabaseWriter,
    text: string,
    messageUuid: string,
    leaveConversation: boolean = false,
  ): Promise<void> {
    if (!this.conversationId) {
      throw new Error(`Agent ${this.id} is not in a conversation`);
    }

    // Store message in database
    await db.insert('messages', {
      conversationId: this.conversationId,
      messageUuid,
      author: this.id,
      text,
    });

    // Update activity
    this.lastActivity = Date.now();

    // Leave conversation if requested
    if (leaveConversation) {
      this.leaveConversation();
    }
  }

  // Main agent update loop
  async tick(db: DatabaseWriter, now: number): Promise<void> {
    // Check if agent should wake up
    if (this.status === 'sleeping') {
      if (this.sleepUntil && now >= this.sleepUntil) {
        await this.wakeUp(db);
      } else {
        return; // Still sleeping
      }
    }

    // Check if agent should go to sleep
    if (this.shouldSleep(now)) {
      this.goToSleep();
      return;
    }

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

    // Gradually recover energy and reduce stress over time
    this.emotionalState.energy = Math.min(100, this.emotionalState.energy + 0.1);
    this.emotionalState.stress = Math.max(0, this.emotionalState.stress - 0.05);

    // Decay sociability if not interacting
    const timeSinceActivity = now - this.lastActivity;
    if (timeSinceActivity > 60000) { // 1 minute
      this.emotionalState.sociability = Math.max(0, this.emotionalState.sociability - 0.1);
    }

    // Update activity timestamp
    this.lastActivity = now;
  }

  // Check if agent is near another position
  isNear(position: { x: number; y: number }, radius: number = 2.0): boolean {
    const dx = this.position.x - position.x;
    const dy = this.position.y - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= radius;
  }

  // Get agent's current activity description
  getActivityDescription(): string {
    switch (this.status) {
      case 'walking':
        return `${this.name} is walking around`;
      case 'talking':
        return `${this.name} is in a conversation`;
      case 'thinking':
        return `${this.name} is thinking`;
      case 'sleeping':
        return `${this.name} is sleeping`;
      case 'idle':
      default:
        return `${this.name} is standing around`;
    }
  }

  // Check if agent can start a conversation
  canStartConversation(): boolean {
    return this.status !== 'sleeping' && this.status !== 'talking' && !this.conversationId;
  }

  // Check if agent is available for interaction
  isAvailable(): boolean {
    return this.status !== 'sleeping' && (this.status !== 'talking' || !this.conversationId);
  }

  // SYRP-DGM: Get agent's reputation summary
  getReputationSummary(): {
    trustScore: number;
    recentActions: number;
    socialConnections: number;
    emotionalState: typeof this.emotionalState;
  } {
    const recentActions = this.reputationHistory.filter(
      h => Date.now() - h.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    return {
      trustScore: this.trustScore,
      recentActions,
      socialConnections: this.socialConnections.length,
      emotionalState: { ...this.emotionalState },
    };
  }
}