/**
 * 龙虎斗游戏后端服务
 * 使用原生Node.js实现WebSocket通信
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

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
        console.log(`[Create Room] Room: ${roomId}, Host: ${playerId}, Role: ${playerRole}`);
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          roomId,
          playerId,
          playerRole,
        }));
      } catch (e) {
        console.error('[Create Room] Error:', e);
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
          console.log(`[Join Room] Room not found: ${roomId}, Player: ${playerId}`);
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room not found' }));
          return;
        }
        
        // 如果已经是房主
        if (room.hostId === playerId) {
          console.log(`[Join Room] Host rejoined: ${roomId}, Player: ${playerId}`);
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
          console.log(`[Join Room] Guest rejoined: ${roomId}, Player: ${playerId}`);
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
          console.log(`[Join Room] Room full: ${roomId}, Player: ${playerId}`);
          res.writeHead(403, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Room is full' }));
          return;
        }
        
        const guestRole = room.hostRole === 'dragon' ? 'tiger' : 'dragon';
        room.guestId = playerId;
        room.guestRole = guestRole;
        console.log(`[Join Room] New guest: ${roomId}, Guest: ${playerId}, Role: ${guestRole}`);
        
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          roomId,
          playerId,
          playerRole: guestRole,
          opponentConnected: true,
        }));
      } catch (e) {
        console.error('[Join Room] Error:', e);
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
      console.log(`[Room Status] Room not found: ${roomId}, Player: ${playerId}`);
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
            // 房主离开：标记为已离开，但不立即删除房间
            room.hostId = null;
            room.hostRole = null;
            // 如果客人也已经离开，则删除房间
            if (!room.guestId) {
              rooms.delete(roomId);
            }
          } else if (room.guestId === playerId) {
            // 客人离开：标记为已离开
            room.guestId = null;
            room.guestRole = null;
            // 如果房主也已经离开，则删除房间
            if (!room.hostId) {
              rooms.delete(roomId);
            }
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

// WebSocket升级处理
const clients = new Map();

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const roomId = url.searchParams.get('room')?.toUpperCase();
  const playerId = url.searchParams.get('playerId');
  
  if (!roomId || !playerId) {
    socket.destroy();
    return;
  }
  
  const room = rooms.get(roomId);
  if (!room) {
    socket.destroy();
    return;
  }
  
  // 简单的WebSocket握手
  const acceptKey = request.headers['sec-websocket-key'];
  const hash = require('crypto').createHash('sha1')
    .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${hash}\r\n` +
    '\r\n'
  );
  
  // 存储客户端连接
  const clientKey = `${roomId}:${playerId}`;
  clients.set(clientKey, socket);
  
  // 通知对方玩家已连接
  const isHost = room.hostId === playerId;
  const opponentKey = isHost 
    ? `${roomId}:${room.guestId}` 
    : `${roomId}:${room.hostId}`;
  const opponentSocket = clients.get(opponentKey);
  
  if (opponentSocket) {
    sendWebSocketMessage(opponentSocket, { type: 'opponent-connected' });
    sendWebSocketMessage(socket, { type: 'opponent-connected' });
  }
  
  // 处理消息
  socket.on('data', (data) => {
    try {
      const message = parseWebSocketFrame(data, socket);
      if (!message) return;
      
      const msg = JSON.parse(message);
      
      // 广播游戏状态更新
      if (msg.type === 'game-update') {
        room.gameState = msg.gameState;
        
        // 通知对方
        const opponentKey = isHost 
          ? `${roomId}:${room.guestId}` 
          : `${roomId}:${room.hostId}`;
        const opponentSocket = clients.get(opponentKey);
        
        if (opponentSocket) {
          sendWebSocketMessage(opponentSocket, {
            type: 'game-update',
            gameState: msg.gameState,
          });
        }
      }
    } catch (e) {
      console.error('WebSocket message error:', e);
    }
  });
  
  // 清理
  socket.on('close', () => {
    clients.delete(clientKey);
    
    // 通知对方玩家已断开
    const opponentKey = isHost 
      ? `${roomId}:${room.guestId}` 
      : `${roomId}:${room.hostId}`;
    const opponentSocket = clients.get(opponentKey);
    
    if (opponentSocket) {
      sendWebSocketMessage(opponentSocket, { type: 'opponent-disconnected' });
    }
    
    // 清理房间中的玩家
    if (room) {
      if (isHost) {
        room.hostId = null;
        room.hostRole = null;
        if (!room.guestId) {
          rooms.delete(roomId);
        }
      } else {
        room.guestId = null;
        room.guestRole = null;
        if (!room.hostId) {
          rooms.delete(roomId);
        }
      }
    }
  });
});

// 解析WebSocket帧
function parseWebSocketFrame(buffer, socket) {
  if (buffer.length < 2) return null;
  
  const fin = (buffer[0] & 0x80) === 0x80;
  const opcode = buffer[0] & 0x0f;
  const masked = (buffer[1] & 0x80) === 0x80;
  let payloadLength = buffer[1] & 0x7f;
  
  // 处理控制帧
  // 0x08: Close frame
  if (opcode === 0x08) {
    // 发送关闭帧响应
    if (socket && !socket.destroyed) {
      socket.write(Buffer.from([0x88, 0x00]));
    }
    return null;
  }
  
  // 0x09: Ping frame - 回复 Pong
  if (opcode === 0x09) {
    if (socket && !socket.destroyed) {
      socket.write(Buffer.from([0x8A, 0x00]));
    }
    return null;
  }
  
  // 0x0A: Pong frame - 忽略
  if (opcode === 0x0A) {
    return null;
  }
  
  // 只处理文本帧 (0x01) 和二进制帧 (0x02)
  if (opcode !== 0x01 && opcode !== 0x02) {
    return null;
  }
  
  let offset = 2;
  
  if (payloadLength === 126) {
    payloadLength = buffer.readUInt16BE(2);
    offset = 4;
  } else if (payloadLength === 127) {
    payloadLength = buffer.readUInt32BE(2) * 0x100000000 + buffer.readUInt32BE(6);
    offset = 10;
  }
  
  let maskingKey;
  if (masked) {
    maskingKey = buffer.slice(offset, offset + 4);
    offset += 4;
  }
  
  const payload = buffer.slice(offset, offset + payloadLength);
  
  if (masked) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskingKey[i % 4];
    }
  }
  
  return payload.toString('utf8');
}

// 发送WebSocket消息
function sendWebSocketMessage(socket, data) {
  const message = JSON.stringify(data);
  const length = Buffer.byteLength(message);
  
  let frame;
  if (length < 126) {
    frame = Buffer.allocUnsafe(2 + length);
    frame[0] = 0x81;
    frame[1] = length;
    frame.write(message, 2);
  } else if (length < 65536) {
    frame = Buffer.allocUnsafe(4 + length);
    frame[0] = 0x81;
    frame[1] = 126;
    frame.writeUInt16BE(length, 2);
    frame.write(message, 4);
  } else {
    frame = Buffer.allocUnsafe(10 + length);
    frame[0] = 0x81;
    frame[1] = 127;
    frame.writeUInt32BE(0, 2);
    frame.writeUInt32BE(length, 6);
    frame.write(message, 10);
  }
  
  socket.write(frame);
}

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
