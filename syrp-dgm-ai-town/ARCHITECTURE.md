# SYRP-DGM AI Town Architecture

This document provides a comprehensive overview of the SYRP-DGM AI Town architecture, explaining how the various components work together to create a self-improving trust-based multi-agent system.

## 🏗️ System Overview

SYRP-DGM AI Town implements a sophisticated multi-layered architecture that combines real-time simulation, self-improving algorithms, and advanced trust mechanisms. The system is designed to be modular, scalable, and research-friendly.

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + PixiJS)                │
├─────────────────────────────────────────────────────────────┤
│                    Real-time API Layer                      │
├─────────────────────────────────────────────────────────────┤
│                    Convex Backend                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Game Engine   │  │  Agent System   │  │ Trust System │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Database Layer                           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Principles

### 1. Self-Improvement (Darwin Gödel Machine)
The system can modify its own algorithms based on empirical performance:

```typescript
interface SelfImprovementCycle {
  observe: () => PerformanceMetrics;
  hypothesize: () => AlgorithmMutation[];
  test: (mutation: AlgorithmMutation) => Promise<boolean>;
  apply: (mutation: AlgorithmMutation) => void;
  rollback: (mutation: AlgorithmMutation) => void;
}
```

### 2. Stake-Based Trust (SYRP)
Agents stake their reputation when making claims or ratings:

```typescript
interface StakeTransaction {
  staker: AgentId;
  claim: TrustClaim;
  stakeAmount: number;
  validators: AgentId[];
  outcome: 'pending' | 'validated' | 'refuted';
}
```

### 3. Constitutional AI Safety
All self-modifications must pass safety constraints:

```typescript
interface SafetyConstraint {
  name: string;
  validate: (mutation: AlgorithmMutation) => boolean;
  description: string;
}
```

## 🏛️ Architecture Layers

### Frontend Layer

#### React Application (`src/`)
- **Component Architecture**: Modular React components with TypeScript
- **State Management**: React hooks with Convex real-time subscriptions
- **Routing**: Single-page application with dynamic views

#### PixiJS Rendering (`src/components/Pixi*`)
- **High-Performance Graphics**: Hardware-accelerated 2D rendering
- **Interactive Elements**: Clickable agents, draggable viewport
- **Real-time Updates**: Smooth animations and state synchronization

```typescript
// Example: Agent rendering with trust visualization
class AgentRenderer {
  updateTrustVisualization(agent: Agent) {
    const trustColor = this.getTrustColor(agent.trustScore);
    const trustRing = this.createTrustRing(trustColor, agent.trustScore);
    this.agentSprite.addChild(trustRing);
  }
}
```

### API Layer

#### Real-time Subscriptions
- **Live Data**: Automatic updates when backend state changes
- **Optimistic Updates**: Immediate UI feedback with server reconciliation
- **Error Handling**: Graceful degradation and retry mechanisms

#### Input System (`convex/aiTown/inputs.ts`)
- **Command Pattern**: All user actions as serializable commands
- **Validation**: Input sanitization and permission checking
- **Queuing**: Ordered processing of user inputs

### Backend Layer

#### Game Engine (`convex/aiTown/game.ts`)

The game engine orchestrates the entire simulation:

```typescript
class Game extends AbstractGame<World> {
  async tick(db: DatabaseWriter, inputs: Input[]): Promise<TickResult> {
    // 1. Process user inputs
    await this.processInputs(inputs);
    
    // 2. Run agent AI cycles
    await this.runAgentCycles();
    
    // 3. Update world state
    await this.updateWorldState();
    
    // 4. Trigger self-improvement cycles
    await this.runSelfImprovementCycles();
    
    return this.generateTickResult();
  }
}
```

**Key Responsibilities:**
- **Simulation Loop**: 16ms ticks for smooth real-time updates
- **Input Processing**: Handle user commands and agent decisions
- **State Management**: Coordinate between agents, conversations, and world
- **Performance Monitoring**: Track system metrics for optimization

#### Agent System (`convex/aiTown/agent.ts`)

Each agent is a sophisticated AI entity with multiple subsystems:

```typescript
class Agent {
  // Core Properties
  id: string;
  personality: PersonalityTraits;
  trustScore: number;
  emotionalState: EmotionalState;
  
  // SYRP-DGM Specific
  reputationHistory: ReputationEvent[];
  socialConnections: SocialConnection[];
  currentGoal?: Goal;
  memoryImportanceThreshold: number;
  
  // Behavioral Systems
  async tick(db: DatabaseWriter, now: number): Promise<void> {
    await this.updateEmotionalState();
    await this.processMemories();
    await this.makeDecisions();
    await this.executeActions();
    await this.evolveBehavior();
  }
}
```

