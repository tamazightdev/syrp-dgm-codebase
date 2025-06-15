import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { PixiViewport } from './PixiViewport';
import { Character } from './Character';
import { useServerGame } from '../hooks/useServerGame';
import { useHistoricalTime } from '../hooks/useHistoricalTime';
import { Id } from '../../convex/_generated/dataModel';

interface PixiGameProps {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  agents: any[];
  conversations: any[];
  onAgentSelect?: (agentId: string) => void;
  onConversationSelect?: (conversationId: string) => void;
}

export function PixiGame({
  worldId,
  engineId,
  agents,
  conversations,
  onAgentSelect,
  onConversationSelect,
}: PixiGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<any>(null);
  const charactersRef = useRef<Map<string, any>>(new Map());
  const conversationBubblesRef = useRef<Map<string, Graphics>>(new Map());
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { gameState, sendInput } = useServerGame(engineId);
  const { historicalTime } = useHistoricalTime(engineId);

  // Initialize PixiJS application
  useEffect(() => {
    if (!canvasRef.current || isInitialized) return;

    const app = new Application({
      view: canvasRef.current,
      width: 800,
      height: 600,
      backgroundColor: 0x2c5530, // Forest green background
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    appRef.current = app;

    // Create main container
    const mainContainer = new Container();
    app.stage.addChild(mainContainer);

    // Create viewport for panning and zooming
    const viewport = new PixiViewport({
      screenWidth: app.screen.width,
      screenHeight: app.screen.height,
      worldWidth: 1000,
      worldHeight: 1000,
      interaction: app.renderer.plugins.interaction,
    });

    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .clamp({ direction: 'all' })
      .clampZoom({ minScale: 0.5, maxScale: 3 });

    mainContainer.addChild(viewport);
    viewportRef.current = viewport;

    // Draw grid background
    drawGrid(viewport);

    // Draw world boundaries
    drawWorldBoundaries(viewport);

    setIsInitialized(true);

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [isInitialized]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      if (appRef.current && canvasRef.current) {
        const parent = canvasRef.current.parentElement;
        if (parent) {
          const width = parent.clientWidth;
          const height = parent.clientHeight;
          
          appRef.current.renderer.resize(width, height);
          
          if (viewportRef.current) {
            viewportRef.current.resize(width, height);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial resize

    return () => window.removeEventListener('resize', handleResize);
  }, [isInitialized]);

  // Update agents
  useEffect(() => {
    if (!isInitialized || !viewportRef.current) return;

    const viewport = viewportRef.current;
    const currentCharacters = charactersRef.current;

    // Remove characters that no longer exist
    for (const [agentId, character] of currentCharacters) {
      if (!agents.find(agent => agent.id === agentId)) {
        viewport.removeChild(character.container);
        currentCharacters.delete(agentId);
      }
    }

    // Add or update characters
    agents.forEach(agent => {
      let character = currentCharacters.get(agent.id);
      
      if (!character) {
        // Create new character
        character = new Character({
          id: agent.id,
          name: agent.name,
          position: agent.position,
          facing: agent.facing,
          status: agent.status,
          trustScore: agent.trustScore,
          emotionalState: agent.emotionalState,
          onClick: () => handleAgentClick(agent.id),
        });
        
        viewport.addChild(character.container);
        currentCharacters.set(agent.id, character);
      } else {
        // Update existing character
        character.update({
          position: agent.position,
          facing: agent.facing,
          status: agent.status,
          trustScore: agent.trustScore,
          emotionalState: agent.emotionalState,
        });
      }
    });
  }, [agents, isInitialized]);

  // Update conversation bubbles
  useEffect(() => {
    if (!isInitialized || !viewportRef.current) return;

    const viewport = viewportRef.current;
    const currentBubbles = conversationBubblesRef.current;

    // Remove old bubbles
    for (const [conversationId, bubble] of currentBubbles) {
      if (!conversations.find(conv => conv.id === conversationId)) {
        viewport.removeChild(bubble);
        currentBubbles.delete(conversationId);
      }
    }

    // Add or update conversation bubbles
    conversations.forEach(conversation => {
      if (conversation.status !== 'active') return;

      let bubble = currentBubbles.get(conversation.id);
      
      if (!bubble) {
        bubble = createConversationBubble(conversation);
        viewport.addChild(bubble);
        currentBubbles.set(conversation.id, bubble);
      }

      // Position bubble at center of participants
      const participantPositions = conversation.participants
        .map((participantId: string) => {
          const agent = agents.find(a => a.id === participantId);
          return agent ? agent.position : null;
        })
        .filter(Boolean);

      if (participantPositions.length > 0) {
        const centerX = participantPositions.reduce((sum: number, pos: any) => sum + pos.x, 0) / participantPositions.length;
        const centerY = participantPositions.reduce((sum: number, pos: any) => sum + pos.y, 0) / participantPositions.length;
        
        bubble.x = centerX;
        bubble.y = centerY - 40; // Position above characters
      }
    });
  }, [conversations, agents, isInitialized]);

  // Handle agent click
  const handleAgentClick = useCallback((agentId: string) => {
    setSelectedAgent(agentId);
    onAgentSelect?.(agentId);
  }, [onAgentSelect]);

  // Handle agent movement
  const handleAgentMove = useCallback(async (agentId: string, destination: { x: number; y: number }) => {
    try {
      await sendInput('walkTo', {
        playerId: agentId,
        destination,
      });
    } catch (error) {
      console.error('Failed to move agent:', error);
    }
  }, [sendInput]);

  // Draw grid background
  const drawGrid = (viewport: any) => {
    const grid = new Graphics();
    grid.lineStyle(1, 0x444444, 0.3);

    const gridSize = 50;
    const worldSize = 1000;

    // Vertical lines
    for (let x = 0; x <= worldSize; x += gridSize) {
      grid.moveTo(x, 0);
      grid.lineTo(x, worldSize);
    }

    // Horizontal lines
    for (let y = 0; y <= worldSize; y += gridSize) {
      grid.moveTo(0, y);
      grid.lineTo(worldSize, y);
    }

    viewport.addChild(grid);
  };

  // Draw world boundaries
  const drawWorldBoundaries = (viewport: any) => {
    const boundary = new Graphics();
    boundary.lineStyle(3, 0x666666, 1);
    boundary.drawRect(0, 0, 1000, 1000);
    viewport.addChild(boundary);
  };

  // Create conversation bubble
  const createConversationBubble = (conversation: any) => {
    const bubble = new Graphics();
    
    // Draw bubble background
    bubble.beginFill(0x000000, 0.7);
    bubble.lineStyle(2, 0xffffff, 0.8);
    bubble.drawRoundedRect(-30, -15, 60, 30, 10);
    bubble.endFill();

    // Add conversation icon
    const icon = new Graphics();
    icon.beginFill(0xffffff);
    icon.drawCircle(-10, 0, 3);
    icon.drawCircle(0, 0, 3);
    icon.drawCircle(10, 0, 3);
    icon.endFill();
    
    bubble.addChild(icon);

    // Make interactive
    bubble.interactive = true;
    bubble.buttonMode = true;
    bubble.on('pointerdown', () => {
      onConversationSelect?.(conversation.id);
    });

    return bubble;
  };

  return (
    <div className="w-full h-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Overlay UI */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
        <div className="text-white font-body text-sm space-y-1">
          <div>World Time: {historicalTime ? new Date(historicalTime).toLocaleTimeString() : 'N/A'}</div>
          <div>Agents: {agents.length}</div>
          <div>Active Conversations: {conversations.filter(c => c.status === 'active').length}</div>
          {selectedAgent && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <div>Selected: {agents.find(a => a.id === selectedAgent)?.name || 'Unknown'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
        <div className="text-white font-body text-xs space-y-1">
          <div>🖱️ Drag to pan</div>
          <div>🔍 Scroll to zoom</div>
          <div>👆 Click agents to select</div>
          <div>💬 Click bubbles for conversations</div>
        </div>
      </div>
    </div>
  );
}