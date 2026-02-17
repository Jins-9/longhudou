import React, { useMemo } from 'react';
import { GameCell } from './GameCell';
import type { Cell, Side } from '@/types/game';

interface GameBoardProps {
  board: Cell[][];
  selectedCell: { row: number; col: number } | null;
  currentTurn: Side;
  onCellClick: (row: number, col: number) => void;
  playerRole?: string;
}

// 验证棋盘的有效性
const isValidBoard = (board: any): board is Cell[][] => {
  if (!board || !Array.isArray(board)) return false;
  if (board.length !== 4) return false;
  
  for (const row of board) {
    if (!Array.isArray(row) || row.length !== 4) return false;
    
    for (const cell of row) {
      if (!cell || typeof cell !== 'object') return false;
      if (typeof cell.row !== 'number' || typeof cell.col !== 'number') return false;
      
      // 如果有棋子，验证棋子结构
      if (cell.piece) {
        if (typeof cell.piece !== 'object') return false;
        if (typeof cell.piece.id !== 'string') return false;
        if (typeof cell.piece.type !== 'string') return false;
        if (cell.piece.side !== 'dragon' && cell.piece.side !== 'tiger') return false;
        if (typeof cell.piece.level !== 'number') return false;
        if (typeof cell.piece.isRevealed !== 'boolean') return false;
        if (typeof cell.piece.name !== 'string') return false;
        if (typeof cell.piece.emoji !== 'string') return false;
      }
    }
  }
  
  return true;
};

// 检查对战结果 - 大克小，同级同归于尽，王不能吃王
const checkBattle = (attacker: any, defender: any): { canAttack: boolean; isMutual?: boolean } => {
  // 相同阵营不能吃
  if (attacker.side === defender.side) return { canAttack: false };
  
  // 如果防守方是暗棋，不能吃
  if (!defender.isRevealed) return { canAttack: false };
  
  // 王不能吃王（同归于尽）
  if ((attacker.type === 'dragon_king' || attacker.type === 'tiger_king') &&
      (defender.type === 'dragon_king' || defender.type === 'tiger_king')) {
    return { canAttack: true, isMutual: true };
  }
  
  // 王可以吃掉所有非王棋子（大克小）
  if (attacker.type === 'dragon_king' || attacker.type === 'tiger_king') {
    return { canAttack: true };
  }
  
  // 非王棋子不能吃王
  if (defender.type === 'dragon_king' || defender.type === 'tiger_king') {
    return { canAttack: false };
  }
  
  // 同级同归于尽
  if (attacker.level === defender.level) {
    return { canAttack: true, isMutual: true };
  }
  
  // 等级高的赢（大克小）
  if (attacker.level > defender.level) {
    return { canAttack: true };
  }
  
  return { canAttack: false };
};

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  selectedCell,
  currentTurn,
  onCellClick,
}) => {
  // 安全检查：如果 board 无效，显示加载状态
  if (!isValidBoard(board)) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-100 rounded-2xl">
        <div className="text-slate-500">棋盘加载中...</div>
      </div>
    );
  }
  
  // 缓存移动目标计算结果
  const moveTargets = useMemo(() => {
    const targets = new Set<string>();
    
    if (!selectedCell) return targets;
    
    const fromRow = selectedCell.row;
    const fromCol = selectedCell.col;
    const fromCell = board[fromRow][fromCol];
    
    if (!fromCell.piece) return targets;
    
    // 检查四个相邻格子
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [dr, dc] of directions) {
      const newRow = fromRow + dr;
      const newCol = fromCol + dc;
      
      if (newRow < 0 || newRow >= 4 || newCol < 0 || newCol >= 4) continue;
      
      const targetCell = board[newRow][newCol];
      
      // 空格子可以移动
      if (!targetCell.piece) {
        targets.add(`${newRow}-${newCol}`);
        continue;
      }
      
      // 不能吃暗棋
      if (!targetCell.piece.isRevealed) continue;
      
      // 不能吃己方棋子
      if (targetCell.piece.side === fromCell.piece.side) continue;
      
      // 检查对战结果
      const battle = checkBattle(fromCell.piece, targetCell.piece);
      if (battle.canAttack) {
        targets.add(`${newRow}-${newCol}`);
      }
    }
    
    return targets;
  }, [board, selectedCell]);
  
  // 缓存同归于尽计算结果
  const mutualDestructions = useMemo(() => {
    const mutuals = new Set<string>();
    
    if (!selectedCell) return mutuals;
    
    const fromRow = selectedCell.row;
    const fromCol = selectedCell.col;
    const fromCell = board[fromRow][fromCol];
    
    if (!fromCell.piece) return mutuals;
    
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    
    for (const [dr, dc] of directions) {
      const newRow = fromRow + dr;
      const newCol = fromCol + dc;
      
      if (newRow < 0 || newRow >= 4 || newCol < 0 || newCol >= 4) continue;
      
      const targetCell = board[newRow][newCol];
      
      if (!targetCell.piece || !targetCell.piece.isRevealed) continue;
      
      const battle = checkBattle(fromCell.piece, targetCell.piece);
      if (battle.canAttack && battle.isMutual) {
        mutuals.add(`${newRow}-${newCol}`);
      }
    }
    
    return mutuals;
  }, [board, selectedCell]);

  return (
    <div className="relative">
      {/* 棋盘背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-2xl transform rotate-1 scale-105 opacity-30" />
      
      {/* 棋盘主体 */}
      <div className="relative bg-gradient-to-br from-slate-100 to-slate-200 p-4 sm:p-5 rounded-2xl shadow-2xl border-4 border-slate-400">
        {/* 棋盘标题 */}
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-red-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-md">
          龙虎斗 4×4
        </div>
        
        {/* 4x4 格子 */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const cellKey = `${rowIndex}-${colIndex}`;
              return (
                <GameCell
                  key={cellKey}
                  cell={cell}
                  isSelected={
                    selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                  }
                  isValidMove={moveTargets.has(cellKey)}
                  isMutualDestruction={mutualDestructions.has(cellKey)}
                  currentTurn={currentTurn}
                  onClick={() => onCellClick(rowIndex, colIndex)}
                />
              );
            })
          )}
        </div>
        
        {/* 坐标标记 */}
        <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-around -ml-5 sm:-ml-6">
          {['1', '2', '3', '4'].map((num) => (
            <span key={num} className="text-slate-600 font-bold text-xs sm:text-sm">
              {num}
            </span>
          ))}
        </div>
        <div className="absolute bottom-0 left-4 right-4 flex justify-around -mb-5 sm:-mb-6">
          {['A', 'B', 'C', 'D'].map((letter) => (
            <span key={letter} className="text-slate-600 font-bold text-xs sm:text-sm">
              {letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
