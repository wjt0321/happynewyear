#!/bin/bash
# NAS环境数据备份脚本
# 用于定期备份微信抽签应用的数据

set -e

# 配置变量
BACKUP_DIR="${BACKUP_DIR:-/volume1/docker/wechat-fortune-draw/backups}"
DATA_DIR="${DATA_DIR:-/volume1/docker/wechat-fortune-draw/data}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.nas.yml}"
MAX_BACKUPS="${MAX_BACKUPS:-7}"  # 保留最近7个备份

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名（包含时间戳）
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/fortune-backup-$TIMESTAMP.tar.gz"

echo "🔄 开始备份微信抽签应用数据..."
echo "📁 数据目录: $DATA_DIR"
echo "💾 备份文件: $BACKUP_FILE"

# 停止服务（可选，确保数据一致性）
if [ "${STOP_SERVICE:-false}" = "true" ]; then
    echo "⏸️  正在停止服务以确保数据一致性..."
    docker-compose -f "$COMPOSE_FILE" stop fortune-backend
fi

# 创建备份
echo "📦 正在创建备份文件..."
tar -czf "$BACKUP_FILE" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"

# 重启服务（如果之前停止了）
if [ "${STOP_SERVICE:-false}" = "true" ]; then
    echo "▶️  正在重启服务..."
    docker-compose -f "$COMPOSE_FILE" start fortune-backend
fi

# 验证备份文件
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ 备份创建成功！文件大小: $BACKUP_SIZE"
else
    echo "❌ 备份创建失败！"
    exit 1
fi

# 清理旧备份（保留最近的N个）
echo "🧹 清理旧备份文件..."
cd "$BACKUP_DIR"
ls -t fortune-backup-*.tar.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f
REMAINING_BACKUPS=$(ls -1 fortune-backup-*.tar.gz 2>/dev/null | wc -l)
echo "📊 当前保留备份数量: $REMAINING_BACKUPS"

echo "🎉 备份任务完成！"