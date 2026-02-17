import React from 'react';
import type { Cell, Side } from '@/types/game';
import { PIECE_COLORS } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameCellProps {
  cell: Cell;
  isSelected: boolean;
  isValidMove: boolean;
  isMutualDestruction?: boolean;
  currentTurn: Side;
  onClick: () => void;
}

export const GameCell: React.FC<GameCellProps> = ({
  cell,
  isSelected,
  isValidMove,
  isMutualDestruction,
  onClick,
}) => {
  const { piece } = cell;

  return (
    <div
      className={cn(
        'relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20',
        'flex items-center justify-center',
        'cursor-pointer transition-all duration-200',
        'rounded-xl border-3',
        'shadow-lg hover:shadow-xl',
        {
          // 空格子样式
          'bg-slate-100 border-slate-300 hover:bg-slate-200': !piece,
          
          // 暗棋样式（背面朝上）
          'bg-gradient-to-br from-slate-700 to-slate-900 border-slate-800': 
            piece && !piece.isRevealed,
          
          // 龙方棋子样式 - 蓝色系
          [cn(PIECE_COLORS.dragon.bg, PIECE_COLORS.dragon.border)]: 
            piece && piece.isRevealed && piece.side === 'dragon',
          
          // 虎方棋子样式 - 红色系
          [cn(PIECE_COLORS.tiger.bg, PIECE_COLORS.tiger.border)]: 
            piece && piece.isRevealed && piece.side === 'tiger',
          
          // 选中状态
          'ring-4 ring-yellow-400 ring-offset-2 scale-110 z-10': isSelected,
          
          // 可移动目标提示
          'ring-2 ring-green-400 ring-offset-1': isValidMove && !piece,
          
          // 可吃子目标提示
          'ring-2 ring-red-400 ring-offset-1 animate-pulse': isValidMove && piece && !isMutualDestruction,
          
          // 同归于尽提示 - 紫色
          'ring-2 ring-purple-500 ring-offset-1 animate-pulse': isMutualDestruction,
        }
      )}
      onClick={onClick}
    >
      {piece ? (
        piece.isRevealed ? (
          // 翻开的棋子
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl drop-shadow-lg">
              {piece.emoji}
            </span>
            <span className={cn(
              'text-[10px] sm:text-xs font-bold mt-0.5 leading-none',
              PIECE_COLORS[piece.side].text
            )}>
              {piece.name}
            </span>
          </div>
        ) : (
          // 暗棋（背面）
          <div className="flex flex-col items-center justify-center">
            <span className="text-2xl sm:text-3xl opacity-50">🎴</span>
            <span className="text-[10px] text-slate-300/60 mt-0.5">?</span>
          </div>
        )
      ) : (
        // 空格子
        <span className="text-slate-300/50 text-xl">·</span>
      )}
      
      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-md">
          <span className="text-yellow-900 text-xs font-bold">✓</span>
        </div>
      )}

      {/* 同归于尽指示器 */}
      {isMutualDestruction && (
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white text-[10px] font-bold">💥</span>
        </div>
      )}
    </div>
  );
};
