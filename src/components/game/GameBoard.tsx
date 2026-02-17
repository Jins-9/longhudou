import React from 'react';
import { GameCell } from './GameCell';
import type { Cell, Side } from '@/types/game';

interface GameBoardProps {
  board: Cell[][];
  selectedCell: { row: number; col: number } | null;
  currentTurn: Side;
  onCellClick: (row: number, col: number) => void;
  playerRole?: string;
}

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
  if (!board || !Array.isArray(board) || board.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-100 rounded-2xl">
        <div className="text-slate-500">棋盘加载中...</div>
      </div>
    );
  }
  // 检查是否是有效的移动目标
  const isValidMoveTarget = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    
    const fromRow = selectedCell.row;
    const fromCol = selectedCell.col;
    const rowDiff = Math.abs(row - fromRow);
    const colDiff = Math.abs(col - fromCol);
    
    // 只能移动到相邻格子
    if (rowDiff + colDiff !== 1) return false;
    
    const targetCell = board[row][col];
    const fromCell = board[fromRow][fromCol];
    
    if (!fromCell.piece) return false;
    
    // 空格子可以移动
    if (!targetCell.piece) return true;
    
    // 不能吃暗棋
    if (!targetCell.piece.isRevealed) return false;
    
    // 不能吃己方棋子
    if (targetCell.piece.side === fromCell.piece.side) return false;
    
    // 检查对战结果
    const battle = checkBattle(fromCell.piece, targetCell.piece);
    return battle.canAttack;
  };

  // 检查是否是同归于尽
  const isMutualDestruction = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    
    const fromRow = selectedCell.row;
    const fromCol = selectedCell.col;
    const rowDiff = Math.abs(row - fromRow);
    const colDiff = Math.abs(col - fromCol);
    
    if (rowDiff + colDiff !== 1) return false;
    
    const targetCell = board[row][col];
    const fromCell = board[fromRow][fromCol];
    
    if (!fromCell.piece || !targetCell.piece) return false;
    if (!targetCell.piece.isRevealed) return false;
    
    const battle = checkBattle(fromCell.piece, targetCell.piece);
    return !!(battle.canAttack && battle.isMutual);
  };

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
            row.map((cell, colIndex) => (
              <GameCell
                key={`${rowIndex}-${colIndex}`}
                cell={cell}
                isSelected={
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex
                }
                isValidMove={isValidMoveTarget(rowIndex, colIndex)}
                isMutualDestruction={isMutualDestruction(rowIndex, colIndex)}
                currentTurn={currentTurn}
                onClick={() => onCellClick(rowIndex, colIndex)}
              />
            ))
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
