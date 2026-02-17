import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Users, Copy, DoorOpen, Plus, Gamepad2, Check } from 'lucide-react';

interface RoomSystemProps {
  onCreateRoom: (role: 'dragon' | 'tiger') => Promise<string>;
  onJoinRoom: (roomId: string) => Promise<boolean>;
  onLocalGame: () => void;
}

export const RoomSystem: React.FC<RoomSystemProps> = ({
  onCreateRoom,
  onJoinRoom,
  onLocalGame,
}) => {
  const [roomId, setRoomId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleJoin = async () => {
    if (roomId.length !== 4) return;
    
    setIsJoining(true);
    setJoinError(null);
    
    const success = await onJoinRoom(roomId);
    
    if (!success) {
      setJoinError('房间不存在');
    }
    
    setIsJoining(false);
  };

  const handleCreate = async (role: 'dragon' | 'tiger') => {
    setIsCreating(true);
    await onCreateRoom(role);
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      {/* 本地游戏 */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <Gamepad2 className="w-5 h-5 mr-2" />
            本地对战
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            两人使用同一台设备轮流操作
          </p>
          <Button
            onClick={onLocalGame}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
          >
            开始本地游戏
          </Button>
        </CardContent>
      </Card>

      {/* 创建房间 */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <Plus className="w-5 h-5 mr-2" />
            创建房间
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            创建房间并邀请好友加入
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => handleCreate('dragon')}
              variant="outline"
              disabled={isCreating}
              className="border-blue-400 hover:bg-blue-50 text-blue-700"
            >
              <span className="text-xl mr-2">🐉</span>
              {isCreating ? '创建中...' : '我是龙方'}
            </Button>
            <Button
              onClick={() => handleCreate('tiger')}
              variant="outline"
              disabled={isCreating}
              className="border-red-400 hover:bg-red-50 text-red-700"
            >
              <span className="text-xl mr-2">🐯</span>
              {isCreating ? '创建中...' : '我是虎方'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 加入房间 */}
      <Card className="border-2 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center text-slate-800">
            <DoorOpen className="w-5 h-5 mr-2" />
            加入房间
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!showJoinInput ? (
            <Button
              onClick={() => setShowJoinInput(true)}
              variant="outline"
              className="w-full border-slate-400 hover:bg-slate-50"
            >
              <Users className="w-4 h-4 mr-2" />
              输入房间号加入
            </Button>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="输入4位房间号"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value.toUpperCase());
                  setJoinError(null);
                }}
                maxLength={4}
                className="text-center text-lg tracking-widest uppercase"
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              {joinError && (
                <p className="text-red-500 text-sm text-center">{joinError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowJoinInput(false);
                    setJoinError(null);
                    setRoomId('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={roomId.length !== 4 || isJoining}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-red-600"
                >
                  {isJoining ? '加入中...' : '加入'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// 房间信息展示组件
interface RoomInfoProps {
  roomId: string;
  playerRole: string;
  opponentConnected: boolean;
  onLeaveRoom: () => void;
}

export const RoomInfo: React.FC<RoomInfoProps> = ({
  roomId,
  playerRole,
  opponentConnected,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-center text-slate-800">
          房间信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 房间号 */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">房间号（分享给好友）</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black text-slate-700 tracking-widest">
              {roomId}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="h-8 w-8 p-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* 玩家状态 */}
        <div className="grid grid-cols-2 gap-3">
          <div className={cn(
            "rounded-lg p-3 text-center border-2",
            playerRole === 'dragon' ? 'bg-blue-100 border-blue-500' : 'bg-slate-100 border-slate-300'
          )}>
            <span className="text-2xl">🐉</span>
            <p className={cn(
              "text-sm font-medium",
              playerRole === 'dragon' ? 'text-blue-700' : 'text-slate-600'
            )}>
              {playerRole === 'dragon' ? '你' : '等待加入...'}
            </p>
            {playerRole === 'dragon' && (
              <span className="text-xs text-blue-500">龙方</span>
            )}
          </div>
          <div className={cn(
            "rounded-lg p-3 text-center border-2",
            playerRole === 'tiger' ? 'bg-red-100 border-red-500' : 'bg-slate-100 border-slate-300'
          )}>
            <span className="text-2xl">🐯</span>
            <p className={cn(
              "text-sm font-medium",
              playerRole === 'tiger' ? 'text-red-700' : 'text-slate-600'
            )}>
              {playerRole === 'tiger' ? '你' : opponentConnected ? '已加入' : '等待加入...'}
            </p>
            {playerRole === 'tiger' && (
              <span className="text-xs text-red-500">虎方</span>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button
            onClick={onLeaveRoom}
            variant="outline"
            className="w-full"
          >
            离开房间
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
