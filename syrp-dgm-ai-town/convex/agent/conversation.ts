import { v } from 'convex/values';
import { DatabaseReader, DatabaseWriter } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { playerId } from '../aiTown/ids';

// Agent conversation management and decision-making
export class AgentConversation {
  agentId: string;
  
  constructor(agentId: string) {
    this.agentId = agentId;
  }

  // Decide whether to start a conversation with another agent
  async shouldStartConversation(
    db: DatabaseReader,
    targetAgentId: string,
    context: {
      proximity: number;
      sharedHistory: boolean;
      currentMood: number;
      trustLevel: number;
    }
  ): Promise<boolean> {
    // Base probability factors
    let probability = 0.1; // 10% base chance

    // Proximity factor (closer = more likely)
    if (context.proximity < 2.0) {
      probability += 0.3;
    } else if (context.proximity < 5.0) {
      probability += 0.1;
    }

    // Shared history factor
    if (context.sharedHistory) {
      probability += 0.2;
    }

    // Mood factor (happier agents are more social)
    probability += (context.currentMood - 50) * 0.004; // -0.2 to +0.2

    // Trust factor (higher trust = more likely to engage)
    probability += (context.trustLevel - 50) * 0.003; // -0.15 to +0.15

    // Check recent conversation frequency to avoid spam
    const recentConversations = await this.getRecentConversationCount(db, 60 * 60 * 1000); // Last hour
    if (recentConversations > 3) {
      probability *= 0.5; // Reduce probability if too many recent conversations
    }

    return Math.random() < Math.max(0, Math.min(1, probability));
  }

  // Generate conversation starter based on context
  async generateConversationStarter(
    db: DatabaseReader,
    targetAgentId: string,
    context: {
      location: string;
      timeOfDay: string;
      sharedMemories: string[];
      currentEvents: string[];
    }
  ): Promise<string> {
    const starters = [];

    // Location-based starters
    if (context.location) {
      starters.push(
        `Hey! Nice to see you here at ${context.location}.`,
        `What brings you to ${context.location} today?`,
        `I love this spot at ${context.location}, don't you?`
      );
    }

    // Time-based starters
    if (context.timeOfDay === 'morning') {
      starters.push(
        "Good morning! How are you feeling today?",
        "Early bird today, I see!",
        "Beautiful morning, isn't it?"
      );
    } else if (context.timeOfDay === 'evening') {
      starters.push(
        "Good evening! How was your day?",
        "Lovely evening for a chat!",
        "Winding down for the day?"
      );
    }

    // Shared memory starters
    if (context.sharedMemories.length > 0) {
      const memory = context.sharedMemories[Math.floor(Math.random() * context.sharedMemories.length)];
      starters.push(
        `Remember when we ${memory}? That was fun!`,
        `I was just thinking about ${memory}.`,
        `That time we ${memory} - good times!`
      );
    }

    // Current events starters
    if (context.currentEvents.length > 0) {
      const event = context.currentEvents[Math.floor(Math.random() * context.currentEvents.length)];
      starters.push(
        `Did you hear about ${event}?`,
        `What do you think about ${event}?`,
        `I've been thinking about ${event} lately.`
      );
    }

    // Default starters
    starters.push(
      "Hello! How are you doing?",
      "Hi there! What's on your mind?",
      "Hey! Good to see you!",
      "How's your day going?",
      "What have you been up to lately?"
    );

    return starters[Math.floor(Math.random() * starters.length)];
  }

