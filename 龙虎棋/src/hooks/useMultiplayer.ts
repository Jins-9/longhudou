import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { GameState } from '@/types/game';

// 服务器地址 - 使用生产环境域名
const SERVER_URL = 'https://longhudou-production.up.railway.app';

// 生成玩家ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// 获取或创建玩家ID
const getPlayerId = () => {
  if (typeof localStorage === 'undefined') return generateId();
  let playerId = localStorage.getItem('dragon-tiger-player-id');
  if (!playerId) {
    playerId = generateId();
    localStorage.setItem('dragon-tiger-player-id', playerId);
  }
  return playerId;
};

interface MultiplayerState {
  roomId: string | null;
  playerRole: 'dragon' | 'tiger' | 'spectator';
  isConnected: boolean;
  opponentConnected: boolean;
  gameStarted: boolean;
  gameState: GameState | null; // 新增：存储游戏状态
}

export const useMultiplayer = () => {
  const playerId = useMemo(() => getPlayerId(), []);
  
  const [mpState, setMpState] = useState<MultiplayerState>({
    roomId: null,
    playerRole: 'spectator',
    isConnected: false,
    opponentConnected: false,
    gameStarted: false,
    gameState: null, // 初始化
  });
  
  const wsRef = useRef<WebSocket | null>(null);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // API请求封装
  const apiRequest = useCallback(async (endpoint: string, method: string = 'GET', body?: Record<string, unknown>) => {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${SERVER_URL}${endpoint}`, options);
    return response.json();
  }, []);

  // 检查对手状态
  const checkOpponent = useCallback(async (roomId: string) => {
    try {
      const result = await apiRequest(`/api/room-status?roomId=${roomId}&playerId=${playerId}`);
      
      if (result.success) {
        setMpState(prev => ({
          ...prev,
          opponentConnected: result.opponentConnected,
          gameStarted: result.gameState?.phase === 'playing',
          gameState: result.gameState || prev.gameState, // 更新游戏状态（如果有）
        }));
      }
    } catch (e) {
      console.error('Check opponent error:', e);
    }
  }, [apiRequest, playerId]);

  // 开始定时检查对手
  const startCheckingOpponent = useCallback((roomId: string) => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
    }
    
    checkInterval.current = setInterval(() => {
      checkOpponent(roomId);
    }, 2000);
  }, [checkOpponent]);

  // 停止检查
  const stopChecking = useCallback(() => {
    if (checkInterval.current) {
      clearInterval(checkInterval.current);
      checkInterval.current = null;
    }
  }, []);

  // 连接WebSocket
  const connectWebSocket = useCallback((roomId: string) => {
    if (wsRef.current) {
      wsRef.current.close();      
    }
    // 使用生产环境 WebSocket 地址
    const wsUrl = `wss://longhudou-production.up.railway.app?room=${roomId}&playerId=${playerId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'opponent-connected') {
            setMpState(prev => ({ ...prev, opponentConnected: true }));
          } else if (data.type === 'opponent-disconnected') {
            setMpState(prev => ({ ...prev, opponentConnected: false }));
          } else if (data.type === 'game-update') {
            // 关键修复：收到游戏更新时，更新本地游戏状态
            setMpState(prev => ({
              ...prev,
              gameState: data.gameState,
              gameStarted: data.gameState?.phase === 'playing', // 同步 gameStarted 状态
            }));
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // 可选：标记连接断开
        setMpState(prev => ({ ...prev, opponentConnected: false }));
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }, [playerId]);

  // 断开WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 创建房间
  const createRoom = useCallback(async (role: 'dragon' | 'tiger'): Promise<string> => {
    try {
      const result = await apiRequest('/api/create-room', 'POST', {
        playerId,
        role,
      });
      
      if (result.success) {
        setMpState({
          roomId: result.roomId,
          playerRole: result.playerRole,
          isConnected: true,
          opponentConnected: false,
          gameStarted: false,
          gameState: null,
        });
        
        // 开始检查对手
        startCheckingOpponent(result.roomId);
        
        // 连接WebSocket
        connectWebSocket(result.roomId);
        
        return result.roomId;
      }
      return '';
    } catch (e) {
      console.error('Create room error:', e);
      return '';
    }
  }, [apiRequest, startCheckingOpponent, connectWebSocket, playerId]);

  // 加入房间
  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    try {
      const result = await apiRequest('/api/join-room', 'POST', {
        roomId,
        playerId,
      });
      
      if (result.success) {
        setMpState({
          roomId: result.roomId,
          playerRole: result.playerRole,
          isConnected: true,
          opponentConnected: result.opponentConnected,
          gameStarted: false,
          gameState: null,
        });
        
        // 开始检查对手
        startCheckingOpponent(result.roomId);
        
        // 连接WebSocket
        connectWebSocket(result.roomId);
        
        return true;
      }
      return false;
    } catch (e) {
      console.error('Join room error:', e);
      return false;
    }
  }, [apiRequest, startCheckingOpponent, connectWebSocket, playerId]);

  // 离开房间
  const leaveRoom = useCallback(async () => {
    if (mpState.roomId) {
      try {
        await apiRequest('/api/leave-room', 'POST', {
          roomId: mpState.roomId,
          playerId,
        });
      } catch (e) {
        console.error('Leave room error:', e);
      }
    }
    
    stopChecking();
    disconnectWebSocket();
    
    setMpState({
      roomId: null,
      playerRole: 'spectator',
      isConnected: false,
      opponentConnected: false,
      gameStarted: false,
      gameState: null,
    });
  }, [mpState.roomId, apiRequest, stopChecking, disconnectWebSocket, playerId]);

  // 广播游戏状态
  const broadcastGameState = useCallback(async (gameState: GameState) => {
    if (!mpState.roomId) return;
    
    // 通过HTTP API更新游戏状态（持久化）
    try {
      await apiRequest('/api/update-game', 'POST', {
        roomId: mpState.roomId,
        gameState,
      });
    } catch (e) {
      console.error('Broadcast error:', e);
    }
    
    // 通过WebSocket通知对方
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'game-update',
        gameState,
      }));
    }
  }, [mpState.roomId, apiRequest]);

  // 开始游戏（通过广播游戏状态来同步）
  const startGame = useCallback(async () => {
    if (!mpState.roomId || !mpState.gameState) return;
    
    // 修改游戏状态，标记为 playing
    const updatedGameState: GameState = {
      ...mpState.gameState,
      phase: 'playing',
    };
    
    // 广播更新（包括 HTTP 持久化和 WebSocket 实时通知）
    await broadcastGameState(updatedGameState);
    
    // 本地立即更新
    setMpState(prev => ({
      ...prev,
      gameStarted: true,
      gameState: updatedGameState,
    }));
  }, [mpState.roomId, mpState.gameState, broadcastGameState]);

  // 同步游戏状态（从服务器拉取最新状态）
  const syncGameState = useCallback(async (): Promise<GameState | null> => {
    if (!mpState.roomId) return null;
    
    try {
      const result = await apiRequest(`/api/room-status?roomId=${mpState.roomId}&playerId=${playerId}`);
      
      if (result.success && result.gameState) {
        // 更新本地状态
        setMpState(prev => ({
          ...prev,
          gameState: result.gameState,
          gameStarted: result.gameState.phase === 'playing',
        }));
        return result.gameState;
      }
    } catch (e) {
      console.error('Sync error:', e);
    }
    
    return null;
  }, [mpState.roomId, apiRequest, playerId]);

  // 清理
  useEffect(() => {
    return () => {
      stopChecking();
      disconnectWebSocket();
    };
  }, [stopChecking, disconnectWebSocket]);

  return {
    roomId: mpState.roomId,
    playerRole: mpState.playerRole,
    isConnected: mpState.isConnected,
    opponentConnected: mpState.opponentConnected,
    gameStarted: mpState.gameStarted,
    gameState: mpState.gameState, // 新增：暴露游戏状态
    playerId,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    broadcastGameState,
    syncGameState,
    checkOpponent: () => mpState.roomId && checkOpponent(mpState.roomId),
  };
};