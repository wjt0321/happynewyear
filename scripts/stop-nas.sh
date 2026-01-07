#!/bin/bash

# 微信小程序新年抽签应用 - NAS环境停止脚本

set -e

echo "🛑 停止微信小程序新年抽签应用 - NAS环境"

# 停止并移除容器
echo "📦 停止Docker容器..."
docker-compose -f docker-compose.nas.yml down --remove-orphans

# 清理未使用的镜像（可选）
read -p "是否清理未使用的Docker镜像？(y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 清理未使用的Docker镜像..."
    docker image prune -f
fi

echo "✅ NAS环境已停止"