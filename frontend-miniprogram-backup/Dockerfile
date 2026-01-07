# 微信小程序新年抽签应用前端 - Docker镜像
# 部署已编译的微信小程序代码

# 使用轻量级Nginx镜像
FROM nginx:alpine

# 安装基础工具
RUN apk add --no-cache curl

# 创建非root用户
RUN addgroup -g 1001 -S nginx || true && \
    adduser -S nginx -u 1001 -G nginx || true

# 删除默认nginx配置
RUN rm /etc/nginx/conf.d/default.conf

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制已编译的微信小程序代码
COPY --chown=nginx:nginx dist/build/mp-weixin /usr/share/nginx/html

# 设置权限
RUN chown -R nginx:nginx /usr/share/nginx/html /var/log/nginx /var/cache/nginx

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# 启动nginx（使用root用户以避免权限问题）
CMD ["nginx", "-g", "daemon off;"]
