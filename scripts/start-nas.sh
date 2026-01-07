#!/bin/bash

# 微信小程序新年抽签应用 - NAS环境启动脚本
# 适用于群晖NAS或其他Debian NAS系统

set -e

echo "🚀 启动微信小程序新年抽签应用 - NAS环境"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误：Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 设置NAS数据目录
NAS_BASE_DIR="/volume1/docker/wechat-fortune-draw"
DATA_DIR="${NAS_BASE_DIR}/data"
LOGS_DIR="${NAS_BASE_DIR}/logs"

echo "📁 创建NAS数据目录..."
mkdir -p "$DATA_DIR"
mkdir -p "$LOGS_DIR"

# 设置目录权限
echo "🔐 设置目录权限..."
chmod 755 "$NAS_BASE_DIR"
chmod 755 "$DATA_DIR"
chmod 755 "$LOGS_DIR"

# 停止现有容器（如果存在）
echo "🛑 停止现有容器..."
docker-compose -f docker-compose.nas.yml down --remove-orphans 2>/dev/null || true

# 构建并启动服务
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.nas.yml build --no-cache

echo "🚀 启动NAS服务..."
docker-compose -f docker-compose.nas.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 健康检查
echo "🏥 执行健康检查..."
if curl -f http://localhost:18080/api/health >/dev/null 2>&1; then
    echo "✅ 后端服务启动成功"
else
    echo "❌ 后端服务启动失败，请检查日志"
    docker-compose -f docker-compose.nas.yml logs fortune-backend
    exit 1
fi

# 显示服务信息
echo ""
echo "🎉 NAS环境启动成功！"
echo ""
echo "📊 服务访问地址："
echo "   后端API服务: http://localhost:18080"
echo "   健康检查:   http://localhost:18080/api/health"
echo "   抽签接口:   http://localhost:18080/api/fortune"
echo "   数据库管理: http://localhost:18082"
echo ""
echo "📁 数据存储位置："
echo "   数据库文件: $DATA_DIR/fortune.db"
echo "   日志文件:   $LOGS_DIR/"
echo ""
echo "🔧 管理命令："
echo "   查看日志:   docker-compose -f docker-compose.nas.yml logs -f"
echo "   停止服务:   docker-compose -f docker-compose.nas.yml down"
echo "   重启服务:   docker-compose -f docker-compose.nas.yml restart"