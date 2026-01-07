#!/bin/bash
# 健康检查脚本 - 用于Docker容器健康状态检测
# 检查后端API服务是否正常运行

set -e

# 获取端口号（从环境变量或默认值）
PORT=${PORT:-3000}
HEALTH_ENDPOINT="http://localhost:${PORT}/api/health"

# 设置超时时间
TIMEOUT=5

# 执行健康检查
echo "正在检查服务健康状态: ${HEALTH_ENDPOINT}"

# 使用curl进行健康检查（如果可用）
if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -w "%{http_code}" -o /dev/null --max-time ${TIMEOUT} "${HEALTH_ENDPOINT}" || echo "000")
    if [ "$response" = "200" ]; then
        echo "✅ 服务健康检查通过"
        exit 0
    else
        echo "❌ 服务健康检查失败，HTTP状态码: $response"
        exit 1
    fi
fi

# 备用方案：使用wget进行健康检查
if command -v wget >/dev/null 2>&1; then
    if wget --quiet --timeout=${TIMEOUT} --tries=1 --spider "${HEALTH_ENDPOINT}"; then
        echo "✅ 服务健康检查通过 (wget)"
        exit 0
    else
        echo "❌ 服务健康检查失败 (wget)"
        exit 1
    fi
fi

# 最后备用方案：使用Node.js进行健康检查
if command -v node >/dev/null 2>&1; then
    node -e "
        const http = require('http');
        const options = {
            host: 'localhost',
            port: ${PORT},
            path: '/api/health',
            timeout: ${TIMEOUT}000
        };
        
        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ 服务健康检查通过 (node)');
                process.exit(0);
            } else {
                console.log('❌ 服务健康检查失败，状态码:', res.statusCode);
                process.exit(1);
            }
        });
        
        req.on('error', (err) => {
            console.log('❌ 健康检查连接错误:', err.message);
            process.exit(1);
        });
        
        req.on('timeout', () => {
            console.log('❌ 健康检查超时');
            req.destroy();
            process.exit(1);
        });
        
        req.setTimeout(${TIMEOUT}000);
        req.end();
    "
else
    echo "❌ 无法找到可用的HTTP客户端工具 (curl, wget, node)"
    exit 1
fi