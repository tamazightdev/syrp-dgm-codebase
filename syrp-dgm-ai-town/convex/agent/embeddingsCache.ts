import { v } from 'convex/values';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import crypto from 'crypto';

// Embeddings cache for efficient text processing
export class EmbeddingsCache {
  
  // Get or create embedding for text
  static async getEmbedding(
    db: DatabaseWriter,
    text: string
  ): Promise<number[]> {
    // Create hash of the text
    const textHash = crypto.createHash('sha256').update(text).digest();
    
    // Check if embedding already exists
    const existing = await db
      .query('embeddingsCache')
      .withIndex('text', (q) => q.eq('textHash', textHash))
      .first();
    
    if (existing) {
      return existing.embedding;
    }
    
    // Generate new embedding
    const embedding = this.generateEmbedding(text);
    
    // Cache the embedding
    await db.insert('embeddingsCache', {
      textHash,
      embedding,
    });
    
    return embedding;
  }
  
  // Generate embedding for text (placeholder implementation)
  private static generateEmbedding(text: string): number[] {
    const dimension = 384; // Standard embedding dimension
    const embedding = new Array(dimension).fill(0);
    
    // Simple character-based embedding
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const index = char % dimension;
      embedding[index] += 1;
    }
    
    // Add word-based features
    const words = text.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (word.length > 0) {
        const wordHash = this.simpleHash(word) % dimension;
        embedding[wordHash] += 2;
      }
    }
    
    // Add bigram features
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = words[i] + ' ' + words[i + 1];
      const bigramHash = this.simpleHash(bigram) % dimension;
      embedding[bigramHash] += 1.5;
    }
    
    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < dimension; i++) {
        embedding[i] /= magnitude;
      }
    }
    
    return embedding;
  }
  
  // Simple hash function for strings
  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  // Calculate cosine similarity between two embeddings
  static calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }
    
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  // Find similar texts in cache
  static async findSimilarTexts(
    db: DatabaseReader,
    queryText: string,
    threshold: number = 0.7,
    limit: number = 10
  ): Promise<Array<{
    textHash: Uint8Array;
    embedding: number[];
    similarity: number;
  }>> {
    const queryEmbedding = this.generateEmbedding(queryText);
    
    // Get all cached embeddings (in a real implementation, you'd use vector search)
    const allEmbeddings = await db.query('embeddingsCache').collect();
    
    const similarities = [];
    
    for (const cached of allEmbeddings) {
      const similarity = this.calculateSimilarity(queryEmbedding, cached.embedding);
      
      if (similarity >= threshold) {
        similarities.push({
          textHash: cached.textHash,
          embedding: cached.embedding,
          similarity,
        });
      }
    }
    
    // Sort by similarity (descending) and limit results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }
  
  // Batch process multiple texts
  static async batchGetEmbeddings(
    db: DatabaseWriter,
    texts: string[]
  ): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.getEmbedding(db, text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }
  
  // Clean up old cache entries
  static async cleanupCache(
    db: DatabaseWriter,
    maxEntries: number = 10000
  ): Promise<number> {
    const allEntries = await db.query('embeddingsCache').collect();
    
    if (allEntries.length <= maxEntries) {
      return 0; // No cleanup needed
    }
    
    // Sort by creation time (oldest first)
    const sortedEntries = allEntries.sort((a, b) => a._creationTime - b._creationTime);
    
    // Delete oldest entries
    const toDelete = sortedEntries.slice(0, allEntries.length - maxEntries);
    
    for (const entry of toDelete) {
      await db.delete(entry._id);
    }
    
    return toDelete.length;
  }
  
  // Get cache statistics
  static async getCacheStats(db: DatabaseReader): Promise<{
    totalEntries: number;
    oldestEntry: number;
    newestEntry: number;
    averageEmbeddingMagnitude: number;
  }> {
    const allEntries = await db.query('embeddingsCache').collect();
    
    if (allEntries.length === 0) {
      return {
        totalEntries: 0,
        oldestEntry: 0,
        newestEntry: 0,
        averageEmbeddingMagnitude: 0,
      };
    }
    
    const creationTimes = allEntries.map(e => e._creationTime);
    const oldestEntry = Math.min(...creationTimes);
    const newestEntry = Math.max(...creationTimes);
    
    // Calculate average embedding magnitude
    let totalMagnitude = 0;
    for (const entry of allEntries) {
      const magnitude = Math.sqrt(
        entry.embedding.reduce((sum, val) => sum + val * val, 0)
      );
      totalMagnitude += magnitude;
    }
    const averageEmbeddingMagnitude = totalMagnitude / allEntries.length;
    
    return {
      totalEntries: allEntries.length,
      oldestEntry,
      newestEntry,
      averageEmbeddingMagnitude,
    };
  }
  
  // Precompute embeddings for common phrases
  static async precomputeCommonEmbeddings(db: DatabaseWriter): Promise<void> {
    const commonPhrases = [
      "Hello, how are you?",
      "Good morning!",
      "Good evening!",
      "How was your day?",
      "Nice weather today",
      "What are you up to?",
      "See you later!",
      "Take care!",
      "Have a great day!",
      "It's good to see you",
      "I'm doing well",
      "Thanks for asking",
      "You're welcome",
      "I agree",
      "That's interesting",
      "I understand",
      "That makes sense",
      "I'm not sure",
      "Let me think about it",
      "That's a good point",
      "I'm happy",
      "I'm sad",
      "I'm excited",
      "I'm tired",
      "I'm busy",
      "I'm free",
      "I like that",
      "I don't like that",
      "That's funny",
      "That's strange",
    ];
    
    for (const phrase of commonPhrases) {
      await this.getEmbedding(db, phrase);
    }
  }
}