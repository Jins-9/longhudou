// 棋子类型 - 龙虎斗版本（优化版）
export type PieceType = 
  | 'dragon_king'  // 龙王 - 最强
  | 'tiger_king'   // 虎王 - 最强
  | 'dragon'       // 龙
  | 'tiger'        // 虎
  | 'lion'         // 狮
  | 'leopard'      // 豹
  | 'wolf'         // 狼
  | 'jackal'       // 豺
  | 'dog'          // 狗
  | 'cat';         // 猫

// 阵营 - 龙虎
export type Side = 'dragon' | 'tiger';

// 棋子状态
export interface Piece {
  id: string;
  type: PieceType;
  side: Side;
  level: number;
  isRevealed: boolean;
  name: string;
  emoji: string;
}

// 棋盘格子
export interface Cell {
  row: number;
  col: number;
  piece: Piece | null;
}

// 游戏状态
export type GamePhase = 'menu' | 'waiting' | 'playing' | 'ended';

// 玩家角色
export type PlayerRole = 'dragon' | 'tiger' | 'spectator';

// 游戏模式
export type GameMode = 'local' | 'online';

// 游戏状态对象
export interface GameState {
  board: Cell[][];
  currentTurn: Side;
  selectedCell: { row: number; col: number } | null;
  phase: GamePhase;
  winner: Side | null;
  dragonPiecesCount: number;
  tigerPiecesCount: number;
  message: string;
  roomId: string | null;
  playerRole: PlayerRole;
  gameMode: GameMode;
  players: {
    dragon: string | null;
    tiger: string | null;
  };
}

// 棋子等级映射 - 大克小逻辑
export const PIECE_LEVELS: Record<PieceType, number> = {
  dragon_king: 10,  // 龙王最强
  tiger_king: 10,   // 虎王最强
  dragon: 8,        // 龙
  tiger: 8,         // 虎
  lion: 7,          // 狮
  leopard: 6,       // 豹
  wolf: 5,          // 狼
  jackal: 4,        // 豺
  dog: 3,           // 狗
  cat: 2,           // 猫
};

// 棋子名称映射
export const PIECE_NAMES: Record<PieceType, string> = {
  dragon_king: '龙王',
  tiger_king: '虎王',
  dragon: '龙',
  tiger: '虎',
  lion: '狮',
  leopard: '豹',
  wolf: '狼',
  jackal: '豺',
  dog: '狗',
  cat: '猫',
};

// 棋子emoji映射
export const PIECE_EMOJIS: Record<PieceType, string> = {
  dragon_king: '🐲',
  tiger_king: '🐅',
  dragon: '🐉',
  tiger: '🐯',
  lion: '🦁',
  leopard: '🐆',
  wolf: '🐺',
  jackal: '🦊',
  dog: '🐕',
  cat: '🐱',
};

// 棋子颜色映射 - 高对比度版本
export const PIECE_COLORS: Record<Side, { bg: string; border: string; text: string; gradient: string; shadow: string }> = {
  dragon: { 
    bg: 'bg-blue-600', 
    border: 'border-blue-800', 
    text: 'text-white',
    gradient: 'from-blue-500 to-blue-700',
    shadow: 'shadow-blue-500/50'
  },
  tiger: { 
    bg: 'bg-red-600', 
    border: 'border-red-800', 
    text: 'text-white',
    gradient: 'from-red-500 to-red-700',
    shadow: 'shadow-red-500/50'
  },
};

// 阵营显示名称
export const SIDE_NAMES: Record<Side, string> = {
  dragon: '龙方',
  tiger: '虎方',
};

// 阵营图标
export const SIDE_ICONS: Record<Side, string> = {
  dragon: '🐉',
  tiger: '🐯',
};