**Agent Subsystems:**

1. **Personality System**
   - Big Five personality traits
   - Behavioral tendencies and preferences
   - Decision-making biases

2. **Emotional Intelligence**
   - Multi-dimensional emotional state
   - Emotional contagion between agents
   - Mood-dependent behavior modification

3. **Memory System** (`convex/agent/memory.ts`)
   - Episodic memories with importance scoring
   - Semantic knowledge representation
   - Memory consolidation and forgetting

4. **Trust Evaluation**
   - Dynamic trust scoring algorithms
   - Reputation history tracking
   - Social network analysis

#### Trust System (`convex/agent/`)

The trust system implements the SYRP-DGM protocol:

##### Memory-Based Trust (`convex/agent/memory.ts`)
```typescript
class AgentMemory {
  async createMemory(
    description: string,
    importance: number,
    context: MemoryContext
  ): Promise<MemoryId> {
    // Create semantic embedding
    const embedding = await this.generateEmbedding(description);
    
    // Store with importance weighting
    return await this.storeMemory({
      description,
      embedding,
      importance,
      context,
      timestamp: Date.now()
    });
  }
}
```

##### Conversation Intelligence (`convex/agent/conversation.ts`)
```typescript
class AgentConversation {
  async generateResponse(
    message: string,
    context: ConversationContext
  ): Promise<ResponseData> {
    // Analyze message sentiment and intent
    const analysis = this.analyzeMessage(message);
    
    // Generate contextual response
    const response = await this.generateContextualResponse(
      analysis,
      context.senderTrustLevel,
      context.conversationHistory
    );
    
    return {
      response: response.text,
      shouldContinue: response.engagement,
      emotionalImpact: response.emotionalDelta
    };
  }
}
```

##### Embeddings Cache (`convex/agent/embeddingsCache.ts`)
```typescript
class EmbeddingsCache {
  static async getEmbedding(db: DatabaseWriter, text: string): Promise<number[]> {
    // Check cache first
    const cached = await this.getCachedEmbedding(text);
    if (cached) return cached;
    
    // Generate new embedding
    const embedding = this.generateEmbedding(text);
    
    // Cache for future use
    await this.cacheEmbedding(text, embedding);
    
    return embedding;
  }
}
```

### Database Layer

#### Schema Design (`convex/schema.ts`)

The database schema is designed for real-time performance and complex queries:

```typescript
export default defineSchema({
  // Core entities
  worlds: defineTable(serializedWorld),
  agents: defineTable(serializedAgent)
    .index('worldId', ['worldId', 'id']),
  
  // Communication
  messages: defineTable({
    conversationId,
    author: playerId,
    text: v.string(),
    timestamp: v.number()
  }).index('conversationId', ['conversationId']),
  
  // Memory system
  memories: defineTable(memoryFields)
    .index('playerId', ['playerId'])
    .index('importance', ['importance']),
  
  memoryEmbeddings: defineTable({
    playerId,
    embedding: v.array(v.float64())
  }).vectorIndex('embedding', {
    vectorField: 'embedding',
    dimensions: EMBEDDING_DIMENSION
  }),
  
  // Trust and reputation
  reputationEvents: defineTable({
    agentId: playerId,
    action: v.string(),
    impact: v.number(),
    context: v.string(),
    timestamp: v.number()
  }).index('agentId', ['agentId', 'timestamp'])
});
```

## 🧠 SYRP-DGM Implementation

### Darwin Gödel Machine Cycle

The self-improvement system follows this cycle:

```typescript
class DGMCycle {
  async runEvolutionCycle(agent: Agent): Promise<void> {
    // 1. Performance Assessment
    const currentPerformance = await this.assessPerformance(agent);
    
    // 2. Generate Mutations
    const mutations = await this.generateMutations(agent);
    
    // 3. Safety Validation
    const safeMutations = mutations.filter(m => this.validateSafety(m));
    
    // 4. Empirical Testing
    for (const mutation of safeMutations) {
      const testResult = await this.testMutation(agent, mutation);
      
      if (testResult.improvement > IMPROVEMENT_THRESHOLD) {
        await this.applyMutation(agent, mutation);
        break; // Apply one improvement per cycle
      }
    }
    
    // 5. Archive and Learn
    await this.archiveResults(agent, mutations);
  }
}
```

