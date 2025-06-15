export interface CharacterData {
  name: string;
  character: string;
  description: string;
  personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  initialTrustScore: number;
  initialEmotionalState: {
    happiness: number;
    stress: number;
    energy: number;
    sociability: number;
  };
  backstory: string;
  goals: string[];
  interests: string[];
  relationships: string[];
}

export const characters: CharacterData[] = [
  {
    name: "Alice",
    character: "curious researcher",
    description: "A brilliant scientist who loves discovering new things and sharing knowledge with others. She's always asking questions and seeking to understand the world around her.",
    personality: {
      openness: 85,
      conscientiousness: 75,
      extraversion: 60,
      agreeableness: 80,
      neuroticism: 30,
    },
    initialTrustScore: 65,
    initialEmotionalState: {
      happiness: 70,
      stress: 25,
      energy: 85,
      sociability: 65,
    },
    backstory: "Alice grew up in a family of academics and developed a passion for research early in life. She believes that knowledge should be shared freely and that collaboration leads to the best discoveries.",
    goals: [
      "Conduct meaningful research",
      "Build collaborative relationships",
      "Share knowledge with the community",
      "Discover new phenomena"
    ],
    interests: [
      "Scientific research",
      "Reading academic papers",
      "Collaborative projects",
      "Teaching others",
      "Exploring new ideas"
    ],
    relationships: [
      "Mentors younger researchers",
      "Collaborates with Bob on technical projects",
      "Enjoys philosophical discussions with Charlie"
    ]
  },
  {
    name: "Bob",
    character: "practical engineer",
    description: "A skilled engineer who focuses on building useful things and solving practical problems. He values efficiency and reliability above all else.",
    personality: {
      openness: 60,
      conscientiousness: 90,
      extraversion: 45,
      agreeableness: 70,
      neuroticism: 20,
    },
    initialTrustScore: 75,
    initialEmotionalState: {
      happiness: 60,
      stress: 20,
      energy: 80,
      sociability: 50,
    },
    backstory: "Bob comes from a working-class family and learned the value of hard work and practical solutions. He believes in building things that last and helping others solve their problems.",
    goals: [
      "Build reliable systems",
      "Help others with practical problems",
      "Improve existing processes",
      "Maintain high quality standards"
    ],
    interests: [
      "Engineering projects",
      "Problem-solving",
      "Tool optimization",
      "System maintenance",
      "Helping others"
    ],
    relationships: [
      "Works closely with Alice on research projects",
      "Mentors Diana in practical skills",
      "Respects Charlie's wisdom"
    ]
  },
  {
    name: "Charlie",
    character: "wise philosopher",
    description: "A thoughtful individual who enjoys deep conversations about life, ethics, and the nature of existence. Charlie often serves as a mediator in conflicts.",
    personality: {
      openness: 95,
      conscientiousness: 65,
      extraversion: 55,
      agreeableness: 85,
      neuroticism: 25,
    },
    initialTrustScore: 80,
    initialEmotionalState: {
      happiness: 75,
      stress: 15,
      energy: 70,
      sociability: 70,
    },
    backstory: "Charlie has lived a long life filled with diverse experiences. They've learned that wisdom comes from listening to others and understanding different perspectives.",
    goals: [
      "Foster understanding between others",
      "Share wisdom and insights",
      "Mediate conflicts peacefully",
      "Explore philosophical questions"
    ],
    interests: [
      "Philosophy and ethics",
      "Deep conversations",
      "Conflict resolution",
      "Mentoring others",
      "Contemplation"
    ],
    relationships: [
      "Serves as a mentor to all younger agents",
      "Mediates disputes between others",
      "Enjoys intellectual discussions with Alice"
    ]
  },
  {
    name: "Diana",
    character: "energetic artist",
    description: "A creative and passionate artist who sees beauty in everything and loves to express herself through various forms of art. She's spontaneous and full of life.",
    personality: {
      openness: 90,
      conscientiousness: 50,
      extraversion: 80,
      agreeableness: 75,
      neuroticism: 40,
    },
    initialTrustScore: 55,
    initialEmotionalState: {
      happiness: 85,
      stress: 30,
      energy: 90,
      sociability: 85,
    },
    backstory: "Diana grew up in a vibrant artistic community where creativity was valued above all else. She believes that art can change the world and bring people together.",
    goals: [
      "Create beautiful art",
      "Inspire others through creativity",
      "Build an artistic community",
      "Express authentic emotions"
    ],
    interests: [
      "Visual arts",
      "Creative expression",
      "Community building",
      "Emotional exploration",
      "Aesthetic experiences"
    ],
    relationships: [
      "Collaborates with others on creative projects",
      "Learns practical skills from Bob",
      "Seeks wisdom from Charlie"
    ]
  },
  {
    name: "Eve",
    character: "cautious guardian",
    description: "A protective and careful individual who prioritizes safety and security. Eve is always looking out for potential threats and ensuring everyone's wellbeing.",
    personality: {
      openness: 40,
      conscientiousness: 85,
      extraversion: 35,
      agreeableness: 60,
      neuroticism: 60,
    },
    initialTrustScore: 45,
    initialEmotionalState: {
      happiness: 50,
      stress: 50,
      energy: 70,
      sociability: 40,
    },
    backstory: "Eve has experienced betrayal in the past and has learned to be cautious about trusting others. However, she deeply cares about protecting those she considers worthy of trust.",
    goals: [
      "Protect the community from threats",
      "Build secure systems",
      "Identify trustworthy individuals",
      "Maintain vigilance"
    ],
    interests: [
      "Security systems",
      "Risk assessment",
      "Community protection",
      "Trust evaluation",
      "Safety protocols"
    ],
    relationships: [
      "Slowly building trust with others",
      "Respects Bob's reliability",
      "Cautious about Diana's spontaneity"
    ]
  },
  {
    name: "Frank",
    character: "social connector",
    description: "A charismatic and outgoing individual who loves bringing people together and facilitating connections. Frank thrives in social situations and helps others network.",
    personality: {
      openness: 75,
      conscientiousness: 60,
      extraversion: 95,
      agreeableness: 90,
      neuroticism: 20,
    },
    initialTrustScore: 70,
    initialEmotionalState: {
      happiness: 80,
      stress: 20,
      energy: 85,
      sociability: 95,
    },
    backstory: "Frank has always been the person who brings others together. He believes that strong social connections are the foundation of a healthy community.",
    goals: [
      "Connect people with shared interests",
      "Build a strong social network",
      "Facilitate meaningful relationships",
      "Create inclusive communities"
    ],
    interests: [
      "Social networking",
      "Community events",
      "Relationship building",
      "Communication",
      "Group activities"
    ],
    relationships: [
      "Friends with everyone",
      "Helps others make connections",
      "Organizes social gatherings"
    ]
  },
  {
    name: "Grace",
    character: "empathetic healer",
    description: "A compassionate individual who focuses on emotional wellbeing and helping others through difficult times. Grace has a natural ability to understand and comfort others.",
    personality: {
      openness: 80,
      conscientiousness: 70,
      extraversion: 65,
      agreeableness: 95,
      neuroticism: 35,
    },
    initialTrustScore: 85,
    initialEmotionalState: {
      happiness: 75,
      stress: 25,
      energy: 75,
      sociability: 80,
    },
    backstory: "Grace discovered her gift for helping others heal emotionally after going through her own difficult period. She now dedicates herself to supporting others in their journey.",
    goals: [
      "Help others heal emotionally",
      "Provide emotional support",
      "Create safe spaces for vulnerability",
      "Promote mental wellbeing"
    ],
    interests: [
      "Emotional healing",
      "Active listening",
      "Supportive relationships",
      "Mental health",
      "Compassionate care"
    ],
    relationships: [
      "Provides emotional support to all",
      "Helps Eve work through trust issues",
      "Supports Diana's emotional expression"
    ]
  },
  {
    name: "Henry",
    character: "ambitious leader",
    description: "A driven individual who enjoys taking charge and organizing others toward common goals. Henry is competitive but fair, always striving for excellence.",
    personality: {
      openness: 70,
      conscientiousness: 85,
      extraversion: 75,
      agreeableness: 65,
      neuroticism: 30,
    },
    initialTrustScore: 60,
    initialEmotionalState: {
      happiness: 70,
      stress: 35,
      energy: 85,
      sociability: 75,
    },
    backstory: "Henry has natural leadership abilities and has always been drawn to organizing and improving systems. He believes that strong leadership can bring out the best in everyone.",
    goals: [
      "Lead successful projects",
      "Organize efficient systems",
      "Motivate others to excel",
      "Achieve ambitious objectives"
    ],
    interests: [
      "Leadership development",
      "Project management",
      "Team coordination",
      "Strategic planning",
      "Performance optimization"
    ],
    relationships: [
      "Leads collaborative projects",
      "Respects Bob's technical expertise",
      "Values Charlie's wisdom in decision-making"
    ]
  }
];

