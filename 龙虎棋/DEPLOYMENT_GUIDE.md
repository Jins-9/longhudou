# 龙虎斗 - 在线对战部署指南

## 项目结构

```
/mnt/okcomputer/output/
├── app/                    # 前端 React 项目
│   ├── src/
│   ├── dist/              # 构建输出
│   └── package.json
├── server/                # 后端 Node.js 项目
│   ├── server.js          # 主服务器文件
│   └── package.json
└── DEPLOYMENT_GUIDE.md    # 本文件
```

---

## 方案一：本地测试（同一局域网）

### 1. 启动后端服务器

```bash
cd /mnt/okcomputer/output/server
node server.js
```

服务器将在 `http://localhost:3001` 运行

### 2. 启动前端开发服务器

```bash
cd /mnt/okcomputer/output/app
npm run dev
```

前端将在 `http://localhost:5173` 运行

### 3. 修改前端配置

编辑 `app/src/hooks/useMultiplayer.ts`：

```typescript
// 改为你的局域网IP
const SERVER_URL = 'http://192.168.1.xxx:3001';
```

### 4. 同一Wi-Fi下对战

- 设备A访问 `http://192.168.1.xxx:5173`
- 设备B访问 `http://192.168.1.xxx:5173`
- 创建房间 → 分享房间号 → 加入房间 → 开始游戏

---

## 方案二：部署到云服务器（推荐）

### 使用 Docker 部署

#### 1. 创建 Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制后端文件
COPY server/package.json ./
RUN npm install

COPY server/server.js ./

EXPOSE 3001

CMD ["node", "server.js"]
```

#### 2. 构建并运行

```bash
# 构建镜像
docker build -t dragon-tiger-server .

# 运行容器
docker run -d -p 3001:3001 --name dragon-tiger-server dragon-tiger-server
```

---

## 方案三：使用免费 PaaS 平台

### Railway（推荐免费方案）

1. 注册 [Railway](https://railway.app)
2. 创建新项目 → 从 GitHub 部署
3. 添加环境变量 `PORT=3001`
4. 部署后会获得公网URL，如 `https://dragon-tiger-server.up.railway.app`

### Render

1. 注册 [Render](https://render.com)
2. 创建 Web Service
3. 选择 Node.js 运行时
4. 设置启动命令 `node server.js`

### Fly.io

```bash
# 安装 flyctl
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 创建应用
cd server
fly launch

# 部署
fly deploy
```

---

## 方案四：使用 Vercel + 第三方实时服务

如果不想自己维护后端，可以使用第三方实时数据库服务：

### 使用 Firebase Realtime Database

```javascript
// 替换 useMultiplayer.ts 中的实现
import { getDatabase, ref, set, onValue } from 'firebase/database';

// 使用 Firebase 同步游戏状态
```

### 使用 Supabase Realtime

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('url', 'key');

// 使用 Supabase 频道同步游戏状态
```

---

## 部署后的前端配置

部署后端后，修改 `app/src/hooks/useMultiplayer.ts`：

```typescript
// 你的后端服务器地址
const SERVER_URL = 'https://your-server-domain.com';
```

然后重新构建并部署前端。

---

## 快速测试

### 测试后端API

```bash
# 健康检查
curl https://your-server-domain.com/api/health

# 创建房间
curl -X POST https://your-server-domain.com/api/create-room \
  -H "Content-Type: application/json" \
  -d '{"playerId":"test123","role":"dragon"}'
```

---

## 常见问题

### Q: 前端无法连接后端
A: 检查 CORS 配置，确保后端允许前端域名访问

### Q: WebSocket 连接失败
A: 确保服务器支持 WebSocket 升级，检查防火墙设置

### Q: 房间数据丢失
A: 当前使用内存存储，重启服务器会清空数据。生产环境建议使用 Redis

---

## 生产环境优化建议

1. **使用 Redis 存储房间数据**
2. **添加房间过期清理机制**
3. **实现玩家断线重连**
4. **添加游戏日志和统计**
5. **使用 HTTPS + WSS**
6. **添加 Rate Limiting 防止滥用**

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `server/server.js` | Node.js 后端服务，包含 HTTP API 和 WebSocket |
| `app/src/hooks/useMultiplayer.ts` | 前端多人对战逻辑 |
| `app/src/App.tsx` | 前端主应用 |

---

## 当前部署状态

- ✅ 前端已部署：https://ng2kcwkmyleao.ok.kimi.link
- ⚠️ 后端需要单独部署到支持 Node.js 的服务器
- 💡 建议使用 Railway 或 Render 免费部署后端
