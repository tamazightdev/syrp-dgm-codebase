import React, { useState, useCallback } from 'react';
import { useSendInput } from '../../hooks/sendInput';
import { Id } from '../../../convex/_generated/dataModel';

interface InteractButtonProps {
  engineId: Id<'engines'>;
  playerId: string | null;
  targetId: string | null;
  action: 'startConversation' | 'walkTo' | 'wakeUp' | 'follow' | 'trust' | 'distrust';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  // Additional props for specific actions
  destination?: { x: number; y: number };
  trustDelta?: number;
}

export function InteractButton({
  engineId,
  playerId,
  targetId,
  action,
  disabled = false,
  className = '',
  children,
  onSuccess,
  onError,
  destination,
  trustDelta = 5,
}: InteractButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { sendInput } = useSendInput({
    engineId,
    onSuccess: (result) => {
      setIsLoading(false);
      onSuccess?.(result);
    },
    onError: (error) => {
      setIsLoading(false);
      onError?.(error.message);
    },
  });

  const handleClick = useCallback(async () => {
    if (!playerId || isLoading || disabled) return;

    setIsLoading(true);

    try {
      switch (action) {
        case 'startConversation':
          if (!targetId) throw new Error('Target required for conversation');
          await sendInput('startConversation', { playerId, invitee: targetId });
          break;

        case 'walkTo':
          if (!destination) throw new Error('Destination required for walking');
          await sendInput('walkTo', { playerId, destination });
          break;

        case 'wakeUp':
          await sendInput('agentWakeUp', { agentId: playerId });
          break;

        case 'follow':
          if (!targetId) throw new Error('Target required for following');
          // This would need to be implemented as a continuous action
          // For now, just walk to the target's current position
          await sendInput('walkTo', { playerId, destination: { x: 0, y: 0 } }); // Placeholder
          break;

        case 'trust':
          if (!targetId) throw new Error('Target required for trust action');
          await sendInput('updateSocialConnection', {
            worldId: 'current', // This would need to be passed as a prop
            agentId: playerId,
            otherAgentId: targetId,
            trustDelta,
            context: 'Manual trust increase',
          });
          break;

        case 'distrust':
          if (!targetId) throw new Error('Target required for distrust action');
          await sendInput('updateSocialConnection', {
            worldId: 'current', // This would need to be passed as a prop
            agentId: playerId,
            otherAgentId: targetId,
            trustDelta: -trustDelta,
            context: 'Manual trust decrease',
          });
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [playerId, targetId, action, destination, trustDelta, isLoading, disabled, sendInput]);

  const getButtonContent = () => {
    if (children) return children;

    if (isLoading) {
      return (
        <span className="flex items-center">
          <div className="animate-spin w-4 h-4 mr-2">⏳</div>
          Loading...
        </span>
      );
    }

    switch (action) {
      case 'startConversation':
        return (
          <span className="flex items-center">
            <span className="mr-2">💬</span>
            Start Conversation
          </span>
        );
      case 'walkTo':
        return (
          <span className="flex items-center">
            <span className="mr-2">🚶</span>
            Walk Here
          </span>
        );
      case 'wakeUp':
        return (
          <span className="flex items-center">
            <span className="mr-2">⏰</span>
            Wake Up
          </span>
        );
      case 'follow':
        return (
          <span className="flex items-center">
            <span className="mr-2">👥</span>
            Follow
          </span>
        );
      case 'trust':
        return (
          <span className="flex items-center">
            <span className="mr-2">👍</span>
            Trust (+{trustDelta})
          </span>
        );
      case 'distrust':
        return (
          <span className="flex items-center">
            <span className="mr-2">👎</span>
            Distrust (-{trustDelta})
          </span>
        );
      default:
        return 'Interact';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = 'px-3 py-2 text-sm font-body rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    
    if (className) return `${baseStyle} ${className}`;

    switch (action) {
      case 'startConversation':
        return `${baseStyle} bg-blue-600 text-white hover:bg-blue-700`;
      case 'walkTo':
        return `${baseStyle} bg-green-600 text-white hover:bg-green-700`;
      case 'wakeUp':
        return `${baseStyle} bg-yellow-600 text-white hover:bg-yellow-700`;
      case 'follow':
        return `${baseStyle} bg-purple-600 text-white hover:bg-purple-700`;
      case 'trust':
        return `${baseStyle} bg-emerald-600 text-white hover:bg-emerald-700`;
      case 'distrust':
        return `${baseStyle} bg-red-600 text-white hover:bg-red-700`;
      default:
        return `${baseStyle} bg-gray-600 text-white hover:bg-gray-700`;
    }
  };

  const isDisabled = disabled || isLoading || !playerId || 
    (action === 'startConversation' && !targetId) ||
    (action === 'walkTo' && !destination) ||
    (action === 'follow' && !targetId) ||
    (action === 'trust' && !targetId) ||
    (action === 'distrust' && !targetId);

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={getButtonStyle()}
      title={`${action} ${targetId ? `with ${targetId}` : ''}`}
    >
      {getButtonContent()}
    </button>
  );
}

// Specialized interaction buttons
export function ConversationButton(props: Omit<InteractButtonProps, 'action'>) {
  return <InteractButton {...props} action="startConversation" />;
}

export function WalkButton(props: Omit<InteractButtonProps, 'action'>) {
  return <InteractButton {...props} action="walkTo" />;
}

export function WakeUpButton(props: Omit<InteractButtonProps, 'action'>) {
  return <InteractButton {...props} action="wakeUp" />;
}

export function TrustButton(props: Omit<InteractButtonProps, 'action'>) {
  return <InteractButton {...props} action="trust" />;
}

export function DistrustButton(props: Omit<InteractButtonProps, 'action'>) {
  return <InteractButton {...props} action="distrust" />;
}

// Compound interaction panel
export function InteractionPanel({
  engineId,
  playerId,
  targetId,
  targetPosition,
  targetStatus,
  onSuccess,
  onError,
}: {
  engineId: Id<'engines'>;
  playerId: string | null;
  targetId: string | null;
  targetPosition?: { x: number; y: number };
  targetStatus?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}) {
  const canStartConversation = targetId && targetStatus !== 'sleeping' && targetStatus !== 'talking';
  const canWakeUp = targetStatus === 'sleeping';

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-display text-white mb-3">Interactions</h4>
      
      <div className="grid grid-cols-2 gap-2">
        {/* Conversation */}
        <ConversationButton
          engineId={engineId}
          playerId={playerId}
          targetId={targetId}
          disabled={!canStartConversation}
          onSuccess={onSuccess}
          onError={onError}
        />

        {/* Wake up */}
        {canWakeUp && (
          <WakeUpButton
            engineId={engineId}
            playerId={targetId} // Wake up the target
            targetId={null}
            onSuccess={onSuccess}
            onError={onError}
          />
        )}

        {/* Trust actions */}
        <TrustButton
          engineId={engineId}
          playerId={playerId}
          targetId={targetId}
          trustDelta={5}
          onSuccess={onSuccess}
          onError={onError}
        />

        <DistrustButton
          engineId={engineId}
          playerId={playerId}
          targetId={targetId}
          trustDelta={5}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>

      {/* Walk to target */}
      {targetPosition && (
        <WalkButton
          engineId={engineId}
          playerId={playerId}
          targetId={null}
          destination={targetPosition}
          className="w-full bg-green-600 text-white hover:bg-green-700"
          onSuccess={onSuccess}
          onError={onError}
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">🚶</span>
            Walk to Target
          </span>
        </WalkButton>
      )}
    </div>
  );
}