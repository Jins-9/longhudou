import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Side } from '@/types/game';
import { SIDE_NAMES, SIDE_ICONS } from '@/types/game';
import { cn } from '@/lib/utils';
import { Trophy, RotateCcw, Home, Sparkles, PartyPopper, Handshake } from 'lucide-react';

interface GameOverProps {
  isOpen: boolean;
  winner: Side | null;
  onRestart: () => void;
  onBackToMenu: () => void;
}

export const GameOver: React.FC<GameOverProps> = ({
  isOpen,
  winner,
  onRestart,
  onBackToMenu,
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        {/* 顶部庆祝背景 */}
        <div
          className={cn(
            'h-32 flex items-center justify-center relative',
            winner === 'dragon'
              ? 'bg-gradient-to-br from-blue-500 to-blue-700'
              : winner === 'tiger'
              ? 'bg-gradient-to-br from-red-500 to-red-700'
              : 'bg-gradient-to-br from-gray-400 to-gray-600'
          )}
        >
          {/* 庆祝动画 */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-ping"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 2) * 40}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '2s',
                }}
              >
                <Sparkles className="w-4 h-4 text-white/50" />
              </div>
            ))}
          </div>

          {/* 图标 */}
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
              {winner ? (
                <Trophy
                  className={cn(
                    'w-10 h-10',
                    winner === 'dragon' ? 'text-blue-600' : 'text-red-600'
                  )}
                />
              ) : (
                <Handshake className="w-10 h-10 text-gray-600" />
              )}
            </div>
          </div>

          {/* 彩带装饰 */}
          <PartyPopper className="absolute top-4 left-4 w-8 h-8 text-white/60" />
          <PartyPopper className="absolute top-4 right-4 w-8 h-8 text-white/60" />
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-black">
              {winner ? (
                <span
                  className={cn(
                    'bg-clip-text text-transparent',
                    winner === 'dragon'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-800'
                      : 'bg-gradient-to-r from-red-600 to-red-800'
                  )}
                >
                  {SIDE_ICONS[winner]} {SIDE_NAMES[winner]}获胜！
                </span>
              ) : (
                <span className="bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                  平局！
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <p className="text-center text-gray-600 mt-4 mb-6">
            {winner ? (
              <>
                恭喜你吃掉了对方所有棋子！
                <br />
                <span className="text-sm">真是一场精彩的对决！</span>
              </>
            ) : (
              <>
                双方势均力敌，不分胜负！
                <br />
                <span className="text-sm">让我们再战一局！</span>
              </>
            )}
          </p>

          {/* 按钮组 */}
          <div className="space-y-3">
            <Button
              onClick={onRestart}
              className={cn(
                'w-full h-12 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200',
                winner === 'dragon'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  : winner === 'tiger'
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
              )}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              再来一局
            </Button>

            <Button
              onClick={onBackToMenu}
              variant="outline"
              className="w-full h-12 font-bold rounded-xl border-2 hover:bg-gray-50"
            >
              <Home className="w-5 h-5 mr-2" />
              返回主菜单
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