  // Decide how to respond to a message
  async generateResponse(
    db: DatabaseReader,
    message: string,
    context: {
      conversationHistory: string[];
      senderTrustLevel: number;
      currentMood: number;
      personality: string;
      memories: string[];
    }
  ): Promise<{
    response: string;
    shouldContinue: boolean;
    emotionalImpact: number;
  }> {
    // Analyze message sentiment and content
    const messageAnalysis = this.analyzeMessage(message);
    
    // Determine response based on personality and context
    let response = "";
    let shouldContinue = true;
    let emotionalImpact = 0;

    // Trust-based response modification
    if (context.senderTrustLevel < 30) {
      // Low trust - be cautious
      if (messageAnalysis.isQuestion) {
        response = this.generateCautiousResponse(message, context.personality);
      } else {
        response = this.generateNeutralResponse(message, context.personality);
      }
      emotionalImpact = -1;
    } else if (context.senderTrustLevel > 70) {
      // High trust - be open and friendly
      response = this.generateFriendlyResponse(message, context.personality, context.memories);
      emotionalImpact = 2;
    } else {
      // Neutral trust - normal response
      response = this.generateNormalResponse(message, context.personality);
      emotionalImpact = 1;
    }

    // Mood-based modifications
    if (context.currentMood < 30) {
      // Low mood - shorter responses, less engagement
      response = this.shortenResponse(response);
      shouldContinue = Math.random() < 0.3;
      emotionalImpact -= 1;
    } else if (context.currentMood > 70) {
      // High mood - more enthusiastic
      response = this.addEnthusiasm(response);
      shouldContinue = Math.random() < 0.8;
      emotionalImpact += 1;
    }

    // Check conversation length - end if too long
    if (context.conversationHistory.length > 10) {
      shouldContinue = Math.random() < 0.4;
      if (!shouldContinue) {
        response += " Well, I should get going. Nice talking with you!";
      }
    }

    return {
      response,
      shouldContinue,
      emotionalImpact,
    };
  }

  // Analyze incoming message for sentiment and content
  private analyzeMessage(message: string): {
    sentiment: 'positive' | 'neutral' | 'negative';
    isQuestion: boolean;
    topics: string[];
    urgency: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'wonderful', 'happy', 'love', 'like', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'upset', 'worried'];
    
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';
    
    // Check if it's a question
    const isQuestion = message.includes('?') || 
                      lowerMessage.startsWith('what') ||
                      lowerMessage.startsWith('how') ||
                      lowerMessage.startsWith('why') ||
                      lowerMessage.startsWith('when') ||
                      lowerMessage.startsWith('where') ||
                      lowerMessage.startsWith('who');
    
    // Extract topics (simplified)
    const topics = [];
    if (lowerMessage.includes('weather')) topics.push('weather');
    if (lowerMessage.includes('work') || lowerMessage.includes('job')) topics.push('work');
    if (lowerMessage.includes('food') || lowerMessage.includes('eat')) topics.push('food');
    if (lowerMessage.includes('friend') || lowerMessage.includes('people')) topics.push('relationships');
    
    // Determine urgency
    let urgency = 1;
    if (lowerMessage.includes('urgent') || lowerMessage.includes('important') || lowerMessage.includes('!')) {
      urgency = 3;
    } else if (lowerMessage.includes('quick') || lowerMessage.includes('soon')) {
      urgency = 2;
    }
    
