#!/bin/bash

# 微信小程序新年抽签应用 - 自动化部署脚本
# 支持开发环境和生产环境部署，包含健康检查和回滚机制

set -e  # 遇到错误立即退出

# ================================
# 配置变量
# ================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/logs/deploy.log"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ================================
# 工具函数
# ================================

# 日志函数
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 创建日志目录
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # 写入日志文件
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # 控制台输出
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
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
        *)
            echo "[$level] $message"
            ;;
    esac
}

# 错误处理函数
error_exit() {
    log "ERROR" "$1"
    exit 1
}

# 检查命令是否存在
check_command() {
    if ! command -v "$1" &> /dev/null; then
        error_exit "命令 '$1' 未找到，请先安装"
    fi
}

# 检查Docker服务状态
check_docker() {
    log "INFO" "检查Docker服务状态..."
    
    if ! docker info &> /dev/null; then
        error_exit "Docker服务未运行，请启动Docker服务"
    fi
    
    if ! docker-compose --version &> /dev/null; then
        error_exit "docker-compose未安装，请先安装docker-compose"
    fi
    
    log "INFO" "Docker服务检查通过"
}

# 创建备份
create_backup() {
    local env=$1
    log "INFO" "创建数据备份..."
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库文件
    local backup_name="fortune-backup-$(date +%Y%m%d-%H%M%S)"
    local data_path="$PROJECT_ROOT/data"
    
    if [ -d "$data_path" ]; then
        tar -czf "$BACKUP_DIR/$backup_name.tar.gz" -C "$PROJECT_ROOT" data/
        log "INFO" "数据备份已创建: $backup_name.tar.gz"
        
        # 保留最近5个备份
        cd "$BACKUP_DIR"
        ls -t fortune-backup-*.tar.gz | tail -n +6 | xargs -r rm --
        log "INFO" "清理旧备份文件完成"
    else
        log "WARN" "数据目录不存在，跳过备份"
    fi
}

# 健康检查
health_check() {
    local max_attempts=30
    local attempt=1
    local service_url="http://localhost:3000/api/health"
    
    log "INFO" "开始健康检查..."
    
    while [ $attempt -le $max_attempts ]; do
        log "DEBUG" "健康检查尝试 $attempt/$max_attempts"
        
        if curl -f -s "$service_url" > /dev/null 2>&1; then
            log "INFO" "健康检查通过！服务正常运行"
            return 0
        fi
        
        sleep 2
        ((attempt++))
    done
    
    log "ERROR" "健康检查失败！服务可能未正常启动"
    return 1
}

# 回滚函数
rollback() {
    log "WARN" "开始回滚操作..."
    
    # 停止当前服务
    docker-compose down
    
    # 恢复最新备份
    local latest_backup=$(ls -t "$BACKUP_DIR"/fortune-backup-*.tar.gz 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        log "INFO" "恢复备份: $(basename "$latest_backup")"
        tar -xzf "$latest_backup" -C "$PROJECT_ROOT"
        log "INFO" "备份恢复完成"
    else
        log "WARN" "未找到备份文件，无法自动恢复数据"
    fi
    
    log "WARN" "回滚完成，请手动检查服务状态"
}

# 部署函数
deploy() {
    local env=${1:-"dev"}
    local compose_file=""
    
    log "INFO" "开始部署到 $env 环境..."
    
    # 选择对应的compose文件
    case $env in
        "dev"|"development")
            compose_file="docker-compose.dev.yml"
            ;;
        "prod"|"production")
            compose_file="docker-compose.prod.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    # 检查compose文件是否存在
    if [ ! -f "$PROJECT_ROOT/$compose_file" ]; then
        error_exit "Docker Compose文件不存在: $compose_file"
    fi
    
    log "INFO" "使用配置文件: $compose_file"
    
    # 切换到项目根目录
    cd "$PROJECT_ROOT"
    
    # 创建必要的目录
    mkdir -p data logs
    
    # 检查环境变量文件
    if [ ! -f ".env" ] && [ -f ".env.docker" ]; then
        log "INFO" "复制环境变量模板文件..."
        cp .env.docker .env
        log "WARN" "请检查并修改 .env 文件中的配置"
    fi
    
    # 创建备份
    create_backup "$env"
    
    # 构建并启动服务
    log "INFO" "构建Docker镜像..."
    docker-compose -f "$compose_file" build --no-cache
    
    log "INFO" "启动服务..."
    docker-compose -f "$compose_file" up -d
    
    # 等待服务启动
    log "INFO" "等待服务启动..."
    sleep 10
    
    # 健康检查
    if health_check; then
        log "INFO" "部署成功！服务已正常运行"
        
        # 显示服务状态
        docker-compose -f "$compose_file" ps
        
        # 显示日志
        log "INFO" "最近的服务日志:"
        docker-compose -f "$compose_file" logs --tail=20
        
    else
        log "ERROR" "部署失败！开始回滚..."
        rollback
        exit 1
    fi
}

# 停止服务
stop_service() {
    local env=${1:-"dev"}
    local compose_file=""
    
    case $env in
        "dev"|"development")
            compose_file="docker-compose.dev.yml"
            ;;
        "prod"|"production")
            compose_file="docker-compose.prod.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    log "INFO" "停止 $env 环境服务..."
    cd "$PROJECT_ROOT"
    docker-compose -f "$compose_file" down
    log "INFO" "服务已停止"
}

# 查看服务状态
status() {
    local env=${1:-"dev"}
    local compose_file=""
    
    case $env in
        "dev"|"development")
            compose_file="docker-compose.dev.yml"
            ;;
        "prod"|"production")
            compose_file="docker-compose.prod.yml"
            ;;
        *)
            compose_file="docker-compose.yml"
            ;;
    esac
    
    cd "$PROJECT_ROOT"
    
    log "INFO" "服务状态 ($env 环境):"
    docker-compose -f "$compose_file" ps
    
    log "INFO" "最近日志:"
    docker-compose -f "$compose_file" logs --tail=20
}

# 清理函数
cleanup() {
    log "INFO" "清理Docker资源..."
    
    # 清理未使用的镜像
    docker image prune -f
    
    # 清理未使用的容器
    docker container prune -f
    
    # 清理未使用的网络
    docker network prune -f
    
    log "INFO" "清理完成"
}

# 显示帮助信息
show_help() {
    cat << EOF
微信小程序新年抽签应用 - 部署脚本

用法: $0 [命令] [环境]

命令:
    deploy [env]    部署应用 (默认: dev)
    stop [env]      停止服务 (默认: dev)
    status [env]    查看状态 (默认: dev)
    cleanup         清理Docker资源
    help            显示帮助信息

环境:
    dev             开发环境 (默认)
    prod            生产环境

示例:
    $0 deploy dev           # 部署到开发环境
    $0 deploy prod          # 部署到生产环境
    $0 stop prod            # 停止生产环境服务
    $0 status               # 查看开发环境状态
    $0 cleanup              # 清理Docker资源

注意:
    - 生产环境部署需要配置 TUNNEL_TOKEN 环境变量
    - 首次部署前请检查并修改 .env 文件
    - 部署前会自动创建数据备份
    - 部署失败时会自动回滚

EOF
}

# ================================
# 主程序
# ================================

# 检查参数
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

# 检查必要的命令
check_command "docker"
check_command "docker-compose"
check_command "curl"

# 检查Docker服务
check_docker

# 解析命令
case $1 in
    "deploy")
        deploy "${2:-dev}"
        ;;
    "stop")
        stop_service "${2:-dev}"
        ;;
    "status")
        status "${2:-dev}"
        ;;
    "cleanup")
        cleanup
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