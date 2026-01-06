#!/bin/bash

# NAS环境配置测试脚本

set -e

echo "🧪 测试NAS环境配置..."

# 测试函数
test_port() {
    local port=$1
    local service=$2
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "⚠️  端口 $port ($service) 已被占用"
        return 1
    else
        echo "✅ 端口 $port ($service) 可用"
        return 0
    fi
}

test_file() {
    local file=$1
    local desc=$2
    
    if [ -f "$file" ]; then
        echo "✅ 文件存在: $file ($desc)"
        return 0
    else
        echo "❌ 文件不存在: $file ($desc)"
        return 1
    fi
}

# 开始测试
echo "==================== 系统环境检查 ===================="

# 检查Docker
if command -v docker &> /dev/null; then
    echo "✅ Docker 已安装"
else
    echo "❌ Docker 未安装"
fi

if command -v docker-compose &> /dev/null; then
    echo "✅ Docker Compose 已安装"
else
    echo "❌ Docker Compose 未安装"
fi

echo ""
echo "==================== 端口可用性检查 ===================="

test_port 18080 "后端API服务"
test_port 18081 "前端服务"
test_port 18082 "数据库管理"

echo ""
echo "==================== 配置文件检查 ===================="

test_file ".env.nas" "NAS环境变量文件"
test_file "docker-compose.nas.yml" "NAS Docker Compose配置"
test_file "frontend/.env.nas" "前端NAS配置"
test_file "scripts/start-nas.sh" "NAS启动脚本"
test_file "scripts/stop-nas.sh" "NAS停止脚本"

echo ""
echo "==================== 测试完成 ===================="