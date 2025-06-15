# SYRP-DGM AI Town

A sophisticated AI agent simulation implementing the **Stake-Your-Reputation Protocol with Darwin Gödel Machine (SYRP-DGM)** - a self-improving trust and reputation system for autonomous agents.

## 🌟 Overview

SYRP-DGM AI Town is a virtual environment where AI agents interact, build relationships, and evolve their trust mechanisms through a revolutionary self-improving protocol. Unlike traditional reputation systems, SYRP-DGM agents can rewrite their own trust evaluation algorithms, creating an ever-evolving ecosystem of social intelligence.

### Key Features

- **🧠 Self-Improving Agents**: Agents that evolve their own trust and decision-making algorithms
- **🤝 Dynamic Trust System**: Real-time reputation scoring with stake-based validation
- **💬 Natural Conversations**: Context-aware dialogue with memory and emotional intelligence
- **🎭 Rich Personalities**: Diverse agent personalities with unique goals and behaviors
- **🌍 Interactive World**: Beautiful 2D environment with meaningful locations and interactions
- **📊 Real-time Analytics**: Comprehensive trust metrics and social network visualization
- **🔄 Continuous Evolution**: Darwin Gödel Machine implementation for protocol self-improvement

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/syrp-dgm-ai-town.git
   cd syrp-dgm-ai-town
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Initialize the database**
   ```bash
   npx convex dev --run init --until-success
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173` to see the AI Town in action!

## 🏗️ Architecture

SYRP-DGM AI Town is built on a modern, scalable architecture:

### Frontend
- **React 18** with TypeScript for the user interface
- **PixiJS** for high-performance 2D graphics and animations
- **Tailwind CSS** for responsive, beautiful styling
- **Real-time updates** via Convex subscriptions

### Backend
- **Convex** for real-time database and serverless functions
- **TypeScript** throughout for type safety
- **Modular agent system** with pluggable behaviors
- **Vector embeddings** for semantic memory and similarity

### Core Systems

#### 1. SYRP-DGM Protocol
```typescript
// Self-improving trust evaluation
class SYRPAgent {
  async evolveTrustAlgorithm(interactions: Interaction[]) {
    const currentPerformance = this.evaluateCurrentAlgorithm();
    const proposedChanges = this.generateAlgorithmMutations();
    
    for (const change of proposedChanges) {
      if (await this.validateImprovement(change, interactions)) {
        this.applyAlgorithmChange(change);
      }
    }
  }
}
```

#### 2. Dynamic Trust Scoring
- **Behavioral Evidence**: Actions, promises kept/broken, consistency
- **Stake Mechanisms**: Agents risk reputation when making claims
- **Social Validation**: Peer verification and cross-referencing
- **Temporal Decay**: Recent actions weighted more heavily

#### 3. Emotional Intelligence
- **Multi-dimensional emotions**: Happiness, stress, energy, sociability
- **Context-aware responses**: Mood affects interaction patterns
- **Emotional contagion**: Agents influence each other's emotional states
- **Memory-emotion linking**: Emotional significance affects memory importance

## 🎮 How to Use

### Basic Interaction

1. **Start the Engine**: Click the "Start" button to begin the simulation
2. **Observe Agents**: Watch as AI agents move around and interact naturally
3. **Select Agents**: Click on any agent to view detailed information
4. **Monitor Trust**: Use the Trust Metrics panel to see reputation dynamics
5. **View Conversations**: Open the Conversations panel to read agent dialogues

### Advanced Features

#### Trust Manipulation
```typescript
// Manually adjust trust relationships for experimentation
await updateSocialConnection({
  agentId: "alice",
  otherAgentId: "bob", 
  trustDelta: 10,
  context: "Successful collaboration"
});
```

#### Agent Control
- **Wake Up Sleeping Agents**: Force agents to become active
- **Generate Reflections**: Trigger deep thinking and memory consolidation
- **Direct Movement**: Send agents to specific locations
- **Start Conversations**: Initiate interactions between specific agents

