import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { playerId } from './ids';
import { Agent } from './agent';
import { AgentMemory, calculateMemoryImportance } from '../agent/memory';
import { AgentConversation } from '../agent/conversation';
import { EmbeddingsCache } from '../agent/embeddingsCache';

// Create a new agent
export const createAgent = mutation({
  args: {
    worldId: v.id('worlds'),
    name: v.string(),
    character: v.string(),
    description: v.string(),
  },
  handler: async (ctx, { worldId, name, character, description }) => {
    // Get world to allocate ID
    const world = await ctx.db.get(worldId);
    if (!world) {
      throw new Error(`World ${worldId} not found`);
    }

    // Generate agent ID
    const agentId = world.nextId.toString();
    
    // Update world's next ID
    await ctx.db.patch(worldId, {
      nextId: world.nextId + 1,
    });

    // Create agent description
    await ctx.db.insert('agentDescriptions', {
      worldId,
      agentId,
      name,
      character,
      description,
    });

    // Create agent
    const agent = Agent.create(agentId, name, character);
    
    // Save agent
    await ctx.db.insert('archivedAgents', {
      worldId,
      ...agent.serialize(),
    });

    // Create initial memories
    const memory = new AgentMemory(agentId);
    
    // Create memory about self
    await memory.createMemory(
      ctx.db,
      `I am ${name}, ${description}. I have just awakened in this world.`,
      8, // High importance for self-knowledge
      { type: 'reflection' }
    );

    return { agentId };
  },
});

// Get agent information
export const getAgent = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
  },
  handler: async (ctx, { worldId, agentId }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      return null;
    }

    const agent = new Agent(agentDoc);
    return {
      ...agent.serialize(),
      reputation: agent.getReputationSummary(),
    };
  },
});

// Update agent's trust score
export const updateAgentTrust = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    delta: v.number(),
    action: v.string(),
    context: v.string(),
  },
  handler: async (ctx, { worldId, agentId, delta, action, context }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agent = new Agent(agentDoc);
    agent.updateTrustScore(delta, action, context);

    // Save updated agent
    await ctx.db.patch(agentDoc._id, agent.serialize());

    // Create memory about the trust change
    const memory = new AgentMemory(agentId);
    const importance = calculateMemoryImportance(
      `My trust was ${delta > 0 ? 'increased' : 'decreased'} due to ${action}: ${context}`,
      {
        emotionalImpact: Math.abs(delta) * 0.5,
        socialRelevance: 3,
        novelty: 2,
        personalRelevance: 5,
      }
    );

    await memory.createMemory(
      ctx.db,
      `My trust was ${delta > 0 ? 'increased' : 'decreased'} due to ${action}: ${context}`,
      importance,
      { type: 'reflection' }
    );

    return { newTrustScore: agent.trustScore };
  },
});

// Update social connection between agents
export const updateSocialConnection = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    otherAgentId: playerId,
    trustDelta: v.number(),
    context: v.string(),
  },
  handler: async (ctx, { worldId, agentId, otherAgentId, trustDelta, context }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agent = new Agent(agentDoc);
    agent.updateSocialConnection(otherAgentId, trustDelta);

    // Save updated agent
    await ctx.db.patch(agentDoc._id, agent.serialize());

    // Create memory about the interaction
    const memory = new AgentMemory(agentId);
    const otherAgentDoc = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('agentId', otherAgentId))
      .first();

    const otherAgentName = otherAgentDoc?.name || 'someone';
    const importance = calculateMemoryImportance(
      `I had an interaction with ${otherAgentName}: ${context}`,
      {
        emotionalImpact: Math.abs(trustDelta) * 0.3,
        socialRelevance: 5,
        novelty: 3,
        personalRelevance: 4,
      }
    );

    await memory.createRelationshipMemory(
      ctx.db,
      otherAgentId,
      `I had an interaction with ${otherAgentName}: ${context}`,
      importance
    );

    return { 
      newTrustLevel: agent.getTrustLevel(otherAgentId),
      interactionCount: agent.socialConnections.find(c => c.agentId === otherAgentId)?.interactionCount || 0,
    };
  },
});

// Agent decision making for conversations
export const shouldStartConversation = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    targetAgentId: playerId,
    proximity: v.number(),
  },
  handler: async (ctx, { worldId, agentId, targetAgentId, proximity }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      return false;
    }

    const agent = new Agent(agentDoc);
    const conversation = new AgentConversation(agentId);

    // Check if agents have shared history
    const memory = new AgentMemory(agentId);
    const sharedMemories = await memory.getMemoriesAboutAgent(ctx.db, targetAgentId);
    const sharedHistory = sharedMemories.length > 0;

    const context = {
      proximity,
      sharedHistory,
      currentMood: agent.emotionalState.happiness - agent.emotionalState.stress,
      trustLevel: agent.getTrustLevel(targetAgentId),
    };

    return await conversation.shouldStartConversation(ctx.db, targetAgentId, context);
  },
});

// Generate conversation starter
export const generateConversationStarter = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    targetAgentId: playerId,
    location: v.optional(v.string()),
    timeOfDay: v.optional(v.string()),
  },
  handler: async (ctx, { worldId, agentId, targetAgentId, location, timeOfDay }) => {
    const conversation = new AgentConversation(agentId);
    const memory = new AgentMemory(agentId);

    // Get shared memories
    const sharedMemories = await memory.getMemoriesAboutAgent(ctx.db, targetAgentId);
    const memoryDescriptions = sharedMemories.map(m => m.description);

    const context = {
      location: location || 'this place',
      timeOfDay: timeOfDay || 'day',
      sharedMemories: memoryDescriptions,
      currentEvents: [], // Could be populated with world events
    };

    return await conversation.generateConversationStarter(ctx.db, targetAgentId, context);
  },
});

