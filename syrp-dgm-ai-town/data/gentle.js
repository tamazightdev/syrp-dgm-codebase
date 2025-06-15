// Gentle world map data for AI Town
// This defines the layout, walkable areas, and interactive zones

export const gentleWorldMap = {
  name: "Gentle Valley",
  description: "A peaceful valley where AI agents can interact, learn, and build trust",
  
  // World dimensions
  width: 1000,
  height: 1000,
  
  // Tile size for grid-based movement
  tileSize: 20,
  
  // Background layers
  background: {
    type: "gradient",
    colors: ["#2c5530", "#1a3d1f"], // Forest green gradient
    pattern: "radial"
  },
  
  // Terrain features
  terrain: [
    {
      id: "central_plaza",
      type: "plaza",
      name: "Central Plaza",
      description: "The heart of the community where agents gather",
      bounds: { x: 400, y: 400, width: 200, height: 200 },
      walkable: true,
      interactionBonus: 1.2, // Increased chance of interactions
      trustBonus: 0.1, // Small trust bonus for interactions here
      color: "#8B4513"
    },
    {
      id: "research_lab",
      type: "building",
      name: "Research Laboratory",
      description: "A place for scientific collaboration and discovery",
      bounds: { x: 100, y: 100, width: 150, height: 100 },
      walkable: true,
      specialFunction: "research",
      requiredPersonality: { openness: 60 },
      color: "#4169E1"
    },
    {
      id: "workshop",
      type: "building",
      name: "Engineering Workshop",
      description: "Where practical problems are solved",
      bounds: { x: 750, y: 150, width: 120, height: 120 },
      walkable: true,
      specialFunction: "engineering",
      requiredPersonality: { conscientiousness: 70 },
      color: "#FF6347"
    },
    {
      id: "art_studio",
      type: "building",
      name: "Art Studio",
      description: "A creative space for artistic expression",
      bounds: { x: 150, y: 750, width: 140, height: 100 },
      walkable: true,
      specialFunction: "creativity",
      requiredPersonality: { openness: 70, extraversion: 60 },
      color: "#DA70D6"
    },
    {
      id: "meditation_garden",
      type: "garden",
      name: "Meditation Garden",
      description: "A peaceful place for reflection and wisdom",
      bounds: { x: 700, y: 700, width: 180, height: 180 },
      walkable: true,
      specialFunction: "reflection",
      stressReduction: 0.2,
      energyRestore: 0.1,
      color: "#90EE90"
    },
    {
      id: "community_center",
      type: "building",
      name: "Community Center",
      description: "Where social events and gatherings take place",
      bounds: { x: 350, y: 150, width: 200, height: 120 },
      walkable: true,
      specialFunction: "social",
      socialBonus: 1.5,
      color: "#FFD700"
    },
    {
      id: "healing_sanctuary",
      type: "building",
      name: "Healing Sanctuary",
      description: "A place for emotional support and recovery",
      bounds: { x: 50, y: 400, width: 120, height: 150 },
      walkable: true,
      specialFunction: "healing",
      stressReduction: 0.3,
      trustBonus: 0.15,
      color: "#98FB98"
    },
    {
      id: "northern_forest",
      type: "nature",
      name: "Northern Forest",
      description: "A quiet forest area for solitude and contemplation",
      bounds: { x: 0, y: 0, width: 1000, height: 80 },
      walkable: true,
      energyRestore: 0.05,
      stressReduction: 0.1,
      color: "#228B22"
    },
    {
      id: "eastern_hills",
      type: "nature",
      name: "Eastern Hills",
      description: "Rolling hills with scenic views",
      bounds: { x: 920, y: 0, width: 80, height: 1000 },
      walkable: true,
      energyRestore: 0.05,
      color: "#32CD32"
    },
    {
      id: "southern_meadow",
      type: "nature",
      name: "Southern Meadow",
      description: "Open meadow perfect for group activities",
      bounds: { x: 0, y: 920, width: 1000, height: 80 },
      walkable: true,
      socialBonus: 1.2,
      color: "#ADFF2F"
    },
    {
      id: "western_grove",
      type: "nature",
      name: "Western Grove",
      description: "A grove of ancient trees",
      bounds: { x: 0, y: 0, width: 80, height: 1000 },
      walkable: true,
      energyRestore: 0.05,
      color: "#006400"
    }
  ],
  
  // Pathways connecting different areas
  paths: [
    {
      id: "main_path_ns",
      type: "path",
      description: "Main north-south pathway",
      points: [
        { x: 500, y: 0 },
        { x: 500, y: 400 },
        { x: 500, y: 600 },
        { x: 500, y: 1000 }
      ],
      width: 40,
      walkable: true,
      speedBonus: 1.2,
      color: "#D2B48C"
    },
    {
      id: "main_path_ew",
      type: "path",
      description: "Main east-west pathway",
      points: [
        { x: 0, y: 500 },
        { x: 400, y: 500 },
        { x: 600, y: 500 },
        { x: 1000, y: 500 }
      ],
      width: 40,
      walkable: true,
      speedBonus: 1.2,
      color: "#D2B48C"
    },
    {
      id: "plaza_connections",
      type: "path",
      description: "Paths connecting to central plaza",
      points: [
        { x: 500, y: 400 },
        { x: 400, y: 400 },
        { x: 400, y: 500 },
        { x: 500, y: 500 },
        { x: 600, y: 500 },
        { x: 600, y: 400 },
        { x: 500, y: 400 }
      ],
      width: 20,
      walkable: true,
      color: "#DEB887"
    }
  ],
  
  // Spawn points for new agents
  spawnPoints: [
    { x: 480, y: 480, name: "Central Plaza Entrance" },
    { x: 200, y: 200, name: "Research Quarter" },
    { x: 800, y: 200, name: "Engineering Quarter" },
    { x: 200, y: 800, name: "Arts Quarter" },
    { x: 800, y: 800, name: "Wisdom Quarter" },
    { x: 500, y: 200, name: "Community Entrance" },
    { x: 150, y: 500, name: "Healing Entrance" }
  ],
  
  // Special interaction zones
  interactionZones: [
    {
      id: "trust_circle",
      name: "Trust Circle",
      description: "A special area where trust-building activities occur",
      center: { x: 500, y: 500 },
      radius: 50,
      effect: {
        trustBonus: 0.2,
        interactionChance: 1.5,
        memoryImportance: 1.3
      }
    },
    {
      id: "conflict_resolution",
      name: "Resolution Grove",
      description: "Where conflicts are peacefully resolved",
      center: { x: 790, y: 790 },
      radius: 40,
      effect: {
        stressReduction: 0.3,
        trustRepair: 0.25,
        wisdomBonus: 1.2
      }
    },
    {
      id: "innovation_hub",
      name: "Innovation Hub",
      description: "Where new ideas are born and shared",
      center: { x: 175, y: 150 },
      radius: 60,
      effect: {
        creativityBonus: 1.4,
        collaborationChance: 1.3,
        knowledgeSharing: 1.5
      }
    }
  ],
  
  // Environmental effects that change over time
  timeEffects: {
    morning: {
      energyBonus: 0.1,
      socialBonus: 1.2,
      description: "Fresh morning energy encourages social interaction"
    },
    afternoon: {
      productivityBonus: 1.3,
      focusBonus: 1.2,
      description: "Peak productivity hours"
    },
    evening: {
      reflectionBonus: 1.4,
      trustBonus: 0.1,
      description: "Evening reflection deepens relationships"
    },
    night: {
      restBonus: 1.5,
      energyRestore: 0.2,
      description: "Peaceful night rest"
    }
  },
  
  // Weather effects (optional dynamic system)
  weatherEffects: {
    sunny: {
      happinessBonus: 0.1,
      energyBonus: 0.05,
      socialBonus: 1.1,
      description: "Sunny weather lifts spirits"
    },
    cloudy: {
      reflectionBonus: 1.2,
      creativityBonus: 1.1,
      description: "Cloudy skies encourage introspection"
    },
    rainy: {
      indoorBonus: 1.3,
      cozinessBonus: 1.2,
      trustBonus: 0.05,
      description: "Rain brings people together indoors"
    }
  },
  
  // Navigation helpers
  navigation: {
    // Key landmarks for pathfinding
    landmarks: [
      { id: "plaza", position: { x: 500, y: 500 }, name: "Central Plaza" },
      { id: "lab", position: { x: 175, y: 150 }, name: "Research Lab" },
      { id: "workshop", position: { x: 810, y: 210 }, name: "Workshop" },
      { id: "studio", position: { x: 220, y: 800 }, name: "Art Studio" },
      { id: "garden", position: { x: 790, y: 790 }, name: "Meditation Garden" },
      { id: "center", position: { x: 450, y: 210 }, name: "Community Center" },
      { id: "sanctuary", position: { x: 110, y: 475 }, name: "Healing Sanctuary" }
    ],
    
    // Preferred routes between landmarks
    routes: [
      {
        from: "plaza",
        to: "lab",
        waypoints: [{ x: 400, y: 400 }, { x: 300, y: 300 }, { x: 175, y: 150 }],
        difficulty: 1.0
      },
      {
        from: "plaza",
        to: "workshop",
        waypoints: [{ x: 600, y: 500 }, { x: 700, y: 400 }, { x: 810, y: 210 }],
        difficulty: 1.0
      },
      {
        from: "lab",
        to: "workshop",
        waypoints: [{ x: 175, y: 150 }, { x: 500, y: 150 }, { x: 810, y: 210 }],
        difficulty: 1.2
      }
    ]
  },
  
  // Validation function
  isWalkable: function(x, y) {
    // Check if position is within world bounds
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    
    // Check terrain features
    for (const feature of this.terrain) {
      if (this.isPointInBounds(x, y, feature.bounds)) {
        return feature.walkable;
      }
    }
    
    // Check paths
    for (const path of this.paths) {
      if (this.isPointOnPath(x, y, path)) {
        return path.walkable;
      }
    }
    
    // Default to walkable if not in any special area
    return true;
  },
  
  // Helper functions
  isPointInBounds: function(x, y, bounds) {
    return x >= bounds.x && x < bounds.x + bounds.width &&
           y >= bounds.y && y < bounds.y + bounds.height;
  },
  
  isPointOnPath: function(x, y, path) {
    // Simplified path checking - in a real implementation,
    // this would check distance to path segments
    for (let i = 0; i < path.points.length - 1; i++) {
      const p1 = path.points[i];
      const p2 = path.points[i + 1];
      
      // Simple distance check to line segment
      const dist = this.distanceToLineSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist <= path.width / 2) {
        return true;
      }
    }
    return false;
  },
  
  distanceToLineSegment: function(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  },
  
  // Get area effects for a position
  getAreaEffects: function(x, y) {
    const effects = {};
    
    // Check terrain features
    for (const feature of this.terrain) {
      if (this.isPointInBounds(x, y, feature.bounds)) {
        if (feature.interactionBonus) effects.interactionBonus = feature.interactionBonus;
        if (feature.trustBonus) effects.trustBonus = feature.trustBonus;
        if (feature.socialBonus) effects.socialBonus = feature.socialBonus;
        if (feature.stressReduction) effects.stressReduction = feature.stressReduction;
        if (feature.energyRestore) effects.energyRestore = feature.energyRestore;
      }
    }
    
    // Check interaction zones
    for (const zone of this.interactionZones) {
      const distance = Math.sqrt(
        (x - zone.center.x) * (x - zone.center.x) +
        (y - zone.center.y) * (y - zone.center.y)
      );
      
      if (distance <= zone.radius) {
        Object.assign(effects, zone.effect);
      }
    }
    
    return effects;
  },
  
  // Find nearest landmark
  findNearestLandmark: function(x, y) {
    let nearest = null;
    let minDistance = Infinity;
    
    for (const landmark of this.navigation.landmarks) {
      const distance = Math.sqrt(
        (x - landmark.position.x) * (x - landmark.position.x) +
        (y - landmark.position.y) * (y - landmark.position.y)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = landmark;
      }
    }
    
    return { landmark: nearest, distance: minDistance };
  }
};

// Export for use in the application
export default gentleWorldMap;