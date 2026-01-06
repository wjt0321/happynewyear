#!/bin/bash

# 健康检查和监控脚本
# 用于监控服务状态并发送告警

set -e

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/health-check.log"

# 服务配置
SERVICE_URL="http://localhost:3000"
HEALTH_ENDPOINT="/api/health"
FORTUNE_ENDPOINT="/api/fortune"

# 告警配置
MAX_RESPONSE_TIME=5000  # 最大响应时间（毫秒）
MAX_FAILURES=3          # 最大连续失败次数
FAILURE_COUNT_FILE="/tmp/fortune-health-failures"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日志函数
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        *)
            echo "[$level] $message"
            ;;
    esac
}

# 获取失败计数
get_failure_count() {
    if [ -f "$FAILURE_COUNT_FILE" ]; then
        cat "$FAILURE_COUNT_FILE"
    else
        echo "0"
    fi
}

# 设置失败计数
set_failure_count() {
    echo "$1" > "$FAILURE_COUNT_FILE"
}

# 重置失败计数
reset_failure_count() {
    rm -f "$FAILURE_COUNT_FILE"
}

# HTTP健康检查
check_http_health() {
    local url="$SERVICE_URL$HEALTH_ENDPOINT"
    local start_time=$(date +%s%3N)
    
    log "INFO" "检查HTTP健康状态: $url"
    
    # 发送HTTP请求
    local response=$(curl -s -w "%{http_code}|%{time_total}" -o /tmp/health_response "$url" 2>/dev/null || echo "000|0")
    local http_code=$(echo "$response" | cut -d'|' -f1)
    local response_time=$(echo "$response" | cut -d'|' -f2)
    local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d'.' -f1)
    
    # 检查HTTP状态码
    if [ "$http_code" != "200" ]; then
        log "ERROR" "HTTP健康检查失败: HTTP $http_code"
        return 1
    fi
    
    # 检查响应时间
    if [ "$response_time_ms" -gt "$MAX_RESPONSE_TIME" ]; then
        log "WARN" "响应时间过长: ${response_time_ms}ms (阈值: ${MAX_RESPONSE_TIME}ms)"
    else
        log "INFO" "响应时间正常: ${response_time_ms}ms"
    fi
    
    # 检查响应内容
    if [ -f "/tmp/health_response" ]; then
        local status=$(cat /tmp/health_response | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$status" = "ok" ]; then
            log "INFO" "服务状态正常"
            return 0
        else
            log "ERROR" "服务状态异常: $status"
            return 1
        fi
    else
        log "ERROR" "无法读取健康检查响应"
        return 1
    fi
}

# 功能测试
check_fortune_api() {
    local url="$SERVICE_URL$FORTUNE_ENDPOINT"
    
    log "INFO" "测试抽签API功能: $url"
    
    # 构造测试请求
    local test_data='{"openid":"test_health_check_user"}'
    local response=$(curl -s -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$test_data" \
        -o /tmp/fortune_response \
        "$url" 2>/dev/null || echo "000")
    
    # 检查HTTP状态码
    if [ "$response" != "200" ] && [ "$response" != "400" ]; then
        log "ERROR" "抽签API测试失败: HTTP $response"
        return 1
    fi
    
    # 检查响应格式
    if [ -f "/tmp/fortune_response" ]; then
        if grep -q '"success"' /tmp/fortune_response; then
            log "INFO" "抽签API功能正常"
            return 0
        else
            log "ERROR" "抽签API响应格式异常"
            return 1
        fi
    else
        log "ERROR" "无法读取抽签API响应"
        return 1
    fi
}

# Docker容器检查
check_docker_containers() {
    log "INFO" "检查Docker容器状态..."
    
    # 检查后端容器
    local backend_status=$(docker ps --filter "name=fortune-backend" --format "{{.Status}}" 2>/dev/null || echo "")
    
    if [ -z "$backend_status" ]; then
        log "ERROR" "后端容器未运行"
        return 1
    elif echo "$backend_status" | grep -q "Up"; then
        log "INFO" "后端容器运行正常: $backend_status"
    else
        log "ERROR" "后端容器状态异常: $backend_status"
        return 1
    fi
    
    return 0
}

# 数据库检查
check_database() {
    log "INFO" "检查数据库连接..."
    
    # 通过健康检查接口验证数据库连接
    local url="$SERVICE_URL$HEALTH_ENDPOINT"
    local response=$(curl -s "$url" 2>/dev/null || echo "")
    
    if echo "$response" | grep -q '"database":"connected"'; then
        log "INFO" "数据库连接正常"
        return 0
    else
        log "ERROR" "数据库连接异常"
        return 1
    fi
}

# 系统资源检查
check_system_resources() {
    log "INFO" "检查系统资源使用情况..."
    
    # 检查内存使用率
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    log "INFO" "内存使用率: ${memory_usage}%"
    
    if (( $(echo "$memory_usage > 90" | bc -l) )); then
        log "WARN" "内存使用率过高: ${memory_usage}%"
    fi
    
    # 检查磁盘使用率
    local disk_usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}' | sed 's/%//')
    log "INFO" "磁盘使用率: ${disk_usage}%"
    
    if [ "$disk_usage" -gt 85 ]; then
        log "WARN" "磁盘使用率过高: ${disk_usage}%"
    fi
    
    # 检查Docker资源使用
    if command -v docker &> /dev/null; then
        local container_stats=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | grep fortune || echo "")
        if [ -n "$container_stats" ]; then
            log "INFO" "容器资源使用情况:"
            echo "$container_stats" | while read line; do
                log "INFO" "  $line"
            done
        fi
    fi
}

