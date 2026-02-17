import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HelpCircle, Swords, Crown, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GameRules: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:text-slate-800"
        >
          <HelpCircle className="w-4 h-4 mr-2" />
          游戏规则
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-blue-100 to-red-100">
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center">
            <Swords className="w-6 h-6 mr-2 text-slate-700" />
            龙虎斗 游戏规则
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="px-6 py-4 max-h-[60vh]">
          <div className="space-y-6">
            {/* 游戏目标 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                游戏目标
              </h3>
              <p className="text-gray-700 leading-relaxed">
                吃掉对方所有棋子，或者让对方无法移动，即可获得胜利！
              </p>
            </section>

            {/* 棋盘设置 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                棋盘设置
              </h3>
              <p className="text-gray-700 leading-relaxed">
                4×4方格棋盘，共16格。龙方🐉(蓝色) vs 虎方🐯(红色)，双方各8枚棋子。
              </p>
            </section>

            {/* 棋子等级 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                <Swords className="w-5 h-5 mr-2" />
                棋子等级（从大到小）
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { emoji: '🐲', name: '龙王', side: '龙方', level: '王', color: 'blue' },
                  { emoji: '🐅', name: '虎王', side: '虎方', level: '王', color: 'red' },
                  { emoji: '🐉', name: '龙', side: '龙方', level: 'Lv.8', color: 'blue' },
                  { emoji: '🐯', name: '虎', side: '虎方', level: 'Lv.8', color: 'red' },
                  { emoji: '🦁', name: '狮', side: '双方', level: 'Lv.7', color: 'neutral' },
                  { emoji: '🐆', name: '豹', side: '双方', level: 'Lv.6', color: 'neutral' },
                  { emoji: '🐺', name: '狼', side: '双方', level: 'Lv.5', color: 'neutral' },
                  { emoji: '🦊', name: '豺', side: '双方', level: 'Lv.4', color: 'neutral' },
                  { emoji: '🐕', name: '狗', side: '双方', level: 'Lv.3', color: 'neutral' },
                  { emoji: '🐱', name: '猫', side: '双方', level: 'Lv.2', color: 'neutral' },
                ].map((piece) => (
                  <div
                    key={piece.name}
                    className={cn(
                      "flex items-center rounded-lg p-2 border",
                      piece.color === 'blue' ? 'bg-blue-50 border-blue-200' : 
                      piece.color === 'red' ? 'bg-red-50 border-red-200' : 
                      'bg-slate-50 border-slate-200'
                    )}
                  >
                    <span className="text-2xl mr-2">{piece.emoji}</span>
                    <div>
                      <span className={cn(
                        "font-bold",
                        piece.color === 'blue' ? 'text-blue-700' :
                        piece.color === 'red' ? 'text-red-700' :
                        'text-slate-700'
                      )}>{piece.name}</span>
                      <span className="text-xs text-slate-500 ml-1">{piece.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 核心规则 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                核心对战规则
              </h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                <p className="text-green-800 font-medium">
                  大克小
                </p>
                <p className="text-green-600 text-sm mt-1">
                  等级高的棋子可以吃掉等级低的棋子。例如：狮(Lv.7)可以吃豹(Lv.6)及以下所有棋子。
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
                <p className="text-purple-800 font-medium">
                  同级同归于尽
                </p>
                <p className="text-purple-600 text-sm mt-1">
                  相同等级的棋子对战时，双方同时消失！例如：狮对狮、狼对狼都会同归于尽。
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-amber-800 font-medium">
                  王不能吃王
                </p>
                <p className="text-amber-600 text-sm mt-1">
                  龙王和虎王相遇时同归于尽。王可以吃掉所有非王棋子。
                </p>
              </div>
            </section>

            {/* 游戏流程 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">游戏流程</h3>
              <ol className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-slate-200 text-slate-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                    1
                  </span>
                  <span>游戏开始时，所有棋子都是暗棋（背面朝上）随机分布在4×4棋盘上。</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-slate-200 text-slate-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                    2
                  </span>
                  <span>龙虎双方轮流行动，每次可以选择翻开一个暗棋，或者移动一个已翻开的己方棋子。</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-slate-200 text-slate-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                    3
                  </span>
                  <span>棋子只能上下左右移动一格，不能斜着走。</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-slate-200 text-slate-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                    4
                  </span>
                  <span>移动到敌方棋子所在格子即可对战，按等级判定结果（大克小，同级同归于尽）。</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-slate-200 text-slate-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-2 flex-shrink-0">
                    5
                  </span>
                  <span>吃掉对方所有棋子即可获胜！</span>
                </li>
              </ol>
            </section>

            {/* 在线对战 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">在线对战</h3>
              <p className="text-gray-700 text-sm">
                创建房间后分享房间号给好友，双方可以同时登入进行实时对战！
              </p>
            </section>

            {/* 小贴士 */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-2">获胜小贴士</h3>
              <ul className="space-y-1 text-gray-700 text-sm">
                <li>• 前期多翻棋，了解双方棋子分布</li>
                <li>• 王可以吃掉所有非王棋子，非常强大</li>
                <li>• 合理利用地形，堵住对方的移动路线</li>
                <li>• 同级对战会同归于尽，要谨慎选择</li>
                <li>• 用低级棋子换对方高级棋子是划算的</li>
                <li>• 王遇到王会同归于尽，注意保护</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