    return { sentiment, isQuestion, topics, urgency };
  }

  // Generate different types of responses based on trust and context
  private generateCautiousResponse(message: string, personality: string): string {
    const responses = [
      "I see... that's interesting.",
      "Hmm, I'm not sure about that.",
      "That's one way to look at it.",
      "I'd need to think about that more.",
      "Maybe... I'm not entirely convinced.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateNeutralResponse(message: string, personality: string): string {
    const responses = [
      "That's a good point.",
      "I understand what you mean.",
      "Thanks for sharing that.",
      "That makes sense.",
      "I appreciate your perspective.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateFriendlyResponse(message: string, personality: string, memories: string[]): string {
    const responses = [
      "That's wonderful! I'm so glad you shared that.",
      "I completely agree! You always have great insights.",
      "That reminds me of something we talked about before.",
      "I love hearing your thoughts on this!",
      "You're absolutely right! I was thinking the same thing.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private generateNormalResponse(message: string, personality: string): string {
    const responses = [
      "That's really interesting!",
      "I hadn't thought of it that way.",
      "Tell me more about that.",
      "That sounds reasonable.",
      "I can see your point.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private shortenResponse(response: string): string {
    const sentences = response.split('. ');
    return sentences[0] + (sentences.length > 1 ? '.' : '');
  }

  private addEnthusiasm(response: string): string {
    if (!response.includes('!')) {
      response = response.replace(/\.$/, '!');
    }
    const enthusiasticPrefixes = ['Absolutely! ', 'Definitely! ', 'For sure! ', 'Oh yes! '];
    if (Math.random() < 0.3) {
      const prefix = enthusiasticPrefixes[Math.floor(Math.random() * enthusiasticPrefixes.length)];
      response = prefix + response;
    }
    return response;
  }

  // Get recent conversation count for rate limiting
  private async getRecentConversationCount(
    db: DatabaseReader,
    timeWindow: number
  ): Promise<number> {
    const cutoff = Date.now() - timeWindow;
    
    const recentMessages = await db
      .query('messages')
      .filter((q) => 
        q.and(
          q.eq(q.field('author'), this.agentId),
          q.gt(q.field('_creationTime'), cutoff)
        )
      )
      .collect();
    
    // Count unique conversations
    const conversationIds = new Set(recentMessages.map(m => m.conversationId));
    return conversationIds.size;
  }

  // Decide whether to leave a conversation
  async shouldLeaveConversation(
    db: DatabaseReader,
    context: {
      conversationLength: number;
      lastMessageTime: number;
      participantCount: number;
      currentMood: number;
      hasGoals: boolean;
    }
  ): Promise<boolean> {
    let leaveChance = 0.1; // 10% base chance

    // Conversation length factor
    if (context.conversationLength > 15) {
      leaveChance += 0.3; // 30% more likely after 15 messages
    } else if (context.conversationLength > 8) {
      leaveChance += 0.1; // 10% more likely after 8 messages
    }

    // Time since last message
    const timeSinceLastMessage = Date.now() - context.lastMessageTime;
    if (timeSinceLastMessage > 5 * 60 * 1000) { // 5 minutes
      leaveChance += 0.4; // Much more likely to leave if conversation stalled
    } else if (timeSinceLastMessage > 2 * 60 * 1000) { // 2 minutes
      leaveChance += 0.2;
    }

    // Participant count factor (larger groups = more likely to leave)
    if (context.participantCount > 3) {
      leaveChance += 0.2;
    }

    // Mood factor (low mood = more likely to leave)
    if (context.currentMood < 40) {
      leaveChance += 0.2;
    }

    // Goals factor (having goals = more likely to leave to pursue them)
    if (context.hasGoals) {
      leaveChance += 0.15;
    }

    return Math.random() < Math.max(0, Math.min(0.8, leaveChance));
  }

  // Generate a polite leaving message
  generateLeavingMessage(context: {
    conversationLength: number;
    reason: 'goals' | 'mood' | 'time' | 'boredom';
  }): string {
    const messages = {
      goals: [
        "I should get going - I have some things I need to take care of.",
        "It's been great chatting, but I have some tasks to attend to.",
        "I need to head off and handle some business. Talk soon!",
      ],
      mood: [
        "I'm feeling a bit tired, so I think I'll head off for now.",
        "I need some quiet time to think. Catch you later!",
        "I'm going to take a little break. Nice talking with you!",
      ],
      time: [
        "Well, I should get going. This has been a lovely conversation!",
        "Time flies when you're having good conversation! I should head off.",
        "I've really enjoyed this chat, but I should move along now.",
      ],
      boredom: [
        "I think I'll wander around a bit. See you around!",
        "I'm going to explore a little. Take care!",
        "I feel like taking a walk. Nice talking with you!",
      ],
    };

    const reasonMessages = messages[context.reason];
    return reasonMessages[Math.floor(Math.random() * reasonMessages.length)];
  }
}