#### Real-time Analytics
- **Trust Score Trends**: See how reputation changes over time
- **Social Network Graphs**: Visualize relationship strengths
- **Conversation Analysis**: Track dialogue patterns and topics
- **Emotional State Monitoring**: Observe mood changes and triggers

## 🧪 Research Applications

SYRP-DGM AI Town serves as a research platform for:

### Trust and Reputation Systems
- **Sybil Attack Resistance**: Test defenses against fake identity creation
- **Collusion Detection**: Identify coordinated deceptive behavior
- **Trust Transitivity**: Study how trust propagates through networks
- **Reputation Recovery**: Analyze how agents rebuild trust after failures

### Multi-Agent Systems
- **Emergent Cooperation**: Observe spontaneous collaborative behaviors
- **Social Norm Formation**: Watch as community standards develop
- **Conflict Resolution**: Study how agents resolve disagreements
- **Leadership Emergence**: Identify natural leaders and followers

### Machine Learning Evolution
- **Algorithm Self-Improvement**: Monitor how agents enhance their own code
- **Distributed Learning**: Study knowledge sharing between agents
- **Adaptation Strategies**: Analyze responses to environmental changes
- **Performance Optimization**: Track efficiency improvements over time

## 📊 Metrics and Analytics

### Trust Metrics
- **Individual Trust Scores**: 0-100 scale with historical tracking
- **Relationship Strength**: Pairwise trust levels between agents
- **Community Trust**: Overall network health indicators
- **Trust Velocity**: Rate of trust change over time

### Social Metrics
- **Interaction Frequency**: How often agents communicate
- **Conversation Quality**: Depth and meaningfulness of dialogues
- **Social Clustering**: Formation of friend groups and communities
- **Influence Networks**: Who affects whom in the community

### Performance Metrics
- **Algorithm Evolution**: Tracking self-improvement iterations
- **Decision Accuracy**: How well agents predict outcomes
- **Adaptation Speed**: Time to adjust to new conditions
- **Resource Efficiency**: Computational cost of trust calculations

## 🔧 Configuration

### Agent Personalities
Customize agent behavior through personality parameters:

```typescript
const agentConfig = {
  personality: {
    openness: 85,        // Willingness to try new things
    conscientiousness: 75, // Reliability and organization
    extraversion: 60,     // Social energy and assertiveness
    agreeableness: 80,    // Cooperation and trust
    neuroticism: 30       // Emotional stability
  },
  trustThreshold: 60,     // Minimum trust to cooperate
  memoryImportance: 5.0,  // How much to value memories
  socialDrive: 70         // Motivation to interact
};
```

### World Environment
Modify the simulation environment:

```typescript
const worldConfig = {
  size: { width: 1000, height: 1000 },
  locations: [
    {
      name: "Central Plaza",
      trustBonus: 0.1,      // Trust building bonus
      interactionChance: 1.2 // Increased interaction probability
    }
  ],
  timeEffects: {
    morning: { energyBonus: 0.1 },
    evening: { reflectionBonus: 1.4 }
  }
};
```

### SYRP-DGM Parameters
Fine-tune the self-improvement system:

```typescript
const syrpConfig = {
  evolutionRate: 0.1,        // How often to try improvements
  validationThreshold: 0.05,  // Minimum improvement required
  rollbackProbability: 0.02,  // Chance to revert changes
  diversityWeight: 0.3,       // Importance of algorithm diversity
  safetyConstraints: [        // Constitutional AI limits
    "no_discrimination",
    "preserve_corrigibility", 
    "maintain_transparency"
  ]
};
```

## 🛠️ Development

