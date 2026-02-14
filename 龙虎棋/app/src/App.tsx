import { useState, useCallback, useEffect } from 'react';
import { MainMenu, GameScreen } from '@/components/game';
import { useGame } from '@/hooks/useGame';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import type { GameMode } from '@/types/game';
import './App.css';

function App() {
  const [gameMode, setGameMode] = useState<GameMode>('local');
  const [showGame, setShowGame] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const {
    roomId,
    playerRole: mpPlayerRole,
    opponentConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame: startMpGame,
    broadcastGameState,
    syncGameState,
  } = useMultiplayer();

  const {
    gameState,
    startGame,
    resetGame,
    backToMenu,
    setPlayerRole,
    handleCellClick,
  } = useGame(gameMode, roomId);

  // 同步在线游戏状态
  useEffect(() => {
    if (gameMode === 'online' && roomId && showGame) {
      const interval = setInterval(async () => {
        const syncedState = await syncGameState();
        if (syncedState && syncedState.currentTurn !== gameState.currentTurn) {
          window.location.reload();
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameMode, roomId, showGame, syncGameState, gameState.currentTurn]);

  // 开始本地游戏
  const handleStartLocalGame = useCallback(() => {
    setGameMode('local');
    setShowGame(true);
    setErrorMessage(null);
    startGame();
  }, [startGame]);

  // 创建房间
  const handleCreateRoom = useCallback(async (role: 'dragon' | 'tiger') => {
    setErrorMessage(null);
    const newRoomId = await createRoom(role);
    if (newRoomId) {
      setGameMode('online');
      setPlayerRole(role);
      return newRoomId;
    }
    setErrorMessage('创建房间失败');
    return '';
  }, [createRoom, setPlayerRole]);

  // 加入房间
  const handleJoinRoom = useCallback(async (joinRoomId: string) => {
    setErrorMessage(null);
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
    await leaveRoom();
    setGameMode('local');
    setShowGame(false);
    setErrorMessage(null);
  }, [leaveRoom]);

  // 开始在线游戏
  const handleStartOnlineGame = useCallback(async () => {
    if (opponentConnected) {
      await startMpGame();
      setShowGame(true);
      startGame();
    }
  }, [opponentConnected, startMpGame, startGame]);

  // 返回主菜单
  const handleBackToMenu = useCallback(() => {
    setShowGame(false);
    backToMenu();
    setErrorMessage(null);
  }, [backToMenu]);

  // 处理格子点击
  const handleCellClickWithTurn = useCallback(async (row: number, col: number) => {
    if (gameMode === 'online' && mpPlayerRole) {
      if (mpPlayerRole !== gameState.currentTurn) {
        return;
      }
    }
    handleCellClick(row, col);
    
    if (gameMode === 'online') {
      setTimeout(async () => {
        await broadcastGameState(gameState);
      }, 100);
    }
  }, [gameMode, mpPlayerRole, gameState.currentTurn, handleCellClick, broadcastGameState, gameState]);

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
          onCellClick={handleCellClickWithTurn}
          onRestart={resetGame}
          onBackToMenu={handleBackToMenu}
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
        onStartOnlineGame={handleStartOnlineGame}
        roomId={roomId}
        playerRole={mpPlayerRole}
        opponentConnected={opponentConnected}
      />
    </div>
  );
}

export default App;
