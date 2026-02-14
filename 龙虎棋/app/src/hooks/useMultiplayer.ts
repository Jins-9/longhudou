import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState } from '@/types/game';

// 服务器地址 - 使用相对路径（同域名）
const SERVER_URL = '';

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
}

export const useMultiplayer = () => {
  const [mpState, setMpState] = useState<MultiplayerState>({
    roomId: null,
    playerRole: 'spectator',
    isConnected: false,
    opponentConnected: false,
    gameStarted: false,
  });
  
  const playerId = useRef<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const checkInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // 初始化 playerId
  useEffect(() => {
    playerId.current = getPlayerId();
  }, []);

  // API请求封装
  const apiRequest = useCallback(async (endpoint: string, method: string = 'GET', body?: any) => {
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

  // 创建房间
  const createRoom = useCallback(async (role: 'dragon' | 'tiger'): Promise<string> => {
    try {
      const result = await apiRequest('/api/create-room', 'POST', {
        playerId: playerId.current,
        role,
      });
      
      if (result.success) {
        setMpState({
          roomId: result.roomId,
          playerRole: result.playerRole,
          isConnected: true,
          opponentConnected: false,
          gameStarted: false,
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
  }, [apiRequest]);

  // 加入房间
  const joinRoom = useCallback(async (roomId: string): Promise<boolean> => {
    try {
      const result = await apiRequest('/api/join-room', 'POST', {
        roomId,
        playerId: playerId.current,
      });
      
      if (result.success) {
        setMpState({
          roomId: result.roomId,
          playerRole: result.playerRole,
          isConnected: true,
          opponentConnected: result.opponentConnected,
          gameStarted: false,
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
  }, [apiRequest]);

  // 检查对手状态
  const checkOpponent = useCallback(async (roomId: string) => {
    try {
      const result = await apiRequest(`/api/room-status?roomId=${roomId}&playerId=${playerId.current}`);
      
      if (result.success) {
        setMpState(prev => ({
          ...prev,
          opponentConnected: result.opponentConnected,
          gameStarted: result.gameState?.phase === 'playing',
        }));
      }
    } catch (e) {
      console.error('Check opponent error:', e);
    }
  }, [apiRequest]);

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
    
    // 使用相对路径
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}?room=${roomId}&playerId=${playerId.current}`;
    
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
            // 游戏状态更新
          }
        } catch (e) {
          console.error('WebSocket message error:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current = ws;
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }
  }, []);

  // 断开WebSocket
  const disconnectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 离开房间
  const leaveRoom = useCallback(async () => {
    if (mpState.roomId) {
      try {
        await apiRequest('/api/leave-room', 'POST', {
          roomId: mpState.roomId,
          playerId: playerId.current,
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
    });
  }, [mpState.roomId, apiRequest, stopChecking, disconnectWebSocket]);

  // 开始游戏
  const startGame = useCallback(async () => {
    if (!mpState.roomId) return;
    
    setMpState(prev => ({ ...prev, gameStarted: true }));
  }, [mpState.roomId]);

  // 广播游戏状态
  const broadcastGameState = useCallback(async (gameState: GameState) => {
    if (!mpState.roomId) return;
    
    // 通过HTTP API更新游戏状态
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

  // 同步游戏状态
  const syncGameState = useCallback(async (): Promise<GameState | null> => {
    if (!mpState.roomId) return null;
    
    try {
      const result = await apiRequest(`/api/room-status?roomId=${mpState.roomId}&playerId=${playerId.current}`);
      
      if (result.success && result.gameState) {
        return result.gameState;
      }
    } catch (e) {
      console.error('Sync error:', e);
    }
    
    return null;
  }, [mpState.roomId, apiRequest]);

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
    playerId: playerId.current,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    broadcastGameState,
    syncGameState,
    checkOpponent: () => mpState.roomId && checkOpponent(mpState.roomId),
  };
};