### Project Structure
```
syrp-dgm-ai-town/
├── src/                    # Frontend React application
│   ├── components/         # UI components
│   ├── hooks/             # Custom React hooks
│   └── main.tsx           # Application entry point
├── convex/                # Backend Convex functions
│   ├── aiTown/           # Core simulation logic
│   ├── agent/            # Agent behavior systems
│   └── schema.ts         # Database schema
├── data/                 # Static configuration data
│   ├── characters.ts     # Agent personality definitions
│   └── gentle.js         # World map and environment
└── docs/                 # Documentation
```

### Key Components

#### Agent System (`convex/aiTown/agent.ts`)
- Core agent class with SYRP-DGM capabilities
- Trust scoring and reputation management
- Emotional state and personality modeling
- Memory system with importance weighting

#### Conversation Engine (`convex/agent/conversation.ts`)
- Context-aware dialogue generation
- Trust-based response modification
- Conversation flow management
- Memory creation from interactions

#### Trust Protocol (`convex/agent/memory.ts`)
- Stake-based reputation validation
- Sybil attack detection and prevention
- Trust transitivity calculations
- Reputation recovery mechanisms

### Adding New Features

#### Custom Agent Behaviors
```typescript
// Create a new behavior module
export class CustomBehavior {
  async shouldActivate(agent: Agent, context: Context): Promise<boolean> {
    // Implement activation logic
    return agent.emotionalState.energy > 50;
  }
  
  async execute(agent: Agent, world: World): Promise<void> {
    // Implement behavior logic
    await agent.performCustomAction();
  }
}
```

#### New Trust Algorithms
```typescript
// Implement a custom trust calculation
export class CustomTrustAlgorithm {
  calculateTrust(interactions: Interaction[]): number {
    // Your custom trust logic here
    return interactions.reduce((trust, interaction) => {
      return trust + this.evaluateInteraction(interaction);
    }, 50); // Start with neutral trust
  }
}
```

## 🔬 Research Papers and References

This implementation is based on the research paper:

**"SYRP-DGM: A Self-Improving Gödelian Reputation Protocol for AI Agents"**  
*Gregory Kennedy, June 2025*

Key concepts implemented:
- Darwin Gödel Machine for self-improving algorithms
- Stake-your-reputation protocol for trust validation
- Constitutional AI constraints for safety
- Quality-diversity evolution for algorithm diversity

### Related Work
- Schmidhuber, J. (2009). "Gödel Machines: Fully Self-Referential Optimal Universal Self-Improvers"
- Zhang, J. et al. (2025). "Darwin Gödel Machine: Open-Ended Evolution of Self-Improving Agents"
- Dellarocas, C. "Reputation Mechanisms" - MIT Sloan School

## 🤝 Contributing

We welcome contributions to SYRP-DGM AI Town! Here's how to get started:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Contribution Guidelines
- **Code Quality**: Follow TypeScript best practices and include type annotations
- **Testing**: Add tests for new features and ensure existing tests pass
- **Documentation**: Update documentation for any new features or changes
- **Safety**: Ensure all changes maintain the constitutional AI constraints

### Areas for Contribution
- **New Agent Behaviors**: Implement additional personality types and behaviors
- **Trust Algorithms**: Develop novel trust calculation methods
- **Visualization**: Create new ways to display trust and social dynamics
- **Performance**: Optimize simulation speed and memory usage
- **Research**: Conduct experiments and publish findings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Jenny Zhang, Shengran Hu, Cong Lu, Robert Lange, and Jeff Clune** for the Darwin Gödel Machine insights
- **The Convex team** for the excellent real-time database platform
- **The open-source community** for the foundational tools and libraries
- **AI safety researchers** for guidance on constitutional AI implementation

## 📞 Support

- **Documentation**: [Full documentation](./docs/)
- **Issues**: [GitHub Issues](https://github.com/your-org/syrp-dgm-ai-town/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/syrp-dgm-ai-town/discussions)
- **Email**: research@syrp-dgm.org

---

**SYRP-DGM AI Town** - Where artificial intelligence meets social intelligence, and trust evolves itself.