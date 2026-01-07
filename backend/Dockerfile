# 微信小程序新年抽签应用后端 - Docker镜像
# 多阶段构建：构建阶段 + 运行阶段

# ================================
# 构建阶段 - Build Stage
# ================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖（包括Python和make，用于编译sqlite3）
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    sqlite-dev

# 复制package文件
COPY package*.json ./

# 安装依赖（包括开发依赖，用于构建）
RUN npm install --silent

# 复制源代码
COPY . .

# 构建TypeScript项目
RUN npm run build

# ================================
# 运行阶段 - Runtime Stage
# ================================
FROM node:18-alpine AS runtime

# 设置标签信息
LABEL maintainer="Fortune Draw Team"
LABEL description="微信小程序新年抽签应用后端API服务"
LABEL version="1.0.0"

# 创建非root用户以提高安全性
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 安装运行时依赖
RUN apk add --no-cache \
    sqlite \
    dumb-init \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 从构建阶段复制构建产物
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 创建数据目录并设置权限
RUN mkdir -p /app/data && \
    chown -R nodejs:nodejs /app/data

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/fortune.db

# 健康检查配置
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    const options = { host: 'localhost', port: process.env.PORT || 3000, path: '/api/health', timeout: 2000 }; \
    const req = http.request(options, (res) => { \
        if (res.statusCode === 200) { process.exit(0); } else { process.exit(1); } \
    }); \
    req.on('error', () => process.exit(1)); \
    req.on('timeout', () => process.exit(1)); \
    req.end();"

# 数据卷挂载点
VOLUME ["/app/data"]

# 使用dumb-init作为PID 1，处理信号和僵尸进程
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "dist/index.js"]