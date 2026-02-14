import React from 'react';
import { Button } from '@/components/ui/button';
import { GameRules } from './GameRules';
import { RotateCcw, Home } from 'lucide-react';

interface GameControlsProps {
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onRestart,
  onBackToMenu,
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
