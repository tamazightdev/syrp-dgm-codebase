import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useHistoricalTime } from '../hooks/useHistoricalTime';
import { useSendInput } from '../hooks/sendInput';

interface PlayerDetailsProps {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  playerId: string | null;
  onClose?: () => void;
}

export function PlayerDetails({ worldId, engineId, playerId, onClose }: PlayerDetailsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'memories' | 'relationships' | 'stats'>('overview');

  // Queries
  const agent = useQuery(
    api.aiTown.agentOperations.getAgent,
    playerId ? { worldId, agentId: playerId } : 'skip'
  );

  const agentStats = useQuery(
    api.aiTown.agentOperations.getAgentStats,
    playerId ? { worldId, agentId: playerId } : 'skip'
  );

  const agentMemories = useQuery(
    api.aiTown.agentOperations.getAgentMemories,
    playerId ? { worldId, agentId: playerId, limit: 10 } : 'skip'
  );

  // Hooks
  const { historicalTime, formatTime, getRelativeTime } = useHistoricalTime(engineId);
  const { sendInput } = useSendInput({
    engineId,
    onSuccess: () => console.log('Action completed'),
    onError: (error) => console.error('Action failed:', error),
  });

  if (!playerId) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">👤</div>
          <h3 className="text-lg font-display mb-2">No Agent Selected</h3>
          <p className="text-sm font-body">Click on an agent in the world to view their details</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-400">
          <div className="animate-spin text-2xl mb-4">⏳</div>
          <p className="font-body">Loading agent details...</p>
        </div>
      </div>
    );
  }

  const handleWakeUp = async () => {
    if (agent.status === 'sleeping') {
      try {
        await sendInput('agentWakeUp', { agentId: playerId });
      } catch (error) {
        console.error('Failed to wake up agent:', error);
      }
    }
  };

  const handleGenerateReflection = async () => {
    try {
      await sendInput('generateReflection', { worldId, agentId: playerId });
    } catch (error) {
      console.error('Failed to generate reflection:', error);
    }
  };

  const getTrustColor = (trustScore: number) => {
    if (trustScore >= 70) return 'text-green-400';
    if (trustScore >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getEmotionColor = (value: number) => {
    if (value >= 70) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sleeping': return '😴';
      case 'walking': return '🚶';
      case 'talking': return '💬';
      case 'thinking': return '🤔';
      default: return '🧍';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/20 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getStatusIcon(agent.status)}</div>
          <div>
            <h2 className="text-lg font-display text-white">{agent.name}</h2>
            <p className="text-sm font-body text-gray-300 capitalize">{agent.character}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-600">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'memories', label: 'Memories', icon: '🧠' },
          { id: 'relationships', label: 'Social', icon: '👥' },
          { id: 'stats', label: 'Stats', icon: '📈' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 px-3 py-2 text-sm font-body transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Status & Actions */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-display text-white mb-3">Current Status</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body text-gray-300">Status:</span>
                  <span className="text-sm font-body text-white capitalize">
                    {getStatusIcon(agent.status)} {agent.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body text-gray-300">Position:</span>
                  <span className="text-sm font-body text-white">
                    ({Math.round(agent.position.x)}, {Math.round(agent.position.y)})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-body text-gray-300">Last Activity:</span>
                  <span className="text-sm font-body text-white">
                    {getRelativeTime(agent.lastActivity)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {agent.status === 'sleeping' && (
                  <button
                    onClick={handleWakeUp}
                    className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-body rounded hover:bg-blue-700 transition-colors"
                  >
                    Wake Up Agent
                  </button>
                )}
                <button
                  onClick={handleGenerateReflection}
                  className="w-full px-3 py-2 bg-purple-600 text-white text-sm font-body rounded hover:bg-purple-700 transition-colors"
                >
                  Generate Reflection
                </button>
              </div>
            </div>

            {/* Trust & Reputation */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-display text-white mb-3">Trust & Reputation</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-body text-gray-300">Trust Score:</span>
                    <span className={`text-sm font-body font-bold ${getTrustColor(agent.trustScore)}`}>
                      {Math.round(agent.trustScore)}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        agent.trustScore >= 70 ? 'bg-green-500' :
                        agent.trustScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, agent.trustScore))}%` }}
                    />
                  </div>
                </div>

                <div className="text-xs font-body text-gray-400">
                  Recent Actions: {agent.reputation?.recentActions || 0}
                </div>
              </div>
            </div>

            {/* Emotional State */}
            <div className="bg-gray-800/50 rounded-lg p-4">
              <h3 className="text-sm font-display text-white mb-3">Emotional State</h3>
              <div className="space-y-3">
                {[
                  { label: 'Happiness', value: agent.emotionalState.happiness, icon: '😊' },
                  { label: 'Stress', value: agent.emotionalState.stress, icon: '😰' },
                  { label: 'Energy', value: agent.emotionalState.energy, icon: '⚡' },
                  { label: 'Sociability', value: agent.emotionalState.sociability, icon: '👥' },
                ].map((emotion) => (
                  <div key={emotion.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-body text-gray-300">
                        {emotion.icon} {emotion.label}:
                      </span>
                      <span className="text-sm font-body text-white">
                        {Math.round(emotion.value)}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getEmotionColor(emotion.value)}`}
                        style={{ width: `${Math.max(0, Math.min(100, emotion.value))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Goal */}
            {agent.currentGoal && (
              <div className="bg-gray-800/50 rounded-lg p-4">
                <h3 className="text-sm font-display text-white mb-3">Current Goal</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-gray-300">Type:</span>
                    <span className="text-sm font-body text-white capitalize">
                      {agent.currentGoal.type}
                    </span>
                  </div>
                  {agent.currentGoal.target && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-body text-gray-300">Target:</span>
                      <span className="text-sm font-body text-white">
                        {agent.currentGoal.target}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-body text-gray-300">Priority:</span>
                    <span className="text-sm font-body text-white">
                      {agent.currentGoal.priority}/10
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-display text-white">Recent Memories</h3>
              <span className="text-xs font-body text-gray-400">
                {agentMemories?.length || 0} memories
              </span>
            </div>

            {agentMemories && agentMemories.length > 0 ? (
              <div className="space-y-3">
                {agentMemories.map((memory, index) => (
                  <div key={memory.id} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-body text-gray-400">
                        Importance: {Math.round(memory.importance)}/10
                      </span>
                      <span className="text-xs font-body text-gray-400">
                        {getRelativeTime(memory.lastAccess)}
                      </span>
                    </div>
                    <p className="text-sm font-body text-white leading-relaxed">
                      {memory.description}
                    </p>
                    {memory.data?.type && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-purple-600/30 text-purple-300 text-xs font-body rounded">
                          {memory.data.type}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-2xl mb-2">🧠</div>
                <p className="text-sm font-body">No memories yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'relationships' && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white">Social Connections</h3>

            {agent.socialConnections && agent.socialConnections.length > 0 ? (
              <div className="space-y-3">
                {agent.socialConnections.map((connection, index) => (
                  <div key={connection.agentId} className="bg-gray-800/50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-body text-white">
                        Agent {connection.agentId}
                      </span>
                      <span className={`text-sm font-body ${getTrustColor(connection.trustLevel)}`}>
                        {Math.round(connection.trustLevel)}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-body text-gray-400">
                      <span>Interactions: {connection.interactionCount}</span>
                      <span>Last: {getRelativeTime(connection.lastInteraction)}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-700 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full ${
                          connection.trustLevel >= 70 ? 'bg-green-500' :
                          connection.trustLevel >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, connection.trustLevel))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-8">
                <div className="text-2xl mb-2">👥</div>
                <p className="text-sm font-body">No social connections yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && agentStats && (
          <div className="space-y-4">
            <h3 className="text-sm font-display text-white">Statistics</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-display text-white">
                  {agentStats.memoryCount}
                </div>
                <div className="text-xs font-body text-gray-400">Memories</div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-display text-white">
                  {agentStats.conversationCount}
                </div>
                <div className="text-xs font-body text-gray-400">Conversations</div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-display text-white">
                  {agentStats.socialConnections}
                </div>
                <div className="text-xs font-body text-gray-400">Connections</div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-display text-white">
                  {agentStats.recentActions}
                </div>
                <div className="text-xs font-body text-gray-400">Recent Actions</div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <h4 className="text-sm font-display text-white mb-3">Reputation Summary</h4>
              <div className="space-y-2 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-gray-300">Trust Score:</span>
                  <span className={getTrustColor(agentStats.trustScore)}>
                    {Math.round(agentStats.trustScore)}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Happiness:</span>
                  <span className="text-white">
                    {Math.round(agentStats.emotionalState.happiness)}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Energy:</span>
                  <span className="text-white">
                    {Math.round(agentStats.emotionalState.energy)}/100
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-white capitalize">
                    {getStatusIcon(agentStats.status)} {agentStats.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}