// Generate response to message
export const generateResponse = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    message: v.string(),
    senderAgentId: playerId,
    conversationHistory: v.array(v.string()),
  },
  handler: async (ctx, { worldId, agentId, message, senderAgentId, conversationHistory }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agent = new Agent(agentDoc);
    const conversation = new AgentConversation(agentId);
    const memory = new AgentMemory(agentId);

    // Get agent description for personality
    const agentDesc = await ctx.db
      .query('agentDescriptions')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('agentId', agentId))
      .first();

    // Get relevant memories
    const relevantMemories = await memory.retrieveMemories(ctx.db, message, 5);
    const memoryDescriptions = relevantMemories.map(m => m.description);

    const context = {
      conversationHistory,
      senderTrustLevel: agent.getTrustLevel(senderAgentId),
      currentMood: agent.emotionalState.happiness - agent.emotionalState.stress,
      personality: agentDesc?.character || 'friendly',
      memories: memoryDescriptions,
    };

    return await conversation.generateResponse(ctx.db, message, context);
  },
});

// Check if agent should leave conversation
export const shouldLeaveConversation = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    conversationLength: v.number(),
    lastMessageTime: v.number(),
    participantCount: v.number(),
  },
  handler: async (ctx, { worldId, agentId, conversationLength, lastMessageTime, participantCount }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      return true; // Leave if agent not found
    }

    const agent = new Agent(agentDoc);
    const conversation = new AgentConversation(agentId);

    const context = {
      conversationLength,
      lastMessageTime,
      participantCount,
      currentMood: agent.emotionalState.happiness - agent.emotionalState.stress,
      hasGoals: agent.currentGoal !== undefined,
    };

    return await conversation.shouldLeaveConversation(ctx.db, context);
  },
});

// Create memory from conversation
export const createConversationMemory = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    conversationId: v.string(),
    participantIds: v.array(playerId),
    summary: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, { worldId, agentId, conversationId, participantIds, summary, importance }) => {
    const memory = new AgentMemory(agentId);
    
    const memoryId = await memory.createConversationMemory(
      ctx.db,
      conversationId,
      participantIds,
      summary,
      importance
    );

    return { memoryId };
  },
});

// Get agent memories
export const getAgentMemories = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    query: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, query, limit = 10 }) => {
    const memory = new AgentMemory(agentId);
    
    if (query) {
      return await memory.retrieveMemories(ctx.db, query, limit);
    } else {
      // Get recent memories
      const memories = await ctx.db
        .query('memories')
        .withIndex('playerId', (q) => q.eq('playerId', agentId))
        .order('desc')
        .take(limit);

      return memories.map(m => ({
        id: m._id,
        description: m.description,
        importance: m.importance,
        lastAccess: m.lastAccess,
        data: m.data,
        relevanceScore: 1.0,
      }));
    }
  },
});

// Generate agent reflection
export const generateReflection = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
  },
  handler: async (ctx, { worldId, agentId }) => {
    const memory = new AgentMemory(agentId);
    
    // Get recent memories for reflection
    const recentMemories = await ctx.db
      .query('memories')
      .withIndex('playerId', (q) => q.eq('playerId', agentId))
      .order('desc')
      .take(20);

    const memoryData = recentMemories.map(m => ({
      id: m._id,
      description: m.description,
      importance: m.importance,
    }));

    const reflection = await memory.generateReflection(ctx.db, memoryData);
    
    return { reflection };
  },
});

// Set agent goal
export const setAgentGoal = mutation({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
    goalType: v.string(),
    target: v.optional(v.string()),
    priority: v.number(),
    deadline: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, agentId, goalType, target, priority, deadline }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const agent = new Agent(agentDoc);
    agent.setGoal(goalType, target, priority, deadline);

    // Save updated agent
    await ctx.db.patch(agentDoc._id, agent.serialize());

    // Create memory about the goal
    const memory = new AgentMemory(agentId);
    const importance = calculateMemoryImportance(
      `I set a new goal: ${goalType}${target ? ` (target: ${target})` : ''}`,
      {
        emotionalImpact: priority * 0.5,
        socialRelevance: target ? 3 : 1,
        novelty: 4,
        personalRelevance: 5,
      }
    );

    await memory.createMemory(
      ctx.db,
      `I set a new goal: ${goalType}${target ? ` (target: ${target})` : ''}`,
      importance,
      { type: 'reflection' }
    );

    return { goalSet: true };
  },
});

// Get agent statistics
export const getAgentStats = query({
  args: {
    worldId: v.id('worlds'),
    agentId: playerId,
  },
  handler: async (ctx, { worldId, agentId }) => {
    const agentDoc = await ctx.db
      .query('archivedAgents')
      .withIndex('worldId', (q) => q.eq('worldId', worldId).eq('id', agentId))
      .first();

    if (!agentDoc) {
      return null;
    }

    const agent = new Agent(agentDoc);
    
    // Get memory count
    const memoryCount = await ctx.db
      .query('memories')
      .withIndex('playerId', (q) => q.eq('playerId', agentId))
      .collect()
      .then(memories => memories.length);

    // Get conversation count
    const conversationCount = await ctx.db
      .query('messages')
      .filter((q) => q.eq(q.field('author'), agentId))
      .collect()
      .then(messages => new Set(messages.map(m => m.conversationId)).size);

    return {
      ...agent.getReputationSummary(),
      memoryCount,
      conversationCount,
      currentGoal: agent.currentGoal,
      status: agent.status,
      position: agent.position,
    };
  },
});