### Stake-Your-Reputation Protocol

```typescript
class SYRPProtocol {
  async stakeReputation(
    staker: Agent,
    claim: TrustClaim,
    stakeAmount: number
  ): Promise<StakeTransaction> {
    // Validate stake amount
    if (stakeAmount > staker.trustScore * 0.1) {
      throw new Error('Stake too high for current reputation');
    }
    
    // Create stake transaction
    const transaction = {
      id: generateId(),
      staker: staker.id,
      claim,
      stakeAmount,
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // Lock staked reputation
    await this.lockReputation(staker, stakeAmount);
    
    // Initiate validation process
    await this.initiateValidation(transaction);
    
    return transaction;
  }
}
```

### Constitutional AI Constraints

Safety constraints are enforced at multiple levels:

```typescript
const CONSTITUTIONAL_CONSTRAINTS = [
  {
    name: 'no_discrimination',
    validate: (mutation: AlgorithmMutation) => {
      return !mutation.code.includes('race') && 
             !mutation.code.includes('gender') &&
             !this.detectBiasPatterns(mutation);
    }
  },
  {
    name: 'preserve_corrigibility',
    validate: (mutation: AlgorithmMutation) => {
      return mutation.preservesShutdownHook && 
             mutation.preservesHumanOverride;
    }
  },
  {
    name: 'maintain_transparency',
    validate: (mutation: AlgorithmMutation) => {
      return mutation.hasExplanationCapability &&
             mutation.allowsInspection;
    }
  }
];
```

## 🔄 Data Flow

### Real-time Update Flow

```
User Action → Input Validation → Command Queue → Game Engine → 
Agent Processing → State Update → Database Write → 
Real-time Subscription → Frontend Update → UI Render
```

### Trust Calculation Flow

```
Interaction → Memory Creation → Importance Scoring → 
Embedding Generation → Similarity Matching → 
Trust Delta Calculation → Reputation Update → 
Social Network Propagation → UI Visualization
```

### Self-Improvement Flow

```
Performance Monitoring → Mutation Generation → 
Safety Validation → Empirical Testing → 
Improvement Verification → Code Application → 
Archive Update → Performance Re-assessment
```

## 🎛️ Configuration System

### Environment Configuration

```typescript
interface EnvironmentConfig {
  world: {
    size: { width: number; height: number };
    tickRate: number; // milliseconds
    maxAgents: number;
  };
  
  syrp: {
    evolutionRate: number;
    validationThreshold: number;
    safetyConstraints: string[];
    maxStakePercentage: number;
  };
  
  agents: {
    defaultPersonality: PersonalityTraits;
    memoryCapacity: number;
    trustDecayRate: number;
    emotionalVolatility: number;
  };
}
```

### Runtime Parameters

```typescript
interface RuntimeConfig {
  simulation: {
    speed: number; // 0.1x to 10x
    paused: boolean;
    debugMode: boolean;
  };
  
  visualization: {
    showTrustLines: boolean;
    showEmotionalStates: boolean;
    showMemoryImportance: boolean;
    animationSpeed: number;
  };
  
  research: {
    logLevel: 'minimal' | 'detailed' | 'verbose';
    exportMetrics: boolean;
    trackEvolution: boolean;
  };
}
```

## 🔍 Monitoring and Observability

### Performance Metrics

```typescript
interface SystemMetrics {
  simulation: {
    tickDuration: number;
    agentCount: number;
    conversationCount: number;
    memoryCount: number;
  };
  
  trust: {
    averageTrustScore: number;
    trustVariance: number;
    reputationEvents: number;
    stakeTransactions: number;
  };
  
  evolution: {
    mutationsGenerated: number;
    mutationsApplied: number;
    improvementRate: number;
    safetyViolations: number;
  };
}
```

### Debugging Tools

```typescript
interface DebugTools {
  agentInspector: {
    viewMemories: (agentId: string) => Memory[];
    viewTrustNetwork: (agentId: string) => TrustNetwork;
    viewDecisionHistory: (agentId: string) => Decision[];
  };
  
  simulationControls: {
    pauseAt: (condition: string) => void;
    stepThrough: () => void;
    rewindTo: (timestamp: number) => void;
  };
  
  trustAnalysis: {
    analyzeTrustFlow: () => TrustFlowAnalysis;
    detectAnomalies: () => TrustAnomaly[];
    validateConsistency: () => ConsistencyReport;
  };
}
```

