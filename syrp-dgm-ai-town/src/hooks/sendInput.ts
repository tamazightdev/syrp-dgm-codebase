import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export interface SendInputOptions {
  engineId: Id<'engines'>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useSendInput({ engineId, onSuccess, onError }: SendInputOptions) {
  const sendInputMutation = useMutation(api.aiTown.inputs.sendInput);

  const sendInput = useCallback(async (name: string, args: any) => {
    try {
      const result = await sendInputMutation({
        engineId,
        name,
        args,
      });
      
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown error');
      onError?.(errorObj);
      throw errorObj;
    }
  }, [sendInputMutation, engineId, onSuccess, onError]);

  // Convenience methods for common inputs
  const join = useCallback((name: string, character: string, description: string) => {
    return sendInput('join', { name, character, description });
  }, [sendInput]);

  const leave = useCallback((playerId: string) => {
    return sendInput('leave', { playerId });
  }, [sendInput]);

  const sendMessage = useCallback((playerId: string, text: string, messageUuid: string) => {
    return sendInput('sendMessage', { playerId, text, messageUuid });
  }, [sendInput]);

  const startConversation = useCallback((playerId: string, invitee: string) => {
    return sendInput('startConversation', { playerId, invitee });
  }, [sendInput]);

  const acceptInvite = useCallback((playerId: string, conversationId: string) => {
    return sendInput('acceptInvite', { playerId, conversationId });
  }, [sendInput]);

  const rejectInvite = useCallback((playerId: string, conversationId: string) => {
    return sendInput('rejectInvite', { playerId, conversationId });
  }, [sendInput]);

  const leaveConversation = useCallback((playerId: string, conversationId: string) => {
    return sendInput('leaveConversation', { playerId, conversationId });
  }, [sendInput]);

  const finishSpeaking = useCallback((playerId: string, conversationId: string) => {
    return sendInput('finishSpeaking', { playerId, conversationId });
  }, [sendInput]);

  const walkTo = useCallback((playerId: string, destination: { x: number; y: number }) => {
    return sendInput('walkTo', { playerId, destination });
  }, [sendInput]);

  const agentSendMessage = useCallback((
    agentId: string, 
    text: string, 
    messageUuid: string, 
    leaveConversation?: boolean
  ) => {
    return sendInput('agentSendMessage', { agentId, text, messageUuid, leaveConversation });
  }, [sendInput]);

  const agentWakeUp = useCallback((agentId: string) => {
    return sendInput('agentWakeUp', { agentId });
  }, [sendInput]);

  const stop = useCallback(() => {
    return sendInput('stop', {});
  }, [sendInput]);

  const start = useCallback(() => {
    return sendInput('start', {});
  }, [sendInput]);

  const restart = useCallback(() => {
    return sendInput('restart', {});
  }, [sendInput]);

  return {
    sendInput,
    join,
    leave,
    sendMessage,
    startConversation,
    acceptInvite,
    rejectInvite,
    leaveConversation,
    finishSpeaking,
    walkTo,
    agentSendMessage,
    agentWakeUp,
    stop,
    start,
    restart,
  };
}

// Hook for checking input status
export function useInputStatus() {
  const getInputStatusMutation = useMutation(api.aiTown.inputs.getInputStatus);

  const checkStatus = useCallback(async (inputId: Id<'inputs'>) => {
    return await getInputStatusMutation({ inputId });
  }, [getInputStatusMutation]);

  return { checkStatus };
}