# 发送告警通知
send_alert() {
    local message="$1"
    local severity="$2"
    
    log "ERROR" "发送告警: $message"
    
    # 这里可以集成各种告警方式
    # 例如：邮件、Slack、钉钉、企业微信等
    
    # 示例：写入告警日志
    local alert_file="$PROJECT_ROOT/logs/alerts.log"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$severity] $message" >> "$alert_file"
    
    # 示例：系统通知（如果是桌面环境）
    if command -v notify-send &> /dev/null; then
        notify-send "Fortune Draw Alert" "$message" -u critical
    fi
}

# 执行完整健康检查
run_health_check() {
    local failed=false
    local failure_count=$(get_failure_count)
    
    log "INFO" "开始健康检查..."
    log "INFO" "当前连续失败次数: $failure_count"
    
    # HTTP健康检查
    if ! check_http_health; then
        failed=true
    fi
    
    # 功能测试
    if ! check_fortune_api; then
        failed=true
    fi
    
    # Docker容器检查
    if ! check_docker_containers; then
        failed=true
    fi
    
    # 数据库检查
    if ! check_database; then
        failed=true
    fi
    
    # 系统资源检查
    check_system_resources
    
    # 处理检查结果
    if [ "$failed" = true ]; then
        failure_count=$((failure_count + 1))
        set_failure_count "$failure_count"
        
        log "ERROR" "健康检查失败 (连续失败: $failure_count/$MAX_FAILURES)"
        
        if [ "$failure_count" -ge "$MAX_FAILURES" ]; then
            send_alert "Fortune Draw服务连续${failure_count}次健康检查失败，请立即检查！" "CRITICAL"
        fi
        
        return 1
    else
        reset_failure_count
        log "INFO" "健康检查通过"
        return 0
    fi
}

# 显示服务状态
show_status() {
    log "INFO" "=== 服务状态报告 ==="
    
    # Docker容器状态
    echo ""
    log "INFO" "Docker容器状态:"
    docker ps --filter "name=fortune" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || log "WARN" "无法获取Docker容器信息"
    
    # 服务响应测试
    echo ""
    log "INFO" "服务响应测试:"
    if curl -s "$SERVICE_URL$HEALTH_ENDPOINT" > /dev/null; then
        log "INFO" "✓ 健康检查接口正常"
    else
        log "ERROR" "✗ 健康检查接口异常"
    fi
    
    # 系统资源
    echo ""
    check_system_resources
    
    # 最近日志
    echo ""
    log "INFO" "最近的应用日志:"
    if [ -f "$PROJECT_ROOT/logs/app.log" ]; then
        tail -n 10 "$PROJECT_ROOT/logs/app.log"
    else
        log "WARN" "应用日志文件不存在"
    fi
}

# 显示帮助信息
show_help() {
    cat << EOF
健康检查和监控脚本

用法: $0 [命令]

命令:
    check       执行完整健康检查
    status      显示服务状态报告
    monitor     持续监控模式 (每分钟检查一次)
    help        显示帮助信息

示例:
    $0 check                    # 执行一次健康检查
    $0 status                   # 显示服务状态
    $0 monitor                  # 启动持续监控

配置:
    - 服务URL: $SERVICE_URL
    - 最大响应时间: ${MAX_RESPONSE_TIME}ms
    - 最大连续失败次数: $MAX_FAILURES
    - 日志文件: $LOG_FILE

EOF
}

# 持续监控模式
monitor_mode() {
    log "INFO" "启动持续监控模式 (按Ctrl+C停止)"
    
    while true; do
        run_health_check
        log "INFO" "等待60秒后进行下次检查..."
        sleep 60
    done
}

# 主程序
case ${1:-check} in
    "check")
        run_health_check
        ;;
    "status")
        show_status
        ;;
    "monitor")
        monitor_mode
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log "ERROR" "未知命令: $1"
        show_help
        exit 1
        ;;
esac