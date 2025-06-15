import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useSendInput } from './sendInput';
import { useHistoricalTime } from './useHistoricalTime';

interface GameState {
  engineId: Id<'engines'> | null;
  worldId: Id<'worlds'> | null;
  isRunning: boolean;
  currentTime: number | null;
  generationNumber: number;
  pendingInputs: number;
  agents: any[];
  conversations: any[];
  players: any[];
  lastUpdate: number;
}

interface UseServerGameOptions {
  autoStart?: boolean;
  pollInterval?: number;
  maxRetries?: number;
}

export function useServerGame(
  engineId: Id<'engines'> | null,
  options: UseServerGameOptions = {}
) {
  const { autoStart = false, pollInterval = 1000, maxRetries = 3 } = options;
  
  const [gameState, setGameState] = useState<GameState>({
    engineId,
    worldId: null,
    isRunning: false,
    currentTime: null,
    generationNumber: 0,
    pendingInputs: 0,
    agents: [],
    conversations: [],
    players: [],
    lastUpdate: Date.now(),
  });

  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Query engine status
  const engineStatus = useQuery(
    api.aiTown.main.status,
    engineId ? { engineId } : 'skip'
  );

  // Query world data
  const worldData = useQuery(
    api.aiTown.world.getWorld,
    gameState.worldId ? { worldId: gameState.worldId } : 'skip'
  );

  // Query agents
  const agents = useQuery(
    api.aiTown.world.getAgents,
    gameState.worldId ? { worldId: gameState.worldId } : 'skip'
  );

  // Query conversations
  const conversations = useQuery(
    api.aiTown.world.getConversations,
    gameState.worldId ? { worldId: gameState.worldId } : 'skip'
  );

  // Query players
  const players = useQuery(
    api.aiTown.world.getPlayers,
    gameState.worldId ? { worldId: gameState.worldId } : 'skip'
  );

  // Historical time hook
  const { historicalTime } = useHistoricalTime(engineId);

  // Send input hook
  const { sendInput: sendInputRaw, ...inputMethods } = useSendInput({
    engineId: engineId!,
    onSuccess: (result) => {
      setError(null);
      setRetryCount(0);
    },
    onError: (error) => {
      setError(error.message);
      handleRetry();
    },
  });

  // Enhanced send input with retry logic
  const sendInput = useCallback(async (name: string, args: any) => {
    if (!engineId) {
      throw new Error('Engine not initialized');
    }

    try {
      const result = await sendInputRaw(name, args);
      setError(null);
      setRetryCount(0);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      
      if (retryCount < maxRetries) {
        handleRetry();
        throw error;
      } else {
        throw new Error(`Failed after ${maxRetries} retries: ${errorMessage}`);
      }
    }
  }, [sendInputRaw, engineId, retryCount, maxRetries]);

  // Handle retry logic
  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, delay);
    }
  }, [retryCount, maxRetries]);

  // Update game state when data changes
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      engineId,
      isRunning: engineStatus?.running || false,
      currentTime: engineStatus?.currentTime || null,
      generationNumber: engineStatus?.generationNumber || 0,
      pendingInputs: engineStatus?.pendingInputs || 0,
      agents: agents || [],
      conversations: conversations || [],
      players: players || [],
      lastUpdate: Date.now(),
    }));
  }, [engineId, engineStatus, agents, conversations, players]);

  // Update world ID when world data is available
  useEffect(() => {
    if (worldData && worldData._id) {
      setGameState(prev => ({
        ...prev,
        worldId: worldData._id,
      }));
    }
  }, [worldData]);

  // Auto-start engine if requested
  useEffect(() => {
    if (autoStart && engineId && engineStatus && !engineStatus.running) {
      inputMethods.start().catch(console.error);
    }
  }, [autoStart, engineId, engineStatus, inputMethods]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Game control methods
  const startGame = useCallback(async () => {
    return await inputMethods.start();
  }, [inputMethods]);

  const stopGame = useCallback(async () => {
    return await inputMethods.stop();
  }, [inputMethods]);

  const restartGame = useCallback(async () => {
    return await inputMethods.restart();
  }, [inputMethods]);

  // Agent management methods
  const createAgent = useCallback(async (name: string, character: string, description: string) => {
    return await inputMethods.join(name, character, description);
  }, [inputMethods]);

  const removeAgent = useCallback(async (playerId: string) => {
    return await inputMethods.leave(playerId);
  }, [inputMethods]);

  const moveAgent = useCallback(async (playerId: string, destination: { x: number; y: number }) => {
    return await inputMethods.walkTo(playerId, destination);
  }, [inputMethods]);

  const wakeUpAgent = useCallback(async (agentId: string) => {
    return await inputMethods.agentWakeUp(agentId);
  }, [inputMethods]);

  // Conversation methods
  const startConversation = useCallback(async (playerId: string, invitee: string) => {
    return await inputMethods.startConversation(playerId, invitee);
  }, [inputMethods]);

  const sendMessage = useCallback(async (playerId: string, text: string) => {
    const messageUuid = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return await inputMethods.sendMessage(playerId, text, messageUuid);
  }, [inputMethods]);

  const leaveConversation = useCallback(async (playerId: string, conversationId: string) => {
    return await inputMethods.leaveConversation(playerId, conversationId);
  }, [inputMethods]);

  // Utility methods
  const getAgent = useCallback((agentId: string) => {
    return gameState.agents.find(agent => agent.id === agentId);
  }, [gameState.agents]);

  const getConversation = useCallback((conversationId: string) => {
    return gameState.conversations.find(conv => conv.id === conversationId);
  }, [gameState.conversations]);

  const getActiveConversations = useCallback(() => {
    return gameState.conversations.filter(conv => conv.status === 'active');
  }, [gameState.conversations]);

  const getAgentsByStatus = useCallback((status: string) => {
    return gameState.agents.filter(agent => agent.status === status);
  }, [gameState.agents]);

  // Statistics
  const getStats = useCallback(() => {
    const activeConversations = getActiveConversations().length;
    const sleepingAgents = getAgentsByStatus('sleeping').length;
    const talkingAgents = getAgentsByStatus('talking').length;
    const walkingAgents = getAgentsByStatus('walking').length;
    
    return {
      totalAgents: gameState.agents.length,
      totalConversations: gameState.conversations.length,
      activeConversations,
      sleepingAgents,
      talkingAgents,
      walkingAgents,
      pendingInputs: gameState.pendingInputs,
      generationNumber: gameState.generationNumber,
      isRunning: gameState.isRunning,
      currentTime: gameState.currentTime,
      historicalTime,
    };
  }, [gameState, historicalTime, getActiveConversations, getAgentsByStatus]);

  return {
    gameState,
    error,
    retryCount,
    
    // Raw send input
    sendInput,
    
    // Game controls
    startGame,
    stopGame,
    restartGame,
    
    // Agent management
    createAgent,
    removeAgent,
    moveAgent,
    wakeUpAgent,
    
    // Conversation management
    startConversation,
    sendMessage,
    leaveConversation,
    
    // Utility methods
    getAgent,
    getConversation,
    getActiveConversations,
    getAgentsByStatus,
    getStats,
    
    // All input methods
    ...inputMethods,
  };
}

// Hook for monitoring specific agent
export function useAgent(engineId: Id<'engines'> | null, agentId: string | null) {
  const { gameState, getAgent } = useServerGame(engineId);
  
  const agent = agentId ? getAgent(agentId) : null;
  
  return {
    agent,
    isLoading: !gameState.worldId,
    exists: !!agent,
  };
}

// Hook for monitoring specific conversation
export function useConversation(engineId: Id<'engines'> | null, conversationId: string | null) {
  const { gameState, getConversation } = useServerGame(engineId);
  
  const conversation = conversationId ? getConversation(conversationId) : null;
  
  return {
    conversation,
    isLoading: !gameState.worldId,
    exists: !!conversation,
    isActive: conversation?.status === 'active',
  };
}