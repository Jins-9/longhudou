import React, { memo } from 'react';
import { GameBoard } from './GameBoard';
import { GameStatus } from './GameStatus';
import { GameControls } from './GameControls';
import { GameOver } from './GameOver';
import type { Side } from '@/types/game';
import { SIDE_NAMES } from '@/types/game';

interface GameScreenProps {
  board: any[][];
  currentTurn: Side;
  selectedCell: { row: number; col: number } | null;
  dragonPiecesCount: number;
  tigerPiecesCount: number;
  message: string;
  phase: 'menu' | 'waiting' | 'playing' | 'ended';
  winner: Side | null;
  playerRole?: string;
  onCellClick: (row: number, col: number) => void;
  onRestart: () => void;
  onBackToMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshSuccess?: boolean | null;
}

const GameScreenInner: React.FC<GameScreenProps> = ({
  board,
  currentTurn,
  selectedCell,
  dragonPiecesCount,
  tigerPiecesCount,
  message,
  phase,
  winner,
  playerRole,
  onCellClick,
  onRestart,
  onBackToMenu,
  onRefresh,
  isRefreshing,
  refreshSuccess,
}) => {
  // 检查是否是当前玩家的回合
  const isMyTurn = playerRole ? playerRole === currentTurn : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-5 text-4xl opacity-5">🐲</div>
        <div className="absolute top-20 right-10 text-3xl opacity-5">🐅</div>
        <div className="absolute bottom-32 left-10 text-3xl opacity-5">🐉</div>
        <div className="absolute bottom-20 right-5 text-4xl opacity-5">🐯</div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 标题栏 */}
        <div className="text-center mb-4 pt-4">
          <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">
            龙虎斗
          </h1>
          {playerRole && (
            <p className="text-sm text-slate-600 mt-1">
              你是{SIDE_NAMES[playerRole as Side]}
              {!isMyTurn && phase === 'playing' && ' - 等待对手...'}
            </p>
          )}
        </div>

        {/* 游戏状态 */}
        <div className="mb-4">
          <GameStatus
            currentTurn={currentTurn}
            dragonPiecesCount={dragonPiecesCount}
            tigerPiecesCount={tigerPiecesCount}
            message={message}
            phase={phase}
            winner={winner}
            playerRole={playerRole}
          />
        </div>

        {/* 棋盘 */}
        <div className="flex justify-center mb-4">
          <div className={!isMyTurn && phase === 'playing' ? 'opacity-70 pointer-events-none' : ''}>
            <GameBoard
              board={board}
              selectedCell={selectedCell}
              currentTurn={currentTurn}
              onCellClick={onCellClick}
              playerRole={playerRole}
            />
          </div>
        </div>

        {/* 等待提示 */}
        {!isMyTurn && phase === 'playing' && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center bg-slate-100 rounded-full px-4 py-2">
              <span className="animate-pulse text-slate-600">
                等待{SIDE_NAMES[currentTurn]}行动...
              </span>
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <GameControls
          onRestart={onRestart}
          onBackToMenu={onBackToMenu}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          refreshSuccess={refreshSuccess}
        />

        {/* 刷新成功提示 */}
        {refreshSuccess === true && (
          <div className="text-center mb-2">
            <div className="inline-flex items-center bg-green-100 text-green-700 rounded-full px-4 py-2 shadow-sm animate-fade-in">
              <span className="text-sm font-medium">✓ 刷新成功</span>
            </div>
          </div>
        )}

        {/* 操作提示 */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center bg-white/80 rounded-full px-4 py-2 shadow-sm">
            <span className="text-slate-700 text-sm">
              <span className="font-bold">操作提示：</span>
              点击暗棋翻开 · 点击己方棋子选中 · 点击相邻格子移动或吃子
            </span>
          </div>
        </div>
      </div>

      {/* 游戏结束弹窗 */}
      <GameOver
        isOpen={phase === 'ended'}
        winner={winner}
        onRestart={onRestart}
        onBackToMenu={onBackToMenu}
      />
    </div>
  );
};

export const GameScreen = memo(GameScreenInner);
