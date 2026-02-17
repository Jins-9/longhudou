import React from 'react';
import type { Side } from '@/types/game';
import { SIDE_NAMES, SIDE_ICONS } from '@/types/game';
import { cn } from '@/lib/utils';
import { Trophy, Swords } from 'lucide-react';

interface GameStatusProps {
  currentTurn: Side;
  dragonPiecesCount: number;
  tigerPiecesCount: number;
  message: string;
  phase: 'menu' | 'waiting' | 'playing' | 'ended';
  winner: Side | null;
  playerRole?: string;
}

export const GameStatus: React.FC<GameStatusProps> = ({
  currentTurn,
  dragonPiecesCount,
  tigerPiecesCount,
  message,
  phase,
  winner,
  playerRole,
}) => {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* 游戏状态卡片 */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden">
        {/* 顶部：回合指示器 */}
        {phase === 'playing' && (
          <div
            className={cn(
              'py-2 px-4 text-center font-bold text-white transition-colors duration-300',
              currentTurn === 'dragon' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700' 
                : 'bg-gradient-to-r from-red-600 to-red-700'
            )}
          >
            <div className="flex items-center justify-center">
              <Swords className="w-5 h-5 mr-2" />
              <span>当前回合：{SIDE_NAMES[currentTurn]}</span>
              {playerRole && (
                <span className="ml-2 text-sm opacity-80">
                  ({playerRole === currentTurn ? '你的回合' : '等待对手'})
                </span>
              )}
            </div>
          </div>
        )}

        {/* 等待玩家 */}
        {phase === 'waiting' && (
          <div className="py-2 px-4 text-center font-bold text-white bg-gradient-to-r from-gray-500 to-gray-600">
            <div className="flex items-center justify-center">
              <span className="animate-pulse">等待对手加入...</span>
            </div>
          </div>
        )}

        {/* 胜利显示 */}
        {phase === 'ended' && winner && (
          <div
            className={cn(
              'py-3 px-4 text-center font-bold text-white',
              winner === 'dragon'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                : 'bg-gradient-to-r from-red-600 to-red-700'
            )}
          >
            <div className="flex items-center justify-center">
              <Trophy className="w-6 h-6 mr-2" />
              <span className="text-xl">
                {SIDE_ICONS[winner]} {SIDE_NAMES[winner]}获胜！
              </span>
            </div>
          </div>
        )}

        {/* 棋子数量统计 */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            {/* 龙方 - 蓝色 */}
            <div className="flex items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shadow-md text-2xl',
                  'bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-blue-800'
                )}
              >
                🐉
              </div>
              <div className="ml-3">
                <p className="font-bold text-blue-700">龙方</p>
                <p className="text-2xl font-bold text-gray-800">
                  {dragonPiecesCount}
                  <span className="text-sm text-gray-500 font-normal ml-1">子</span>
                </p>
              </div>
            </div>

            {/* VS */}
            <div className="text-slate-400 font-black text-xl">VS</div>

            {/* 虎方 - 红色 */}
            <div className="flex items-center flex-row-reverse">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center shadow-md text-2xl',
                  'bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-800'
                )}
              >
                🐯
              </div>
              <div className="mr-3 text-right">
                <p className="font-bold text-red-700">虎方</p>
                <p className="text-2xl font-bold text-gray-800">
                  {tigerPiecesCount}
                  <span className="text-sm text-gray-500 font-normal ml-1">子</span>
                </p>
              </div>
            </div>
          </div>

          {/* 消息提示 */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-center text-slate-700 font-medium text-sm">
              {message}
            </p>
          </div>
        </div>
      </div>

      {/* 回合提示 */}
      {phase === 'playing' && (
        <div className="mt-3 flex justify-center">
          <div
            className={cn(
              'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium',
              currentTurn === 'dragon'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-red-100 text-red-700'
            )}
          >
            <span
              className={cn(
                'w-2 h-2 rounded-full mr-2 animate-pulse',
                currentTurn === 'dragon' ? 'bg-blue-500' : 'bg-red-500'
              )}
            />
            {SIDE_NAMES[currentTurn]}思考中...
          </div>
        </div>
      )}
    </div>
  );
};
