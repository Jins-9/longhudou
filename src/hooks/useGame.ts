import { useState, useCallback } from 'react';
import type {
  Piece,
  PieceType,
  Side,
  Cell,
  GameState,
  PlayerRole,
} from '@/types/game';
import {
  PIECE_LEVELS,
  PIECE_NAMES,
  PIECE_EMOJIS,
} from '@/types/game';

// 创建棋子
const createPiece = (type: PieceType, side: Side, index: number): Piece => ({
  id: `${side}-${type}-${index}`,
  type,
  side,
  level: PIECE_LEVELS[type],
  isRevealed: false,
  name: PIECE_NAMES[type],
  emoji: PIECE_EMOJIS[type],
});

// 初始化龙方棋子池
const createDragonPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  pieces.push(createPiece('dragon_king', 'dragon', 0));
  pieces.push(createPiece('dragon', 'dragon', 1));
  pieces.push(createPiece('lion', 'dragon', 2));
  pieces.push(createPiece('leopard', 'dragon', 3));
  pieces.push(createPiece('wolf', 'dragon', 4));
  pieces.push(createPiece('jackal', 'dragon', 5));
  pieces.push(createPiece('dog', 'dragon', 6));
  pieces.push(createPiece('cat', 'dragon', 7));
  return pieces;
};

// 初始化虎方棋子池
const createTigerPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  pieces.push(createPiece('tiger_king', 'tiger', 0));
  pieces.push(createPiece('tiger', 'tiger', 1));
  pieces.push(createPiece('lion', 'tiger', 2));
  pieces.push(createPiece('leopard', 'tiger', 3));
  pieces.push(createPiece('wolf', 'tiger', 4));
  pieces.push(createPiece('jackal', 'tiger', 5));
  pieces.push(createPiece('dog', 'tiger', 6));
  pieces.push(createPiece('cat', 'tiger', 7));
  return pieces;
};

// 洗牌算法
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// 初始化4x4棋盘
export const initializeBoard = (): Cell[][] => {
  const dragonPieces = createDragonPieces();
  const tigerPieces = createTigerPieces();
  const allPieces = shuffleArray([...dragonPieces, ...tigerPieces]);
  
  const board: Cell[][] = [];
  let pieceIndex = 0;
  
  for (let row = 0; row < 4; row++) {
    const rowCells: Cell[] = [];
    for (let col = 0; col < 4; col++) {
      rowCells.push({
        row,
        col,
        piece: allPieces[pieceIndex] || null,
      });
      pieceIndex++;
    }
    board.push(rowCells);
  }
  
  return board;
};

// 创建初始游戏状态
export const createInitialGameState = (): GameState => ({
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

// 检查对战结果
export const checkBattle = (attacker: Piece, defender: Piece): { result: 'win' | 'lose' | 'draw' | 'invalid'; isMutual?: boolean } => {
  if (attacker.side === defender.side) return { result: 'invalid' };
  if (!defender.isRevealed) return { result: 'invalid' };
  
  if ((attacker.type === 'dragon_king' || attacker.type === 'tiger_king') &&
      (defender.type === 'dragon_king' || defender.type === 'tiger_king')) {
    return { result: 'draw', isMutual: true };
  }
  
  if (attacker.type === 'dragon_king' || attacker.type === 'tiger_king') {
    return { result: 'win' };
  }
  
  if (defender.type === 'dragon_king' || defender.type === 'tiger_king') {
    return { result: 'lose' };
  }
  
  if (attacker.level === defender.level) {
    return { result: 'draw', isMutual: true };
  }
  
  if (attacker.level > defender.level) {
    return { result: 'win' };
  }
  
  return { result: 'lose' };
};

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());

  // 开始游戏
  const startGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: initializeBoard(),
      currentTurn: Math.random() > 0.5 ? 'dragon' : 'tiger',
      selectedCell: null,
      phase: 'playing',
      winner: null,
      dragonPiecesCount: 8,
      tigerPiecesCount: 8,
      message: '游戏开始！大克小，同级同归于尽！',
    }));
  }, []);

  // 重置游戏
  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      board: initializeBoard(),
      currentTurn: Math.random() > 0.5 ? 'dragon' : 'tiger',
      selectedCell: null,
      phase: 'playing',
      winner: null,
      dragonPiecesCount: 8,
      tigerPiecesCount: 8,
      message: '新游戏开始！大克小，同级同归于尽！',
    }));
  }, []);

  // 返回主菜单
  const backToMenu = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      phase: 'menu',
    }));
  }, []);

  // 设置玩家角色
  const setPlayerRole = useCallback((role: PlayerRole) => {
    setGameState(prev => ({
      ...prev,
      playerRole: role,
    }));
  }, []);

  return {
    gameState,
    setGameState,
    startGame,
    resetGame,
    backToMenu,
    setPlayerRole,
  };
};
