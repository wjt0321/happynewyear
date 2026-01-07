#!/bin/bash

# GitHub上传前安全检查脚本
# 确保敏感信息不会被意外上传

set -e

echo "🔒 执行GitHub上传前安全检查..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查函数
check_sensitive_files() {
    echo "🔍 检查敏感文件..."
    
    # 敏感文件列表
    SENSITIVE_FILES=(
        ".env"
        "backend/.env"
        "frontend/.env"
        ".env.local"
        ".env.production"
        "*.key"
        "*.pem"
        "*.cert"
        "*.db"
        "*.sqlite"
    )
    
    local found_sensitive=false
    
    for pattern in "${SENSITIVE_FILES[@]}"; do
        if find . -name "$pattern" -not -path "./.git/*" | grep -q .; then
            echo -e "${RED}❌ 发现敏感文件: $pattern${NC}"
            find . -name "$pattern" -not -path "./.git/*"
            found_sensitive=true
        fi
    done
    
    if [ "$found_sensitive" = true ]; then
        echo -e "${RED}⚠️  发现敏感文件，请检查.gitignore配置${NC}"
        return 1
    else
        echo -e "${GREEN}✅ 未发现敏感文件${NC}"
        return 0
    fi
}

check_gitignore() {
    echo "🔍 检查.gitignore文件..."
    
    if [ ! -f ".gitignore" ]; then
        echo -e "${RED}❌ .gitignore文件不存在${NC}"
        return 1
    fi
    
    # 必需的忽略规则
    REQUIRED_IGNORES=(
        ".kiro/"
        ".shared/"
        ".env"
        "node_modules/"
        "*.db"
        "logs/"
    )
    
    local missing_rules=false
    
    for rule in "${REQUIRED_IGNORES[@]}"; do
        if ! grep -q "$rule" .gitignore; then
            echo -e "${RED}❌ .gitignore缺少规则: $rule${NC}"
            missing_rules=true
        fi
    done
    
    if [ "$missing_rules" = true ]; then
        echo -e "${RED}⚠️  .gitignore配置不完整${NC}"
        return 1
    else
        echo -e "${GREEN}✅ .gitignore配置正确${NC}"
        return 0
    fi
}

check_example_files() {
    echo "🔍 检查示例配置文件..."
    
    EXAMPLE_FILES=(
        ".env.example"
        "backend/.env.example"
        ".env.nas.example"
        "frontend/.env.nas.example"
    )
    
    local missing_examples=false
    
    for file in "${EXAMPLE_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ 缺少示例文件: $file${NC}"
            missing_examples=true
        else
            echo -e "${GREEN}✅ 示例文件存在: $file${NC}"
        fi
    done
    
    if [ "$missing_examples" = true ]; then
        return 1
    else
        return 0
    fi
}

check_git_status() {
    echo "🔍 检查Git状态..."
    
    # 检查是否有未跟踪的敏感文件
    if git status --porcelain | grep -E "\.(env|key|pem|cert|db|sqlite)$"; then
        echo -e "${RED}❌ 发现未跟踪的敏感文件${NC}"
        git status --porcelain | grep -E "\.(env|key|pem|cert|db|sqlite)$"
        return 1
    fi
    
    echo -e "${GREEN}✅ Git状态检查通过${NC}"
    return 0
}

# 执行检查
echo "==================== 开始安全检查 ===================="

check_gitignore
gitignore_ok=$?

check_sensitive_files
sensitive_ok=$?

check_example_files
examples_ok=$?

check_git_status
git_ok=$?

echo ""
echo "==================== 检查结果 ===================="

if [ $gitignore_ok -eq 0 ] && [ $sensitive_ok -eq 0 ] && [ $examples_ok -eq 0 ] && [ $git_ok -eq 0 ]; then
    echo -e "${GREEN}🎉 所有安全检查通过，可以安全上传到GitHub！${NC}"
    echo ""
    echo "📋 建议的上传步骤："
    echo "1. git add ."
    echo "2. git commit -m \"feat: 完整的微信小程序新年抽签应用\""
    echo "3. git push origin main"
    exit 0
else
    echo -e "${RED}❌ 安全检查失败，请修复问题后再上传${NC}"
    exit 1
fi