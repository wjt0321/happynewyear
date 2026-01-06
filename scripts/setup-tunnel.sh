#!/bin/bash

# Cloudflare Tunnel 设置脚本
# 用于配置HTTPS域名访问

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    local level=$1
    shift
    local message="$*"
    
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

# 检查cloudflared是否安装
check_cloudflared() {
    if ! command -v cloudflared &> /dev/null; then
        log "WARN" "cloudflared 未安装，开始安装..."
        install_cloudflared
    else
        log "INFO" "cloudflared 已安装: $(cloudflared --version)"
    fi
}

# 安装cloudflared
install_cloudflared() {
    log "INFO" "正在安装 cloudflared..."
    
    # 检测系统架构
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            ARCH="amd64"
            ;;
        aarch64|arm64)
            ARCH="arm64"
            ;;
        armv7l)
            ARCH="arm"
            ;;
        *)
            log "ERROR" "不支持的系统架构: $ARCH"
            exit 1
            ;;
    esac
    
    # 下载并安装
    DOWNLOAD_URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}"
    
    curl -L "$DOWNLOAD_URL" -o cloudflared
    chmod +x cloudflared
    sudo mv cloudflared /usr/local/bin/
    
    log "INFO" "cloudflared 安装完成"
}

# 登录Cloudflare
login_cloudflare() {
    log "INFO" "请在浏览器中完成Cloudflare登录..."
    cloudflared tunnel login
    log "INFO" "Cloudflare登录完成"
}

# 创建tunnel
create_tunnel() {
    local tunnel_name=${1:-"fortune-draw-tunnel"}
    
    log "INFO" "创建Cloudflare Tunnel: $tunnel_name"
    
    # 检查tunnel是否已存在
    if cloudflared tunnel list | grep -q "$tunnel_name"; then
        log "WARN" "Tunnel '$tunnel_name' 已存在"
        return 0
    fi
    
    # 创建新tunnel
    cloudflared tunnel create "$tunnel_name"
    log "INFO" "Tunnel '$tunnel_name' 创建成功"
}

# 配置tunnel
configure_tunnel() {
    local tunnel_name=${1:-"fortune-draw-tunnel"}
    local domain=$2
    
    if [ -z "$domain" ]; then
        log "ERROR" "请提供域名参数"
        exit 1
    fi
    
    log "INFO" "配置Tunnel路由: $domain -> http://fortune-backend:3000"
    
    # 创建配置文件
    local config_file="$HOME/.cloudflared/config.yml"
    
    cat > "$config_file" << EOF
tunnel: $tunnel_name
credentials-file: $HOME/.cloudflared/$tunnel_name.json

ingress:
  - hostname: $domain
    service: http://fortune-backend:3000
    originRequest:
      httpHostHeader: $domain
      connectTimeout: 30s
      tlsTimeout: 10s
      tcpKeepAlive: 30s
      keepAliveConnections: 10
      keepAliveTimeout: 90s
  - service: http_status:404
EOF
    
    log "INFO" "配置文件已创建: $config_file"
    
    # 设置DNS记录
    cloudflared tunnel route dns "$tunnel_name" "$domain"
    log "INFO" "DNS记录已设置: $domain"
}

# 获取tunnel token
get_tunnel_token() {
    local tunnel_name=${1:-"fortune-draw-tunnel"}
    
    log "INFO" "获取Tunnel Token..."
    
    local token=$(cloudflared tunnel token "$tunnel_name")
    
    if [ -n "$token" ]; then
        log "INFO" "Tunnel Token (请保存到 .env 文件中):"
        echo ""
        echo "TUNNEL_TOKEN=$token"
        echo ""
        log "WARN" "请将上述Token添加到项目根目录的 .env 文件中"
    else
        log "ERROR" "无法获取Tunnel Token"
        exit 1
    fi
}

# 测试tunnel连接
test_tunnel() {
    local tunnel_name=${1:-"fortune-draw-tunnel"}
    
    log "INFO" "测试Tunnel连接..."
    
    # 运行tunnel（前台模式，用于测试）
    log "INFO" "启动Tunnel测试（按Ctrl+C停止）..."
    cloudflared tunnel run "$tunnel_name"
}

# 显示帮助信息
show_help() {
    cat << EOF
Cloudflare Tunnel 设置脚本

用法: $0 [命令] [参数]

命令:
    install                     安装cloudflared
    login                       登录Cloudflare账户
    create [tunnel-name]        创建tunnel (默认: fortune-draw-tunnel)
    configure <tunnel-name> <domain>  配置tunnel和域名
    token [tunnel-name]         获取tunnel token
    test [tunnel-name]          测试tunnel连接
    setup <domain>              一键设置 (包含create, configure, token)
    help                        显示帮助信息

示例:
    $0 setup fortune.example.com        # 一键设置tunnel和域名
    $0 create my-tunnel                  # 创建名为my-tunnel的tunnel
    $0 configure my-tunnel api.example.com  # 配置tunnel和域名
    $0 token my-tunnel                   # 获取tunnel token
    $0 test my-tunnel                    # 测试tunnel连接

注意:
    1. 首次使用需要先运行 'login' 命令登录Cloudflare
    2. 域名必须已添加到Cloudflare并激活
    3. 获取的Token需要添加到项目的 .env 文件中
    4. 生产环境部署时会自动使用配置的Token

EOF
}

# 一键设置
setup_all() {
    local domain=$1
    local tunnel_name="fortune-draw-tunnel"
    
    if [ -z "$domain" ]; then
        log "ERROR" "请提供域名参数"
        show_help
        exit 1
    fi
    
    log "INFO" "开始一键设置Cloudflare Tunnel..."
    log "INFO" "域名: $domain"
    log "INFO" "Tunnel名称: $tunnel_name"
    
    # 检查并安装cloudflared
    check_cloudflared
    
    # 检查是否已登录
    if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
        log "INFO" "需要先登录Cloudflare..."
        login_cloudflare
    fi
    
    # 创建tunnel
    create_tunnel "$tunnel_name"
    
    # 配置tunnel
    configure_tunnel "$tunnel_name" "$domain"
    
    # 获取token
    get_tunnel_token "$tunnel_name"
    
    log "INFO" "Cloudflare Tunnel设置完成！"
    log "INFO" "请将Token添加到 .env 文件，然后运行生产环境部署"
}

# 主程序
case ${1:-help} in
    "install")
        install_cloudflared
        ;;
    "login")
        login_cloudflare
        ;;
    "create")
        check_cloudflared
        create_tunnel "$2"
        ;;
    "configure")
        check_cloudflared
        configure_tunnel "$2" "$3"
        ;;
    "token")
        check_cloudflared
        get_tunnel_token "$2"
        ;;
    "test")
        check_cloudflared
        test_tunnel "$2"
        ;;
    "setup")
        setup_all "$2"
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