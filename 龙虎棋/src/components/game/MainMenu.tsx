import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GameRules } from './GameRules';
import { RoomSystem, RoomInfo } from './RoomSystem';
import { Play, Sword } from 'lucide-react';

interface MainMenuProps {
  onStartLocalGame: () => void;
  onCreateRoom: (role: 'dragon' | 'tiger') => Promise<string>;
  onJoinRoom: (roomId: string) => Promise<boolean>;
  onLeaveRoom: () => void;
  onStartOnlineGame: () => void;
  roomId: string | null;
  playerRole: string;
  opponentConnected: boolean;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onStartLocalGame,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onStartOnlineGame,
  roomId,
  playerRole,
  opponentConnected,
}) => {
  const [showRoomSystem, setShowRoomSystem] = useState(false);

  // 如果已经在房间中，显示房间信息
  if (roomId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl opacity-10 animate-bounce">🐲</div>
          <div className="absolute top-20 right-20 text-5xl opacity-10 animate-pulse">🐅</div>
          <div className="absolute bottom-20 left-20 text-5xl opacity-10 animate-bounce" style={{ animationDelay: '0.5s' }}>🐉</div>
          <div className="absolute bottom-10 right-10 text-6xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>🐯</div>
        </div>

        <div className="relative w-full max-w-md">
          {/* 标题 */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600 mb-2">
              龙虎斗
            </h1>
            <p className="text-slate-600 text-sm font-medium">
              在线对战房间
            </p>
          </div>

          {/* 房间信息 */}
          <RoomInfo
            roomId={roomId}
            playerRole={playerRole}
            opponentConnected={opponentConnected}
            onLeaveRoom={onLeaveRoom}
            onStartGame={onStartOnlineGame}
          />
          
          {/* 提示信息 */}
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              {opponentConnected 
                ? '对手已加入，可以开始游戏了！' 
                : '等待对手加入房间...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10 animate-bounce">🐲</div>
        <div className="absolute top-20 right-20 text-5xl opacity-10 animate-pulse">🐅</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-10 animate-bounce" style={{ animationDelay: '0.5s' }}>🐉</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}>🐯</div>
      </div>

      {/* 主卡片 */}
      <div className="relative bg-white rounded-3xl shadow-2xl border-4 border-slate-300 p-8 max-w-md w-full">
        {/* 标题装饰 */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-600 to-red-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center">
            <Sword className="w-5 h-5 mr-2" />
            <span className="font-bold">龙虎对决</span>
          </div>
        </div>

        {/* 标题 */}
        <div className="text-center mt-4 mb-6">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600 mb-2">
            龙虎斗
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            4×4策略对战棋盘
          </p>
        </div>

        {/* 棋子展示 */}
        <div className="flex justify-center items-center space-x-1 mb-6 flex-wrap">
          {['🐲', '🐅', '🐉', '🐯', '🦁', '🐆', '🐺', '🦊', '🐕', '🐱'].map((emoji, index) => (
            <span
              key={index}
              className="text-xl animate-bounce"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {/* 房间系统或主菜单 */}
        {!showRoomSystem ? (
          <div className="space-y-4">
            <Button
              onClick={() => setShowRoomSystem(true)}
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-600 to-red-600 hover:from-blue-700 hover:to-red-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2" />
              开始游戏
            </Button>

            <div className="flex justify-center gap-2">
              <GameRules />
            </div>
          </div>
        ) : (
          <RoomSystem
            onCreateRoom={onCreateRoom}
            onJoinRoom={onJoinRoom}
            onLocalGame={() => {
              setShowRoomSystem(false);
              onStartLocalGame();
            }}
          />
        )}

        {/* 返回按钮 */}
        {showRoomSystem && (
          <Button
            onClick={() => setShowRoomSystem(false)}
            variant="ghost"
            className="w-full mt-4"
          >
            返回
          </Button>
        )}

        {/* 游戏特点 */}
        {!showRoomSystem && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl mb-1">🎯</div>
                <p className="text-xs text-gray-600">策略对战</p>
              </div>
              <div>
                <div className="text-2xl mb-1">👥</div>
                <p className="text-xs text-gray-600">双人对战</p>
              </div>
              <div>
                <div className="text-2xl mb-1">🏆</div>
                <p className="text-xs text-gray-600">胜负对决</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部版权 */}
      <p className="mt-8 text-slate-500/60 text-sm text-center">
        4×4棋盘 · 大克小 · 同级同归于尽
      </p>
    </div>
  );
};
