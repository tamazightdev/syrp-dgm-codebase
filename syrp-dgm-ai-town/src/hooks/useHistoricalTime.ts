import { useState, useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface UseHistoricalTimeOptions {
  updateInterval?: number; // milliseconds
  enabled?: boolean;
}

export function useHistoricalTime(
  engineId: Id<'engines'> | null,
  options: UseHistoricalTimeOptions = {}
) {
  const { updateInterval = 1000, enabled = true } = options;
  
  const [historicalTime, setHistoricalTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastServerTimeRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number | null>(null);

  // Query engine status to get current time and running state
  const engineStatus = useQuery(
    api.aiTown.main.status,
    engineId && enabled ? { engineId } : 'skip'
  );

  // Update historical time based on engine status
  useEffect(() => {
    if (!engineStatus) return;

    const serverTime = engineStatus.currentTime;
    const running = engineStatus.running;
    
    setIsRunning(running);

    if (serverTime !== undefined) {
      const now = Date.now();
      lastServerTimeRef.current = serverTime;
      lastUpdateTimeRef.current = now;
      setHistoricalTime(serverTime);
    }
  }, [engineStatus]);

  // Start/stop time interpolation based on running state
  useEffect(() => {
    if (!enabled) return;

    if (isRunning && lastServerTimeRef.current !== null && lastUpdateTimeRef.current !== null) {
      // Start interpolating time
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceUpdate = now - lastUpdateTimeRef.current!;
        const interpolatedTime = lastServerTimeRef.current! + timeSinceUpdate;
        setHistoricalTime(interpolatedTime);
      }, updateInterval);
    } else {
      // Stop interpolating time
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, enabled, updateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Helper functions for time formatting
  const formatTime = (time: number | null): string => {
    if (time === null) return 'N/A';
    return new Date(time).toLocaleTimeString();
  };

  const formatDate = (time: number | null): string => {
    if (time === null) return 'N/A';
    return new Date(time).toLocaleDateString();
  };

  const formatDateTime = (time: number | null): string => {
    if (time === null) return 'N/A';
    return new Date(time).toLocaleString();
  };

  const getTimeOfDay = (time: number | null): 'morning' | 'afternoon' | 'evening' | 'night' | null => {
    if (time === null) return null;
    
    const hour = new Date(time).getHours();
    
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  const getRelativeTime = (time: number | null): string => {
    if (time === null || historicalTime === null) return 'N/A';
    
    const diff = historicalTime - time;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
    return 'just now';
  };

  const isInPast = (time: number | null): boolean => {
    if (time === null || historicalTime === null) return false;
    return time < historicalTime;
  };

  const isInFuture = (time: number | null): boolean => {
    if (time === null || historicalTime === null) return false;
    return time > historicalTime;
  };

  const timeDifference = (time1: number | null, time2: number | null): number | null => {
    if (time1 === null || time2 === null) return null;
    return Math.abs(time1 - time2);
  };

  return {
    historicalTime,
    isRunning,
    serverTime: lastServerTimeRef.current,
    lastUpdate: lastUpdateTimeRef.current,
    
    // Formatting helpers
    formatTime,
    formatDate,
    formatDateTime,
    getTimeOfDay,
    getRelativeTime,
    
    // Comparison helpers
    isInPast,
    isInFuture,
    timeDifference,
  };
}

// Hook for time-based effects
export function useTimeEffect(
  callback: (time: number) => void,
  dependencies: any[],
  engineId: Id<'engines'> | null,
  options: UseHistoricalTimeOptions = {}
) {
  const { historicalTime } = useHistoricalTime(engineId, options);

  useEffect(() => {
    if (historicalTime !== null) {
      callback(historicalTime);
    }
  }, [historicalTime, ...dependencies]);
}

// Hook for periodic time-based actions
export function useTimeInterval(
  callback: (time: number) => void,
  interval: number, // milliseconds
  engineId: Id<'engines'> | null,
  enabled: boolean = true
) {
  const { historicalTime, isRunning } = useHistoricalTime(engineId, { enabled });
  const lastCallTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isRunning || historicalTime === null) return;

    if (lastCallTimeRef.current === null) {
      lastCallTimeRef.current = historicalTime;
      return;
    }

    const timeSinceLastCall = historicalTime - lastCallTimeRef.current;
    
    if (timeSinceLastCall >= interval) {
      callback(historicalTime);
      lastCallTimeRef.current = historicalTime;
    }
  }, [historicalTime, isRunning, enabled, interval, callback]);

  // Reset when engine stops
  useEffect(() => {
    if (!isRunning) {
      lastCallTimeRef.current = null;
    }
  }, [isRunning]);
}