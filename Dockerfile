# 第一阶段：构建
FROM node:20-alpine as builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 第二阶段：运行时
FROM node:20-alpine as runtime

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --omit=dev

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "server/server.js"]
