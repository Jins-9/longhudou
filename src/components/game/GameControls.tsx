import React from 'react';
import { Button } from '@/components/ui/button';
import { GameRules } from './GameRules';
import { RotateCcw, Home, RefreshCw, Flag } from 'lucide-react';

interface GameControlsProps {
  onRestart: () => void;
  onBackToMenu: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  refreshSuccess?: boolean | null;
  onSurrender?: () => void;
  playerRole?: string;
  currentTurn?: string;
  phase?: 'menu' | 'waiting' | 'playing' | 'ended';
}

export const GameControls: React.FC<GameControlsProps> = ({
  onRestart,
  onBackToMenu,
  onRefresh,
  isRefreshing,
  refreshSuccess,
  onSurrender,
  playerRole,
  currentTurn,
  phase,
}) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mt-4">
      <Button
        onClick={onRestart}
        variant="outline"
        size="sm"
        className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
      >
        <RotateCcw className="w-4 h-4 mr-1" />
        重新开始
      </Button>

      <GameRules />

      {/* 在线模式显示刷新按钮 */}
      {onRefresh && (
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className={`
            bg-white border-blue-300 text-blue-600 hover:bg-blue-50
            ${refreshSuccess === true ? 'border-green-500 text-green-600 hover:bg-green-50' : ''}
            ${refreshSuccess === false ? 'border-red-500 text-red-600 hover:bg-red-50' : ''}
          `}
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? '刷新中...' : refreshSuccess === true ? '已刷新' : refreshSuccess === false ? '刷新失败' : '刷新'}
        </Button>
      )}

      {/* 认输按钮 - 仅在游戏中显示 */}
      {onSurrender && phase === 'playing' && (
        <Button
          onClick={onSurrender}
          variant="outline"
          size="sm"
          className="bg-white border-red-300 text-red-600 hover:bg-red-50"
        >
          <Flag className="w-4 h-4 mr-1" />
          认输
        </Button>
      )}

      <Button
        onClick={onBackToMenu}
        variant="outline"
        size="sm"
        className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <Home className="w-4 h-4 mr-1" />
        主菜单
      </Button>
    </div>
  );
};