// Helper functions for character management
export function getRandomCharacter(): CharacterData {
  return characters[Math.floor(Math.random() * characters.length)];
}

export function getCharacterByName(name: string): CharacterData | undefined {
  return characters.find(char => char.name.toLowerCase() === name.toLowerCase());
}

export function getCharactersByPersonality(trait: keyof CharacterData['personality'], minValue: number): CharacterData[] {
  return characters.filter(char => char.personality[trait] >= minValue);
}

export function getCompatibleCharacters(character: CharacterData): CharacterData[] {
  return characters.filter(other => {
    if (other.name === character.name) return false;
    
    // Simple compatibility based on personality traits
    const personalityDiff = Math.abs(character.personality.agreeableness - other.personality.agreeableness) +
                           Math.abs(character.personality.extraversion - other.personality.extraversion);
    
    return personalityDiff < 50; // Arbitrary threshold for compatibility
  });
}

export function generateCharacterVariation(baseCharacter: CharacterData, variation: number = 0.1): CharacterData {
  const vary = (value: number) => {
    const change = (Math.random() - 0.5) * 2 * variation * value;
    return Math.max(0, Math.min(100, value + change));
  };

  return {
    ...baseCharacter,
    name: `${baseCharacter.name}_${Math.random().toString(36).substr(2, 4)}`,
    personality: {
      openness: vary(baseCharacter.personality.openness),
      conscientiousness: vary(baseCharacter.personality.conscientiousness),
      extraversion: vary(baseCharacter.personality.extraversion),
      agreeableness: vary(baseCharacter.personality.agreeableness),
      neuroticism: vary(baseCharacter.personality.neuroticism),
    },
    initialTrustScore: vary(baseCharacter.initialTrustScore),
    initialEmotionalState: {
      happiness: vary(baseCharacter.initialEmotionalState.happiness),
      stress: vary(baseCharacter.initialEmotionalState.stress),
      energy: vary(baseCharacter.initialEmotionalState.energy),
      sociability: vary(baseCharacter.initialEmotionalState.sociability),
    },
  };
}