#!/bin/bash
# NAS环境监控脚本
# 监控服务状态、资源使用情况和数据库健康状态

set -e

# 配置变量
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.nas.yml}"
BACKEND_PORT="${BACKEND_PORT:-18080}"
LOG_FILE="${LOG_FILE:-/volume1/docker/wechat-fortune-draw/logs/monitor.log}"
ALERT_EMAIL="${ALERT_EMAIL:-}"  # 可选：告警邮箱地址

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 日志函数
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 检查服务状态
check_service_status() {
    log_message "🔍 检查服务状态..."
    
    # 检查容器是否运行
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_message "✅ Docker容器运行正常"
    else
        log_message "❌ Docker容器未运行"
        return 1
    fi
    
    # 检查API健康状态
    if curl -s -f "http://localhost:$BACKEND_PORT/api/health" > /dev/null; then
        log_message "✅ API服务响应正常"
    else
        log_message "❌ API服务无响应"
        return 1
    fi
}

# 检查资源使用情况
check_resource_usage() {
    log_message "📊 检查资源使用情况..."
    
    # 获取容器资源使用情况
    CONTAINER_STATS=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep fortune-backend)
    
    if [ -n "$CONTAINER_STATS" ]; then
        log_message "📈 容器资源使用: $CONTAINER_STATS"
        
        # 提取CPU和内存使用率
        CPU_USAGE=$(echo "$CONTAINER_STATS" | awk '{print $2}' | sed 's/%//')
        MEM_USAGE=$(echo "$CONTAINER_STATS" | awk '{print $3}' | sed 's/MiB//')
        
        # 检查是否超过阈值
        if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
            log_message "⚠️  CPU使用率过高: ${CPU_USAGE}%"
        fi
        
        if (( $(echo "$MEM_USAGE > 800" | bc -l) )); then
            log_message "⚠️  内存使用量过高: ${MEM_USAGE}MiB"
        fi
    else
        log_message "❌ 无法获取容器资源使用情况"
        return 1
    fi
}

# 检查数据库状态
check_database_status() {
    log_message "🗄️  检查数据库状态..."
    
    # 通过API检查数据库连接
    DB_STATUS=$(curl -s "http://localhost:$BACKEND_PORT/api/health" | grep -o '"database":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$DB_STATUS" = "connected" ]; then
        log_message "✅ 数据库连接正常"
    else
        log_message "❌ 数据库连接异常: $DB_STATUS"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    log_message "💾 检查磁盘空间..."
    
    DATA_DIR="/volume1/docker/wechat-fortune-draw"
    DISK_USAGE=$(df -h "$DATA_DIR" | tail -1 | awk '{print $5}' | sed 's/%//')
    
    log_message "📊 数据目录磁盘使用率: ${DISK_USAGE}%"
    
    if (( DISK_USAGE > 85 )); then
        log_message "⚠️  磁盘空间不足，使用率: ${DISK_USAGE}%"
        return 1
    fi
}

# 发送告警（如果配置了邮箱）
send_alert() {
    local message="$1"
    
    if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "微信抽签应用告警" "$ALERT_EMAIL"
        log_message "📧 告警邮件已发送到: $ALERT_EMAIL"
    fi
}

# 主监控流程
main() {
    log_message "🚀 开始系统监控检查..."
    
    local errors=0
    
    # 执行各项检查
    check_service_status || ((errors++))
    check_resource_usage || ((errors++))
    check_database_status || ((errors++))
    check_disk_space || ((errors++))
    
    # 汇总结果
    if [ $errors -eq 0 ]; then
        log_message "🎉 所有检查项目正常"
    else
        local alert_msg="微信抽签应用监控发现 $errors 个问题，请检查日志: $LOG_FILE"
        log_message "⚠️  发现 $errors 个问题"
        send_alert "$alert_msg"
    fi
    
    log_message "📋 监控检查完成"
    echo "---" >> "$LOG_FILE"
}

# 执行监控
main