import { v } from 'convex/values';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { playerId, conversationId } from '../aiTown/ids';

// Memory importance scoring
export function calculateMemoryImportance(
  description: string,
  context: {
    emotionalImpact: number;
    socialRelevance: number;
    novelty: number;
    personalRelevance: number;
  }
): number {
  // Base importance from description length and content
  let importance = Math.min(description.length / 50, 3); // 0-3 based on length

  // Emotional impact (0-10 scale)
  importance += context.emotionalImpact;

  // Social relevance (0-5 scale)
  importance += context.socialRelevance;

  // Novelty factor (0-5 scale)
  importance += context.novelty;

  // Personal relevance (0-5 scale)
  importance += context.personalRelevance;

  // Normalize to 0-10 scale
  return Math.max(0, Math.min(10, importance));
}

// Memory management for agents
export class AgentMemory {
  agentId: string;

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  // Create a new memory
  async createMemory(
    db: DatabaseWriter,
    description: string,
    importance: number,
    data: {
      type: 'relationship' | 'conversation' | 'reflection';
      playerId?: string;
      conversationId?: string;
      playerIds?: string[];
      relatedMemoryIds?: Id<'memories'>[];
    }
  ): Promise<Id<'memories'>> {
    // Create embedding for the memory description
    const embeddingId = await this.createEmbedding(db, description);

    // Insert memory
    const memoryId = await db.insert('memories', {
      playerId: this.agentId,
      description,
      embeddingId,
      importance,
      lastAccess: Date.now(),
      data,
    });

    return memoryId;
  }

  // Create memory embedding
  private async createEmbedding(
    db: DatabaseWriter,
    text: string
  ): Promise<Id<'memoryEmbeddings'>> {
    // For now, create a simple hash-based embedding
    // In a real implementation, this would use an actual embedding model
    const embedding = this.generateSimpleEmbedding(text);

    const embeddingId = await db.insert('memoryEmbeddings', {
      playerId: this.agentId,
      embedding,
    });

    return embeddingId;
  }

