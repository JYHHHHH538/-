FROM node:18-alpine

WORKDIR /app

# 复制backend的package.json
COPY backend/package*.json ./backend/

# 安装依赖
RUN cd backend && npm install --production

# 复制所有文件
COPY . .

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "backend/server.js"]
