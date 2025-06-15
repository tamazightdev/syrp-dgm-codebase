import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { toast } from 'react-toastify';
import { GameWorld } from './GameWorld';
import { GameControls } from './GameControls';
import { AgentPanel } from './AgentPanel';
import { ConversationPanel } from './ConversationPanel';
import { TrustMetrics } from './TrustMetrics';
import { LoadingSpinner } from './LoadingSpinner';

export function Game() {
  const [engineId, setEngineId] = useState<Id<'engines'> | null>(null);
  const [worldId, setWorldId] = useState<Id<'worlds'> | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [showConversationPanel, setShowConversationPanel] = useState(false);
  const [showTrustMetrics, setShowTrustMetrics] = useState(false);

  // Mutations
  const initGame = useMutation(api.aiTown.main.init);
  const startEngine = useMutation(api.aiTown.main.start);
  const stopEngine = useMutation(api.aiTown.main.stop);
  const restartEngine = useMutation(api.aiTown.main.restart);

  // Queries
  const engineStatus = useQuery(
    api.aiTown.main.status,
    engineId ? { engineId } : 'skip'
  );

  const worldData = useQuery(
    api.aiTown.world.getWorld,
    worldId ? { worldId } : 'skip'
  );

  const agents = useQuery(
    api.aiTown.world.getAgents,
    worldId ? { worldId } : 'skip'
  );

  const conversations = useQuery(
    api.aiTown.world.getConversations,
    worldId ? { worldId } : 'skip'
  );

  // Initialize game on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const result = await initGame({});
        setEngineId(result.engineId);
        setWorldId(result.worldId);
        toast.success('Game initialized successfully!');
      } catch (error) {
        console.error('Failed to initialize game:', error);
        toast.error('Failed to initialize game');
      }
    };

    if (!engineId || !worldId) {
      initialize();
    }
  }, [initGame, engineId, worldId]);

  // Handle engine control
  const handleStartEngine = useCallback(async () => {
    if (!engineId) return;
    
    try {
      await startEngine({ engineId });
      toast.success('Game engine started!');
    } catch (error) {
      console.error('Failed to start engine:', error);
      toast.error('Failed to start engine');
    }
  }, [startEngine, engineId]);

  const handleStopEngine = useCallback(async () => {
    if (!engineId) return;
    
    try {
      await stopEngine({ engineId });
      toast.success('Game engine stopped!');
    } catch (error) {
      console.error('Failed to stop engine:', error);
      toast.error('Failed to stop engine');
    }
  }, [stopEngine, engineId]);

  const handleRestartEngine = useCallback(async () => {
    if (!engineId) return;
    
    try {
      await restartEngine({ engineId });
      toast.success('Game engine restarted!');
    } catch (error) {
      console.error('Failed to restart engine:', error);
      toast.error('Failed to restart engine');
    }
  }, [restartEngine, engineId]);

  // Handle agent selection
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setShowAgentPanel(true);
  }, []);

  // Handle conversation selection
  const handleConversationSelect = useCallback((conversationId: string) => {
    setShowConversationPanel(true);
  }, []);

  // Loading state
  if (!engineId || !worldId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <h2 className="mt-4 text-xl font-display text-white">
            Initializing AI Town...
          </h2>
          <p className="mt-2 text-gray-300 font-body">
            Setting up the world and starting the simulation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-display game-title">
                AI Town
              </h1>
              <span className="ml-3 px-2 py-1 text-xs font-body bg-purple-600 text-white rounded">
                SYRP-DGM
              </span>
            </div>

            {/* Engine Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    engineStatus?.running ? 'bg-green-400' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm font-body text-gray-300">
                  {engineStatus?.running ? 'Running' : 'Stopped'}
                </span>
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleStartEngine}
                  disabled={engineStatus?.running}
                  className="px-3 py-1 text-xs font-body bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Start
                </button>
                <button
                  onClick={handleStopEngine}
                  disabled={!engineStatus?.running}
                  className="px-3 py-1 text-xs font-body bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Stop
                </button>
                <button
                  onClick={handleRestartEngine}
                  className="px-3 py-1 text-xs font-body bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Restart
                </button>
              </div>

              {/* Panel Toggles */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTrustMetrics(!showTrustMetrics)}
                  className={`px-3 py-1 text-xs font-body rounded ${
                    showTrustMetrics
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Trust Metrics
                </button>
                <button
                  onClick={() => setShowAgentPanel(!showAgentPanel)}
                  className={`px-3 py-1 text-xs font-body rounded ${
                    showAgentPanel
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Agents
                </button>
                <button
                  onClick={() => setShowConversationPanel(!showConversationPanel)}
                  className={`px-3 py-1 text-xs font-body rounded ${
                    showConversationPanel
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  Conversations
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Trust Metrics */}
        {showTrustMetrics && (
          <div className="w-80 bg-black/30 backdrop-blur-sm border-r border-gray-700 overflow-y-auto">
            <TrustMetrics
              worldId={worldId}
              agents={agents || []}
              onAgentSelect={handleAgentSelect}
            />
          </div>
        )}

        {/* Main Game Area */}
        <div className="flex-1 relative">
          <GameWorld
            worldId={worldId}
            engineId={engineId}
            agents={agents || []}
            conversations={conversations || []}
            onAgentSelect={handleAgentSelect}
            onConversationSelect={handleConversationSelect}
          />

          {/* Game Controls Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <GameControls
              worldId={worldId}
              engineId={engineId}
              engineStatus={engineStatus}
            />
          </div>
        </div>

        {/* Right Sidebar - Agent Panel */}
        {showAgentPanel && (
          <div className="w-80 bg-black/30 backdrop-blur-sm border-l border-gray-700 overflow-y-auto">
            <AgentPanel
              worldId={worldId}
              selectedAgentId={selectedAgentId}
              agents={agents || []}
              onAgentSelect={handleAgentSelect}
              onClose={() => setShowAgentPanel(false)}
            />
          </div>
        )}

        {/* Conversation Panel */}
        {showConversationPanel && (
          <div className="w-96 bg-black/30 backdrop-blur-sm border-l border-gray-700 overflow-y-auto">
            <ConversationPanel
              worldId={worldId}
              conversations={conversations || []}
              onClose={() => setShowConversationPanel(false)}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-4 text-sm font-body text-gray-400">
              <span>
                Agents: {agents?.length || 0}
              </span>
              <span>
                Conversations: {conversations?.length || 0}
              </span>
              <span>
                Generation: {engineStatus?.generationNumber || 0}
              </span>
              {engineStatus?.pendingInputs !== undefined && (
                <span>
                  Pending: {engineStatus.pendingInputs}
                </span>
              )}
            </div>

            <div className="text-sm font-body text-gray-400">
              SYRP-DGM: Self-Yielding Reputation Protocol
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}