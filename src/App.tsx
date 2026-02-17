import { useState, useCallback, useEffect, useRef } from 'react';
import { MainMenu, GameScreen } from '@/components/game';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { initializeBoard } from '@/hooks/useGame';
import type { GameMode, GameState, GamePhase, Side } from '@/types/game';
import './App.css';

// 创建初始游戏状态
const createInitialGameState = (): GameState => ({
  board: initializeBoard(),
  currentTurn: Math.random() > 0.5 ? 'dragon' : 'tiger',
  selectedCell: null,
  phase: 'menu',
  winner: null,
  dragonPiecesCount: 8,
  tigerPiecesCount: 8,
  message: '欢迎来到龙虎斗！大克小，同级同归于尽！',
  roomId: null,
  playerRole: 'spectator',
  gameMode: 'local',
  players: { dragon: null, tiger: null },
});

// 验证游戏状态是否有效
const isValidGameState = (state: any): state is GameState => {
  if (!state || typeof state !== 'object') return false;
  if (!Array.isArray(state.board) || state.board.length !== 4) return false;
  if (!['dragon', 'tiger'].includes(state.currentTurn)) return false;
  if (!['menu', 'waiting', 'playing', 'ended'].includes(state.phase)) return false;
  if (typeof state.dragonPiecesCount !== 'number') return false;
  if (typeof state.tigerPiecesCount !== 'number') return false;
  
  // 验证棋盘每个格子
  for (let row = 0; row < 4; row++) {
    if (!Array.isArray(state.board[row]) || state.board[row].length !== 4) {
      return false;
    }
  }
  
  return true;
};

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [showGame, setShowGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // 游戏状态（本地或在线共享）
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  
  const {
    roomId,
    playerRole: mpPlayerRole,
    opponentConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastGameState,
    syncGameState,
  } = useMultiplayer();

  // 游戏是否已开始（防止重复初始化）
  const gameStartedRef = useRef(false);

  // ========== 自动开始游戏 ==========
  useEffect(() => {
    // 在线模式，双方都连接，游戏还没开始
    if (gameMode === 'online' && opponentConnected && !showGame && !gameStartedRef.current) {
      gameStartedRef.current = true;
      
      // 初始化游戏状态
      const initialState = createInitialGameState();
      initialState.phase = 'playing';
      initialState.roomId = roomId;
      initialState.gameMode = 'online';
      initialState.playerRole = mpPlayerRole || 'spectator';
      
      setGameState(initialState);
      setShowGame(true);
      
      // 广播初始状态（房主广播）
      if (mpPlayerRole === 'dragon') {
        setTimeout(() => {
          broadcastGameState(initialState);
        }, 500);
      }
    }
  }, [gameMode, opponentConnected, showGame, roomId, mpPlayerRole, broadcastGameState]);

  // ========== 在线模式状态同步 ==========
  
  // 定期从服务器同步状态（在线模式）
  useEffect(() => {
    if (gameMode !== 'online' || !roomId || !showGame) return;
    
    const interval = setInterval(async () => {
      try {
        const serverState = await syncGameState();
        
        // 验证服务器状态是否有效
        if (!serverState || !isValidGameState(serverState)) {
          console.warn('Invalid server state received');
          return;
        }
        
        // 只有当服务器状态与本地不同时才更新
        const localJson = JSON.stringify(gameState.board);
        const serverJson = JSON.stringify(serverState.board);
        
        if (localJson !== serverJson || gameState.currentTurn !== serverState.currentTurn) {
          console.log('Auto sync from server');
          setGameState(serverState);
        }
      } catch (e) {
        console.error('Sync error:', e);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [gameMode, roomId, showGame, syncGameState, gameState.board, gameState.currentTurn]);

  // ========== 手动刷新同步 ==========
  const handleRefresh = useCallback(async () => {
    if (gameMode !== 'online' || !roomId) return;
    
    setIsRefreshing(true);
    console.log('Manual refresh...');
    
    try {
      const serverState = await syncGameState();
      
      if (serverState && isValidGameState(serverState)) {
        setGameState(serverState);
        console.log('Refreshed from server');
      } else {
        console.warn('Invalid state from server');
      }
    } catch (e) {
      console.error('Refresh error:', e);
    }
    
    setIsRefreshing(false);
  }, [gameMode, roomId, syncGameState]);

  // ========== 游戏操作 ==========

  // 开始本地游戏
  const handleStartLocalGame = useCallback(() => {
    setGameMode('local');
    gameStartedRef.current = false;
    setGameState(createInitialGameState());
    setShowGame(true);
    setErrorMessage(null);
  }, []);

  // 创建房间
  const handleCreateRoom = useCallback(async (role: 'dragon' | 'tiger') => {
    setErrorMessage(null);
    gameStartedRef.current = false;
    const newRoomId = await createRoom(role);
    if (newRoomId) {
      setGameMode('online');
      setGameState(prev => ({ ...prev, playerRole: role }));
      return newRoomId;
    }
    setErrorMessage('创建房间失败');
    return '';
  }, [createRoom]);

  // 加入房间
  const handleJoinRoom = useCallback(async (joinRoomId: string) => {
    setErrorMessage(null);
    gameStartedRef.current = false;
    const success = await joinRoom(joinRoomId);
    if (success) {
      setGameMode('online');
      return true;
    } else {
      setErrorMessage('房间不存在或已满');
      return false;
    }
  }, [joinRoom]);

  // 离开房间
  const handleLeaveRoom = useCallback(async () => {
    gameStartedRef.current = false;
    await leaveRoom();
    setGameMode('local');
    setGameState(createInitialGameState());
    setShowGame(false);
    setErrorMessage(null);
  }, [leaveRoom]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    gameStartedRef.current = false;
    setShowGame(false);
    setGameState(prev => ({ ...prev, phase: 'menu' }));
    setErrorMessage(null);
  }, []);

  // 重新开始
  const handleRestart = useCallback(() => {
    gameStartedRef.current = false;
    const newState = createInitialGameState();
    newState.phase = 'playing';
    newState.roomId = roomId;
    newState.gameMode = gameMode;
    newState.playerRole = mpPlayerRole || 'spectator';
    
    setGameState(newState);
    gameStartedRef.current = true;
    
    // 在线模式广播新状态
    if (gameMode === 'online') {
      broadcastGameState(newState);
    }
  }, [gameMode, roomId, mpPlayerRole, broadcastGameState]);

  // ========== 格子点击处理 ==========
  
  const handleCellClick = useCallback((row: number, col: number) => {
    // 检查是否是当前玩家的回合（在线模式）
    if (gameMode === 'online' && mpPlayerRole) {
      if (mpPlayerRole !== gameState.currentTurn) {
        console.log('Not your turn:', mpPlayerRole, 'vs', gameState.currentTurn);
        return;
      }
    }
    
    // 如果游戏已结束，不处理
    if (gameState.phase !== 'playing') return;
    
    const cell = gameState.board[row][col];
    let newState: GameState | null = null;
    
    // 如果点击的是暗棋，翻开它
    if (cell.piece && !cell.piece.isRevealed) {
      const newBoard = gameState.board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].piece = { ...cell.piece, isRevealed: true };
      
      const nextTurn = gameState.currentTurn === 'dragon' ? 'tiger' : 'dragon';
      const pieceName = cell.piece.name;
      const sideName = cell.piece.side === 'dragon' ? '龙方' : '虎方';
      
      newState = {
        ...gameState,
        board: newBoard,
        currentTurn: nextTurn,
        selectedCell: null,
        message: `${sideName}翻开了${pieceName}！轮到${nextTurn === 'dragon' ? '龙方' : '虎方'}`,
      };
    } else if (gameState.selectedCell) {
      // 尝试移动
      const fromRow = gameState.selectedCell.row;
      const fromCol = gameState.selectedCell.col;
      const fromCell = gameState.board[fromRow][fromCol];
      
      // 检查是否点击同一格子（取消选择）
      if (fromRow === row && fromCol === col) {
        newState = {
          ...gameState,
          selectedCell: null,
          message: '取消选择',
        };
      } else {
        // 检查移动有效性
        const rowDiff = Math.abs(row - fromRow);
        const colDiff = Math.abs(col - fromCol);
        
        if (rowDiff + colDiff === 1 && fromCell.piece) {
          const targetPiece = cell.piece;
          
          if (!targetPiece) {
            // 移动到空格子
            const newBoard = gameState.board.map(r => r.map(c => ({ ...c })));
            newBoard[row][col].piece = { ...fromCell.piece };
            newBoard[fromRow][fromCol].piece = null;
            
            const nextTurn = gameState.currentTurn === 'dragon' ? 'tiger' : 'dragon';
            
            newState = {
              ...gameState,
              board: newBoard,
              currentTurn: nextTurn,
              selectedCell: null,
              message: `${fromCell.piece.name}移动了`,
            };
          } else if (targetPiece.isRevealed && targetPiece.side !== fromCell.piece.side) {
            // 尝试吃子
            const attacker = fromCell.piece;
            const defender = targetPiece;
            
            // 检查对战结果
            let canAttack = false;
            let isMutual = false;
            
            if ((attacker.type === 'dragon_king' || attacker.type === 'tiger_king') &&
                (defender.type === 'dragon_king' || defender.type === 'tiger_king')) {
              canAttack = true;
              isMutual = true;
            } else if (attacker.type === 'dragon_king' || attacker.type === 'tiger_king') {
              canAttack = true;
            } else if (defender.type === 'dragon_king' || defender.type === 'tiger_king') {
              canAttack = false;
            } else if (attacker.level === defender.level) {
              canAttack = true;
              isMutual = true;
            } else if (attacker.level > defender.level) {
              canAttack = true;
            }
            
            if (canAttack) {
              const newBoard = gameState.board.map(r => r.map(c => ({ ...c })));
              let dragonCount = gameState.dragonPiecesCount;
              let tigerCount = gameState.tigerPiecesCount;
              let message = '';
              
              if (isMutual) {
                if (defender.side === 'dragon') dragonCount--;
                else tigerCount--;
                if (attacker.side === 'dragon') dragonCount--;
                else tigerCount--;
                
                newBoard[row][col].piece = null;
                message = `${attacker.name}与${defender.name}同归于尽！`;
              } else {
                if (defender.side === 'dragon') dragonCount--;
                else tigerCount--;
                
                newBoard[row][col].piece = { ...attacker };
                message = `${attacker.name}吃掉了${defender.name}！`;
              }
              
              newBoard[fromRow][fromCol].piece = null;
              
              const nextTurn = gameState.currentTurn === 'dragon' ? 'tiger' : 'dragon';
              
              let winner: Side | null = null;
              let phase: GamePhase = 'playing';
              
              if (dragonCount === 0 && tigerCount === 0) {
                winner = null;
                phase = 'ended';
                message = '平局！双方棋子同时耗尽！';
              } else if (dragonCount === 0) {
                winner = 'tiger';
                phase = 'ended';
                message = '虎方获胜！吃掉了龙方所有棋子！';
              } else if (tigerCount === 0) {
                winner = 'dragon';
                phase = 'ended';
                message = '龙方获胜！吃掉了虎方所有棋子！';
              }
              
              newState = {
                ...gameState,
                board: newBoard,
                currentTurn: nextTurn,
                selectedCell: null,
                dragonPiecesCount: dragonCount,
                tigerPiecesCount: tigerCount,
                message,
                winner,
                phase,
              };
            } else {
              newState = {
                ...gameState,
                message: '无法吃掉对方！',
              };
            }
          } else if (targetPiece.isRevealed && targetPiece.side === fromCell.piece.side) {
            newState = {
              ...gameState,
              selectedCell: { row, col },
              message: `切换选中了${targetPiece.name}`,
            };
          }
        } else {
          newState = {
            ...gameState,
            message: '无效的移动！',
          };
        }
      }
    } else {
      // 选择棋子
      if (cell.piece && cell.piece.isRevealed && cell.piece.side === gameState.currentTurn) {
        newState = {
          ...gameState,
          selectedCell: { row, col },
          message: `选中了${cell.piece.name}，请选择移动目标`,
        };
      }
    }
    
    // 应用新状态
    if (newState) {
      setGameState(newState);
      
      // 在线模式广播新状态
      if (gameMode === 'online') {
        console.log('Broadcasting state');
        broadcastGameState(newState);
      }
    }
  }, [gameMode, mpPlayerRole, gameState, broadcastGameState]);

  // ========== 渲染 ==========

  // 显示游戏界面
  if (showGame) {
    return (
      <div className="font-sans">
        <GameScreen
          board={gameState.board}
          currentTurn={gameState.currentTurn}
          selectedCell={gameState.selectedCell}
          dragonPiecesCount={gameState.dragonPiecesCount}
          tigerPiecesCount={gameState.tigerPiecesCount}
          message={gameState.message}
          phase={gameState.phase}
          winner={gameState.winner}
          playerRole={gameMode === 'online' ? mpPlayerRole || undefined : undefined}
          onCellClick={handleCellClick}
          onRestart={handleRestart}
          onBackToMenu={handleBackToMenu}
          onRefresh={gameMode === 'online' ? handleRefresh : undefined}
          isRefreshing={isRefreshing}
        />
      </div>
    );
  }

  // 显示主菜单
  return (
    <div className="font-sans">
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {errorMessage}
        </div>
      )}
      <MainMenu
        onStartLocalGame={handleStartLocalGame}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={handleLeaveRoom}
        roomId={roomId}
        playerRole={mpPlayerRole}
        opponentConnected={opponentConnected}
        isWaitingForOpponent={gameMode === 'online' && !opponentConnected}
      />
    </div>
  );
}

export default App;
