/**
 * 龙虎斗游戏后端服务
 * 使用 ws 库实现 WebSocket 通信
 */

import http from 'http';
import { WebSocketServer } from 'ws';

// 游戏房间数据存储（内存中）
const rooms = new Map();

// 生成房间ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// 生成玩家ID
function generatePlayerId() {
  return Math.random().toString(36).substring(2, 15);
}

// CORS头
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// HTTP服务器
const server = http.createServer((req, res) => {
  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // 解析URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API路由
  if (pathname === '/api/health') {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: rooms.size }));
    return;
  }

  // 创建房间
  if (pathname === '/api/create-room' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const playerId = data.playerId || generatePlayerId();
        const playerRole = data.role || 'dragon';
        
        const roomId = generateRoomId();
        const room = {
          id: roomId,
          hostId: playerId,
          hostRole: playerRole,
          guestId: null,
          guestRole: null,
          gameState: null,
          createdAt: Date.now(),
        };
        
        rooms.set(roomId, room);
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          roomId,
          playerId,
          playerRole,
        }));
      } catch (e) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // 加入房间
  if (pathname === '/api/join-room' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const roomId = data.roomId?.toUpperCase();
        const playerId = data.playerId || generatePlayerId();
        
        const room = rooms.get(roomId);
        
        if (!room) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room not found' }));
          return;
        }
        
        // 如果已经是房主
        if (room.hostId === playerId) {
          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            roomId,
            playerId,
            playerRole: room.hostRole,
            opponentConnected: !!room.guestId,
          }));
          return;
        }
        
        // 如果已经是客人
        if (room.guestId === playerId) {
          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            roomId,
            playerId,
            playerRole: room.guestRole,
            opponentConnected: true,
          }));
          return;
        }
        
        // 新玩家加入
        if (room.guestId) {
          res.writeHead(403, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room is full' }));
          return;
        }
        
        const guestRole = room.hostRole === 'dragon' ? 'tiger' : 'dragon';
        room.guestId = playerId;
        room.guestRole = guestRole;
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          roomId,
          playerId,
          playerRole: guestRole,
          opponentConnected: true,
        }));
      } catch (e) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // 获取房间状态
  if (pathname === '/api/room-status' && req.method === 'GET') {
    const roomId = url.searchParams.get('roomId')?.toUpperCase();
    const playerId = url.searchParams.get('playerId');
    
    const room = rooms.get(roomId);
    
    if (!room) {
      res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Room not found' }));
      return;
    }
    
    const isHost = room.hostId === playerId;
    const opponentConnected = isHost ? !!room.guestId : !!room.hostId;
    
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      roomId,
      opponentConnected,
      gameState: room.gameState,
    }));
    return;
  }

  // 更新游戏状态
  if (pathname === '/api/update-game' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const roomId = data.roomId?.toUpperCase();
        const gameState = data.gameState;
        
        const room = rooms.get(roomId);
        
        if (!room) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room not found' }));
          return;
        }
        
        room.gameState = gameState;
        room.lastUpdate = Date.now();
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // 离开房间
  if (pathname === '/api/leave-room' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const roomId = data.roomId?.toUpperCase();
        const playerId = data.playerId;
        
        const room = rooms.get(roomId);
        
        if (room) {
          if (room.hostId === playerId) {
            rooms.delete(roomId);
          } else if (room.guestId === playerId) {
            room.guestId = null;
            room.guestRole = null;
          }
        }
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid request' }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, corsHeaders);
  res.end('Not Found');
});

// 创建 WebSocket 服务器，绑定到同一个 HTTP 服务器
const wss = new WebSocketServer({ server });

// 存储客户端连接：roomId:playerId -> WebSocket
const clients = new Map();

wss.on('connection', (ws, req) => {
  // 从请求 URL 中提取 roomId 和 playerId
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomId = url.searchParams.get('room')?.toUpperCase();
  const playerId = url.searchParams.get('playerId');

  if (!roomId || !playerId) {
    ws.close();
    return;
  }

  const room = rooms.get(roomId);
  if (!room) {
    ws.close();
    return;
  }

  const clientKey = `${roomId}:${playerId}`;
  clients.set(clientKey, ws);

  // 通知对方玩家已连接
  const isHost = room.hostId === playerId;
  const opponentKey = isHost ? `${roomId}:${room.guestId}` : `${roomId}:${room.hostId}`;
  const opponentWs = clients.get(opponentKey);

  if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
    opponentWs.send(JSON.stringify({ type: 'opponent-connected' }));
    ws.send(JSON.stringify({ type: 'opponent-connected' }));
  }

  // 处理收到的消息
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'game-update') {
        // 更新房间游戏状态
        room.gameState = message.gameState;

        // 转发给对手
        const opponentWs = clients.get(opponentKey);
        if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
          opponentWs.send(JSON.stringify({
            type: 'game-update',
            gameState: message.gameState,
          }));
        }
      }
      // 可添加其他消息类型处理
    } catch (e) {
      console.error('Invalid message from client:', e.message);
    }
  });

  // 处理连接关闭
  ws.on('close', () => {
    clients.delete(clientKey);

    // 通知对手
    const opponentWs = clients.get(opponentKey);
    if (opponentWs && opponentWs.readyState === WebSocket.OPEN) {
      opponentWs.send(JSON.stringify({ type: 'opponent-disconnected' }));
    }
  });

  // 处理错误
  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

// 清理过期房间（每10分钟）
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms) {
    if (now - room.createdAt > 30 * 60 * 1000) { // 30分钟过期
      rooms.delete(roomId);
    }
  }
}, 10 * 60 * 1000);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`龙虎斗游戏服务器运行在端口 ${PORT}`);
  console.log(`HTTP API: http://localhost:${PORT}/api/health`);
});
