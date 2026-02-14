import { useState, useCallback, useEffect } from 'react';
import type {
  Piece,
  PieceType,
  Side,
  Cell,
  GameState,
  GamePhase,
  PlayerRole,
  GameMode,
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

// 初始化龙方棋子池 - 4x4棋盘用8子
const createDragonPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  // 龙方：龙王、龙、狮、豹、狼、豺、狗、猫
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

// 初始化虎方棋子池 - 4x4棋盘用8子
const createTigerPieces = (): Piece[] => {
  const pieces: Piece[] = [];
  // 虎方：虎王、虎、狮、豹、狼、豺、狗、猫
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
const initializeBoard = (): Cell[][] => {
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

// 对战结果类型
export type BattleResult = 'win' | 'lose' | 'draw' | 'invalid';

// 检查对战结果（不实际执行吃子）
// 规则：大克小，同级同归于尽，王不能吃王
const checkBattle = (attacker: Piece, defender: Piece): { result: BattleResult; isMutual?: boolean } => {
  // 相同阵营不能吃
  if (attacker.side === defender.side) return { result: 'invalid' };
  
  // 如果防守方是暗棋，不能吃
  if (!defender.isRevealed) return { result: 'invalid' };
  
  // 王不能吃王（同归于尽）
  if ((attacker.type === 'dragon_king' || attacker.type === 'tiger_king') &&
      (defender.type === 'dragon_king' || defender.type === 'tiger_king')) {
    return { result: 'draw', isMutual: true };
  }
  
  // 王可以吃掉所有非王棋子（大克小）
  if (attacker.type === 'dragon_king' || attacker.type === 'tiger_king') {
    return { result: 'win' };
  }
  
  // 非王棋子不能吃王
  if (defender.type === 'dragon_king' || defender.type === 'tiger_king') {
    return { result: 'lose' };
  }
  
  // 同级同归于尽
  if (attacker.level === defender.level) {
    return { result: 'draw', isMutual: true };
  }
  
  // 等级高的赢（大克小）
  if (attacker.level > defender.level) {
    return { result: 'win' };
  }
  
  return { result: 'lose' };
};

// 检查是否可以吃掉对方棋子（用于显示可吃子提示）
const canCapture = (attacker: Piece, defender: Piece): boolean => {
  const battle = checkBattle(attacker, defender);
  return battle.result === 'win' || battle.result === 'draw';
};

// 检查移动是否有效
const isValidMove = (
  board: Cell[][],
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): boolean => {
  const fromCell = board[fromRow][fromCol];
  const toCell = board[toRow][toCol];
  
  // 起点必须有棋子且已翻开
  if (!fromCell.piece || !fromCell.piece.isRevealed) return false;
  
  // 只能移动到相邻格子（上下左右）
  const rowDiff = Math.abs(toRow - fromRow);
  const colDiff = Math.abs(toCol - fromCol);
  if (rowDiff + colDiff !== 1) return false;
  
  // 目标格子为空，可以移动
  if (!toCell.piece) return true;
  
  // 目标格子有棋子，检查是否可以吃
  if (toCell.piece) {
    return canCapture(fromCell.piece, toCell.piece);
  }
  
  return false;
};

// localStorage key
const GAME_STORAGE_KEY = 'dragon-tiger-game-state';

export const useGame = (gameMode: GameMode = 'local', roomId: string | null = null) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // 尝试从localStorage恢复游戏状态
    if (roomId && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(`${GAME_STORAGE_KEY}-${roomId}`);
      if (saved) {
        return JSON.parse(saved);
      }
    }
    
    return {
      board: initializeBoard(),
      currentTurn: Math.random() > 0.5 ? 'dragon' : 'tiger',
      selectedCell: null,
      phase: 'menu',
      winner: null,
      dragonPiecesCount: 8,
      tigerPiecesCount: 8,
      message: '欢迎来到龙虎斗！大克小，同级同归于尽！',
      roomId,
      playerRole: 'spectator',
      gameMode,
      players: { dragon: null, tiger: null },
    };
  });

  // 保存游戏状态到localStorage
  useEffect(() => {
    if (roomId && typeof localStorage !== 'undefined') {
      localStorage.setItem(`${GAME_STORAGE_KEY}-${roomId}`, JSON.stringify(gameState));
    }
  }, [gameState, roomId]);

  // 监听其他玩家的操作（在线模式）
  useEffect(() => {
    if (gameMode === 'online' && roomId && typeof window !== 'undefined') {
      const handleStorage = (e: StorageEvent) => {
        if (e.key === `${GAME_STORAGE_KEY}-${roomId}` && e.newValue) {
          const newState = JSON.parse(e.newValue);
          setGameState(newState);
        }
      };
      
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [gameMode, roomId]);

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

  // 翻开棋子
  const revealPiece = useCallback((row: number, col: number) => {
    setGameState(prev => {
      const cell = prev.board[row][col];
      if (!cell.piece || cell.piece.isRevealed) return prev;

      const newBoard = prev.board.map(r => r.map(c => ({ ...c })));
      newBoard[row][col].piece = { ...cell.piece, isRevealed: true };

      const nextTurn = prev.currentTurn === 'dragon' ? 'tiger' : 'dragon';
      const pieceName = cell.piece.name;
      const sideName = cell.piece.side === 'dragon' ? '龙方' : '虎方';

      return {
        ...prev,
        board: newBoard,
        currentTurn: nextTurn,
        selectedCell: null,
        message: `${sideName}翻开了${pieceName}！轮到${nextTurn === 'dragon' ? '龙方' : '虎方'}`,
      };
    });
  }, []);

  // 选择格子
  const selectCell = useCallback((row: number, col: number) => {
    setGameState(prev => {
      const cell = prev.board[row][col];
      
      // 如果点击的是暗棋，直接翻开
      if (cell.piece && !cell.piece.isRevealed) {
        return prev; // 交给revealPiece处理
      }

      // 如果没有选中任何格子
      if (!prev.selectedCell) {
        // 必须选择当前回合方的已翻开棋子
        if (cell.piece && cell.piece.isRevealed && cell.piece.side === prev.currentTurn) {
          return {
            ...prev,
            selectedCell: { row, col },
            message: `选中了${cell.piece.name}，请选择移动目标`,
          };
        }
        return prev;
      }

      // 如果点击的是同一个格子，取消选择
      if (prev.selectedCell.row === row && prev.selectedCell.col === col) {
        return {
          ...prev,
          selectedCell: null,
          message: '取消选择',
        };
      }

      // 尝试移动或吃子
      const fromRow = prev.selectedCell.row;
      const fromCol = prev.selectedCell.col;
      const fromCell = prev.board[fromRow][fromCol];

      if (!isValidMove(prev.board, fromRow, fromCol, row, col)) {
        // 如果点击的是当前回合的其他棋子，切换选择
        if (cell.piece && cell.piece.isRevealed && cell.piece.side === prev.currentTurn) {
          return {
            ...prev,
            selectedCell: { row, col },
            message: `切换选中了${cell.piece.name}`,
          };
        }
        return {
          ...prev,
          message: '无效的移动！',
        };
      }

      // 执行移动
      const newBoard = prev.board.map(r => r.map(c => ({ ...c })));
      const movingPiece = { ...fromCell.piece! };
      const targetPiece = newBoard[row][col].piece;

      let message = '';
      let dragonCount = prev.dragonPiecesCount;
      let tigerCount = prev.tigerPiecesCount;

      if (targetPiece) {
        // 对战
        const battle = checkBattle(movingPiece, targetPiece);
        const targetName = targetPiece.name;
        
        if (battle.result === 'win') {
          // 吃掉对方
          if (targetPiece.side === 'dragon') {
            dragonCount--;
          } else {
            tigerCount--;
          }
          message = `${movingPiece.name}吃掉了${targetName}！`;
          newBoard[row][col].piece = movingPiece;
        } else if (battle.result === 'draw' && battle.isMutual) {
          // 同归于尽
          if (targetPiece.side === 'dragon') {
            dragonCount--;
          } else {
            tigerCount--;
          }
          if (movingPiece.side === 'dragon') {
            dragonCount--;
          } else {
            tigerCount--;
          }
          message = `${movingPiece.name}与${targetName}同归于尽！`;
          newBoard[row][col].piece = null;
        } else {
          // 不应该执行到这里，因为isValidMove会阻止
          message = '无法吃掉对方！';
          return { ...prev, message };
        }
      } else {
        message = `${movingPiece.name}移动了`;
        newBoard[row][col].piece = movingPiece;
      }

      newBoard[fromRow][fromCol].piece = null;

      const nextTurn = prev.currentTurn === 'dragon' ? 'tiger' : 'dragon';
      
      // 检查胜利条件
      let winner: Side | null = null;
      let phase: GamePhase = 'playing';
      
      if (dragonCount === 0 && tigerCount === 0) {
        // 双方同时归零，平局
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

      return {
        ...prev,
        board: newBoard,
        currentTurn: nextTurn,
        selectedCell: null,
        dragonPiecesCount: dragonCount,
        tigerPiecesCount: tigerCount,
        message,
        winner,
        phase,
      };
    });
  }, []);

  // 处理格子点击
  const handleCellClick = useCallback((row: number, col: number) => {
    const cell = gameState.board[row][col];
    
    // 如果游戏已结束，不处理
    if (gameState.phase !== 'playing') return;
    
    // 如果点击的是暗棋，翻开它
    if (cell.piece && !cell.piece.isRevealed) {
      revealPiece(row, col);
      return;
    }
    
    // 否则处理选择/移动
    selectCell(row, col);
  }, [gameState.board, gameState.phase, revealPiece, selectCell]);

  return {
    gameState,
    startGame,
    resetGame,
    backToMenu,
    setPlayerRole,
    handleCellClick,
    revealPiece,
    selectCell,
  };
};