  // Generate a simple embedding (placeholder for real embedding model)
  private generateSimpleEmbedding(text: string): number[] {
    const dimension = 384; // Common embedding dimension
    const embedding = new Array(dimension).fill(0);
    
    // Simple hash-based embedding
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const index = char % dimension;
      embedding[index] += 1;
    }
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimension; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }

  // Retrieve relevant memories based on query
  async retrieveMemories(
    db: DatabaseReader,
    query: string,
    limit: number = 10,
    minImportance: number = 3
  ): Promise<Array<{
    id: Id<'memories'>;
    description: string;
    importance: number;
    lastAccess: number;
    data: any;
    relevanceScore: number;
  }>> {
    // Get all memories for this agent above importance threshold
    const memories = await db
      .query('memories')
      .withIndex('playerId', (q) => q.eq('playerId', this.agentId))
      .filter((q) => q.gte(q.field('importance'), minImportance))
      .collect();

    // Calculate relevance scores
    const queryEmbedding = this.generateSimpleEmbedding(query);
    const scoredMemories = [];

    for (const memory of memories) {
      const embedding = await db.get(memory.embeddingId);
      if (!embedding) continue;

      const relevanceScore = this.calculateSimilarity(queryEmbedding, embedding.embedding);
      
      // Boost score based on recency and importance
      const recencyBoost = Math.max(0, 1 - (Date.now() - memory.lastAccess) / (7 * 24 * 60 * 60 * 1000)); // 7 days
      const importanceBoost = memory.importance / 10;
      const finalScore = relevanceScore + (recencyBoost * 0.2) + (importanceBoost * 0.3);

      scoredMemories.push({
        id: memory._id,
        description: memory.description,
        importance: memory.importance,
        lastAccess: memory.lastAccess,
        data: memory.data,
        relevanceScore: finalScore,
      });
    }

    // Sort by relevance and return top results
    scoredMemories.sort((a, b) => b.relevanceScore - a.relevanceScore);
    return scoredMemories.slice(0, limit);
  }

  // Calculate cosine similarity between embeddings
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  // Update memory access time
  async accessMemory(db: DatabaseWriter, memoryId: Id<'memories'>): Promise<void> {
    await db.patch(memoryId, {
      lastAccess: Date.now(),
    });
  }

  // Create relationship memory
  async createRelationshipMemory(
    db: DatabaseWriter,
    otherAgentId: string,
    description: string,
    importance: number
  ): Promise<Id<'memories'>> {
    return await this.createMemory(db, description, importance, {
      type: 'relationship',
      playerId: otherAgentId,
    });
  }

  // Create conversation memory
  async createConversationMemory(
    db: DatabaseWriter,
    conversationId: string,
    participantIds: string[],
    description: string,
    importance: number
  ): Promise<Id<'memories'>> {
    return await this.createMemory(db, description, importance, {
      type: 'conversation',
      conversationId,
      playerIds: participantIds,
    });
  }

  // Create reflection memory
  async createReflectionMemory(
    db: DatabaseWriter,
    description: string,
    importance: number,
    relatedMemoryIds: Id<'memories'>[]
  ): Promise<Id<'memories'>> {
    return await this.createMemory(db, description, importance, {
      type: 'reflection',
      relatedMemoryIds,
    });
  }

  // Get memories about a specific agent
  async getMemoriesAboutAgent(
    db: DatabaseReader,
    targetAgentId: string,
    limit: number = 5
  ): Promise<Array<{
    description: string;
    importance: number;
    lastAccess: number;
  }>> {
    const memories = await db
      .query('memories')
      .withIndex('playerId_type', (q) => 
        q.eq('playerId', this.agentId).eq('data.type', 'relationship')
      )
      .filter((q) => q.eq(q.field('data.playerId'), targetAgentId))
      .order('desc')
      .take(limit);

    return memories.map(memory => ({
      description: memory.description,
      importance: memory.importance,
      lastAccess: memory.lastAccess,
    }));
  }

  // Get conversation memories
  async getConversationMemories(
    db: DatabaseReader,
    limit: number = 10
  ): Promise<Array<{
    description: string;
    importance: number;
    conversationId: string;
    participants: string[];
  }>> {
    const memories = await db
      .query('memories')
      .withIndex('playerId_type', (q) => 
        q.eq('playerId', this.agentId).eq('data.type', 'conversation')
      )
      .order('desc')
      .take(limit);

    return memories.map(memory => ({
      description: memory.description,
      importance: memory.importance,
      conversationId: memory.data.conversationId || '',
      participants: memory.data.playerIds || [],
    }));
  }

  // Generate reflection based on recent memories
  async generateReflection(
    db: DatabaseWriter,
    recentMemories: Array<{
      id: Id<'memories'>;
      description: string;
      importance: number;
    }>
  ): Promise<string> {
    if (recentMemories.length === 0) {
      return "I haven't had many notable experiences lately.";
    }

    // Analyze patterns in recent memories
    const themes = this.extractThemes(recentMemories.map(m => m.description));
    const avgImportance = recentMemories.reduce((sum, m) => sum + m.importance, 0) / recentMemories.length;

    let reflection = "";

    if (avgImportance > 7) {
      reflection = "I've been having some really significant experiences lately. ";
    } else if (avgImportance > 5) {
      reflection = "There have been some interesting developments in my life recently. ";
    } else {
      reflection = "Life has been pretty routine lately, but that's not necessarily bad. ";
    }

    // Add theme-based insights
    if (themes.social > themes.personal) {
      reflection += "I've been spending a lot of time with others and building relationships. ";
    } else if (themes.personal > themes.social) {
      reflection += "I've been focusing more on personal growth and self-reflection. ";
    }

    if (themes.positive > themes.negative) {
      reflection += "Overall, things have been going well and I'm feeling optimistic.";
    } else if (themes.negative > themes.positive) {
      reflection += "I've been dealing with some challenges, but I'm learning from them.";
    } else {
      reflection += "Life has been a mix of ups and downs, which keeps things interesting.";
    }

    // Create reflection memory
    const importance = Math.min(8, avgImportance + 1); // Reflections are generally important
    await this.createReflectionMemory(
      db,
      reflection,
      importance,
      recentMemories.map(m => m.id)
    );

    return reflection;
  }

  // Extract themes from memory descriptions
  private extractThemes(descriptions: string[]): {
    social: number;
    personal: number;
    positive: number;
    negative: number;
  } {
    const themes = { social: 0, personal: 0, positive: 0, negative: 0 };

    for (const desc of descriptions) {
      const lower = desc.toLowerCase();

      // Social indicators
      if (lower.includes('conversation') || lower.includes('talked') || 
          lower.includes('met') || lower.includes('friend') ||
          lower.includes('together') || lower.includes('group')) {
        themes.social++;
      }

      // Personal indicators
      if (lower.includes('thought') || lower.includes('realized') ||
          lower.includes('learned') || lower.includes('decided') ||
          lower.includes('felt') || lower.includes('myself')) {
        themes.personal++;
      }

      // Positive indicators
      if (lower.includes('happy') || lower.includes('good') ||
          lower.includes('great') || lower.includes('wonderful') ||
          lower.includes('enjoyed') || lower.includes('love')) {
        themes.positive++;
      }

      // Negative indicators
      if (lower.includes('sad') || lower.includes('bad') ||
          lower.includes('terrible') || lower.includes('worried') ||
          lower.includes('upset') || lower.includes('angry')) {
        themes.negative++;
      }
    }

    return themes;
  }

  // Clean up old, unimportant memories
  async cleanupMemories(
    db: DatabaseWriter,
    maxMemories: number = 1000,
    minImportanceToKeep: number = 3
  ): Promise<number> {
    const allMemories = await db
      .query('memories')
      .withIndex('playerId', (q) => q.eq('playerId', this.agentId))
      .collect();

    if (allMemories.length <= maxMemories) {
      return 0; // No cleanup needed
    }

    // Sort by importance and recency
    const sortedMemories = allMemories.sort((a, b) => {
      const scoreA = a.importance + (Date.now() - a.lastAccess) / (30 * 24 * 60 * 60 * 1000); // 30 days
      const scoreB = b.importance + (Date.now() - b.lastAccess) / (30 * 24 * 60 * 60 * 1000);
      return scoreA - scoreB; // Ascending order (lowest scores first)
    });

    // Delete least important memories
    const toDelete = sortedMemories.slice(0, allMemories.length - maxMemories);
    let deletedCount = 0;

    for (const memory of toDelete) {
      if (memory.importance < minImportanceToKeep) {
        // Delete the embedding first
        await db.delete(memory.embeddingId);
        // Then delete the memory
        await db.delete(memory._id);
        deletedCount++;
      }
    }

    return deletedCount;
  }
}