## 🚀 Scalability Considerations

### Horizontal Scaling

- **Agent Distribution**: Agents can be distributed across multiple processes
- **Database Sharding**: Memories and interactions can be sharded by agent ID
- **Computation Offloading**: Heavy computations (embeddings, evolution) can be offloaded

### Performance Optimization

- **Lazy Loading**: Load agent data and memories on-demand
- **Caching Strategy**: Multi-level caching for embeddings and trust calculations
- **Batch Processing**: Group similar operations for efficiency

### Resource Management

```typescript
interface ResourceLimits {
  maxMemoriesPerAgent: number;
  maxConversationLength: number;
  maxEvolutionCyclesPerTick: number;
  maxConcurrentAgents: number;
}
```

## 🔒 Security and Safety

### Input Validation

All user inputs are validated and sanitized:

```typescript
class InputValidator {
  validateAgentAction(action: AgentAction): ValidationResult {
    // Check permissions
    if (!this.hasPermission(action.agentId, action.type)) {
      return { valid: false, error: 'Insufficient permissions' };
    }
    
    // Validate parameters
    if (!this.validateParameters(action.parameters)) {
      return { valid: false, error: 'Invalid parameters' };
    }
    
    // Check rate limits
    if (!this.checkRateLimit(action.agentId)) {
      return { valid: false, error: 'Rate limit exceeded' };
    }
    
    return { valid: true };
  }
}
```

### Constitutional AI Enforcement

```typescript
class ConstitutionalEnforcer {
  async validateMutation(mutation: AlgorithmMutation): Promise<boolean> {
    for (const constraint of CONSTITUTIONAL_CONSTRAINTS) {
      if (!constraint.validate(mutation)) {
        await this.logViolation(constraint.name, mutation);
        return false;
      }
    }
    
    return true;
  }
}
```

### Data Privacy

- **Agent Isolation**: Agents cannot directly access other agents' private data
- **Memory Encryption**: Sensitive memories can be encrypted
- **Audit Logging**: All trust-affecting actions are logged

## 📈 Research Extensions

### Experimental Features

The architecture supports easy addition of experimental features:

```typescript
interface ExperimentalFeature {
  name: string;
  enabled: boolean;
  configuration: any;
  
  initialize: () => Promise<void>;
  process: (agent: Agent, context: any) => Promise<void>;
  cleanup: () => Promise<void>;
}
```

### Data Export

Research data can be exported in various formats:

```typescript
interface DataExporter {
  exportTrustNetwork: (format: 'json' | 'csv' | 'graphml') => Promise<string>;
  exportInteractionLogs: (timeRange: TimeRange) => Promise<InteractionLog[]>;
  exportEvolutionHistory: (agentId?: string) => Promise<EvolutionEvent[]>;
}
```

## 🔧 Development Guidelines

### Code Organization

- **Modular Design**: Each system is self-contained with clear interfaces
- **Type Safety**: Comprehensive TypeScript types throughout
- **Testing**: Unit tests for core algorithms, integration tests for workflows
- **Documentation**: Inline documentation and architectural decision records

### Extension Points

The system provides several extension points for researchers:

1. **Custom Trust Algorithms**: Implement `TrustCalculator` interface
2. **New Agent Behaviors**: Extend `AgentBehavior` base class
3. **Alternative Evolution Strategies**: Implement `EvolutionStrategy` interface
4. **Custom Safety Constraints**: Add to `CONSTITUTIONAL_CONSTRAINTS`

### Performance Profiling

```typescript
class PerformanceProfiler {
  async profileAgentTick(agent: Agent): Promise<PerformanceProfile> {
    const start = performance.now();
    
    const memoryTime = await this.timeOperation(() => agent.processMemories());
    const decisionTime = await this.timeOperation(() => agent.makeDecisions());
    const actionTime = await this.timeOperation(() => agent.executeActions());
    
    const total = performance.now() - start;
    
    return {
      total,
      breakdown: { memoryTime, decisionTime, actionTime },
      bottlenecks: this.identifyBottlenecks({ memoryTime, decisionTime, actionTime })
    };
  }
}
```

This architecture provides a solid foundation for research into self-improving trust systems while maintaining safety, performance, and extensibility. The modular design allows researchers to focus on specific aspects while the constitutional AI constraints ensure safe operation.