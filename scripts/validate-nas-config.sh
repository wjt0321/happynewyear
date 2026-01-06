#!/bin/bash
# NAS环境配置验证脚本
# 在部署前验证配置文件和环境是否正确

set -e

# 颜色输出函数
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# 检查必需的文件
check_required_files() {
    print_info "检查必需文件..."
    
    local required_files=(
        "docker-compose.nas.yml"
        ".env.nas.example"
        "backend/Dockerfile"
        "backend/scripts/health-check.sh"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "找到文件: $file"
        else
            print_error "缺少文件: $file"
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -gt 0 ]; then
        print_error "缺少 ${#missing_files[@]} 个必需文件"
        return 1
    fi
}

# 检查环境配置文件
check_env_config() {
    print_info "检查环境配置..."
    
    if [ ! -f ".env.nas" ]; then
        print_warning "未找到 .env.nas 文件"
        print_info "请复制 .env.nas.example 为 .env.nas 并根据实际环境修改"
        
        if [ -f ".env.nas.example" ]; then
            print_info "是否现在创建 .env.nas 文件？(y/n)"
            read -r response
            if [[ "$response" =~ ^[Yy]$ ]]; then
                cp .env.nas.example .env.nas
                print_success "已创建 .env.nas 文件，请编辑后重新运行验证"
                return 1
            fi
        fi
        return 1
    fi
    
    # 检查关键配置项
    source .env.nas
    
    local required_vars=(
        "BACKEND_PORT"
        "NAS_DATA_PATH"
        "NAS_LOGS_PATH"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_success "配置项 $var: ${!var}"
        else
            print_error "缺少配置项: $var"
            return 1
        fi
    done
}

# 检查目录权限
check_directories() {
    print_info "检查目录和权限..."
    
    source .env.nas 2>/dev/null || true
    
    local data_dir="${NAS_DATA_PATH:-/volume1/docker/wechat-fortune-draw/data}"
    local logs_dir="${NAS_LOGS_PATH:-/volume1/docker/wechat-fortune-draw/logs}"
    
    # 检查数据目录
    if [ -d "$data_dir" ]; then
        if [ -w "$data_dir" ]; then
            print_success "数据目录可写: $data_dir"
        else
            print_error "数据目录不可写: $data_dir"
            return 1
        fi
    else
        print_warning "数据目录不存在: $data_dir"
        print_info "尝试创建目录..."
        if mkdir -p "$data_dir" 2>/dev/null; then
            print_success "已创建数据目录: $data_dir"
        else
            print_error "无法创建数据目录: $data_dir"
            return 1
        fi
    fi
    
    # 检查日志目录
    if [ -d "$logs_dir" ]; then
        if [ -w "$logs_dir" ]; then
            print_success "日志目录可写: $logs_dir"
        else
            print_error "日志目录不可写: $logs_dir"
            return 1
        fi
    else
        print_warning "日志目录不存在: $logs_dir"
        print_info "尝试创建目录..."
        if mkdir -p "$logs_dir" 2>/dev/null; then
            print_success "已创建日志目录: $logs_dir"
        else
            print_error "无法创建日志目录: $logs_dir"
            return 1
        fi
    fi
}

# 检查端口可用性
check_ports() {
    print_info "检查端口可用性..."
    
    source .env.nas 2>/dev/null || true
    
    local backend_port="${BACKEND_PORT:-18080}"
    local adminer_port="${ADMINER_PORT:-18082}"
    
    # 检查后端端口
    if netstat -tuln 2>/dev/null | grep -q ":$backend_port "; then
        print_error "端口 $backend_port 已被占用"
        return 1
    else
        print_success "端口 $backend_port 可用"
    fi
    
    # 检查管理端口
    if netstat -tuln 2>/dev/null | grep -q ":$adminer_port "; then
        print_error "端口 $adminer_port 已被占用"
        return 1
    else
        print_success "端口 $adminer_port 可用"
    fi
}

# 检查Docker环境
check_docker() {
    print_info "检查Docker环境..."
    
    # 检查Docker是否安装
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker未安装"
        return 1
    fi
    
    # 检查Docker是否运行
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker服务未运行"
        return 1
    fi
    
    print_success "Docker环境正常"
    
    # 检查Docker Compose
    if ! command -v docker-compose >/dev/null 2>&1; then
        print_error "Docker Compose未安装"
        return 1
    fi
    
    print_success "Docker Compose可用"
    
    # 验证compose文件语法
    if docker-compose -f docker-compose.nas.yml config >/dev/null 2>&1; then
        print_success "Docker Compose配置文件语法正确"
    else
        print_error "Docker Compose配置文件语法错误"
        return 1
    fi
}

# 主验证流程
main() {
    echo "🔍 开始NAS环境配置验证..."
    echo "================================"
    
    local errors=0
    
    # 执行各项检查
    check_required_files || ((errors++))
    echo
    
    check_env_config || ((errors++))
    echo
    
    check_directories || ((errors++))
    echo
    
    check_ports || ((errors++))
    echo
    
    check_docker || ((errors++))
    echo
    
    # 汇总结果
    echo "================================"
    if [ $errors -eq 0 ]; then
        print_success "所有验证项目通过！可以开始部署"
        echo
        print_info "下一步操作："
        echo "  1. 启动服务: docker-compose -f docker-compose.nas.yml --env-file .env.nas up -d"
        echo "  2. 查看日志: docker-compose -f docker-compose.nas.yml logs -f"
        echo "  3. 健康检查: curl http://localhost:\${BACKEND_PORT}/api/health"
    else
        print_error "发现 $errors 个问题，请修复后重新验证"
        exit 1
    fi
}

# 执行验证
main