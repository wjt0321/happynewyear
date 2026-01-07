# 测试文档

## 概述

本项目包含完整的测试套件，涵盖单元测试、集成测试和端到端测试，确保系统的可靠性和正确性。

## 测试结构

```
tests/
├── e2e/                    # 端到端测试
│   ├── integration.test.js # 完整流程集成测试
│   ├── concurrent.test.js  # 并发用户测试
│   ├── setup.js           # 测试环境设置
│   └── env.js             # 环境变量配置
├── backend/               # 后端测试（在backend/src目录下）
├── frontend/              # 前端测试（在frontend/tests目录下）
└── README.md             # 本文档
```

## 测试类型

### 1. 单元测试

**后端单元测试**
- 位置: `backend/src/**/__tests__/*.test.ts`
- 覆盖: 数据库操作、业务逻辑、API路由、中间件
- 运行: `cd backend && npm test`

**前端单元测试**
- 位置: `frontend/tests/**/*.test.ts`
- 覆盖: 组件渲染、状态管理、工具函数、API调用
- 运行: `cd frontend && npm test`

### 2. 集成测试

**系统集成测试**
- 文件: `scripts/integration-test.js`
- 功能: 验证前后端连接、API通信、数据库连接
- 运行: `npm run test:integration`

**特点:**
- 自动检测服务状态
- 验证API响应格式
- 测试CORS配置
- 检查数据库连接

### 3. 端到端测试

**完整流程测试**
- 文件: `tests/e2e/integration.test.js`
- 功能: 模拟真实用户操作流程
- 覆盖: 抽签流程、错误处理、数据一致性

**并发测试**
- 文件: `tests/e2e/concurrent.test.js`
- 功能: 测试多用户并发场景
- 覆盖: 并发抽签、冷却机制、系统压力

**运行方式:**
```bash
# 运行所有端到端测试
npm run test:e2e

# 或者手动运行
node scripts/run-e2e-tests.js
```

## 快速开始

### 1. 安装依赖

```bash
# 安装所有依赖
npm run install:all

# 或分别安装
npm install
npm run install:backend
npm run install:frontend
```

### 2. 运行测试

```bash
# 运行所有测试
npm run test:all

# 分别运行不同类型的测试
npm run test              # 单元测试
npm run test:integration  # 集成测试
npm run test:e2e         # 端到端测试
```

### 3. 开发环境测试

```bash
# 启动开发环境（包含集成验证）
npm run dev

# 或使用专门的启动脚本
node scripts/start-dev.js
```

## 测试配置

### Jest配置文件

- `backend/jest.config.js` - 后端测试配置
- `backend/jest.unit.config.js` - 后端单元测试
- `backend/jest.integration.config.js` - 后端集成测试
- `frontend/jest.config.js` - 前端测试配置
- `jest.e2e.config.js` - 端到端测试配置

### 环境变量

测试环境使用独立的环境变量配置：

```bash
NODE_ENV=test
TEST_ENV=e2e
DB_PATH=./test-data/test.db
TEST_BACKEND_URL=http://localhost:3000
TEST_FRONTEND_URL=http://localhost:8080
```

## 测试数据管理

### 测试数据库

- 路径: `./test-data/test.db`
- 自动创建和清理
- 与生产数据库隔离

### 测试用户

测试使用动态生成的测试用户ID：
```javascript
const testOpenid = `test_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
```

## 持续集成

### GitHub Actions配置示例

```yaml
name: 测试流水线

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: 设置Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: 安装依赖
      run: npm run install:all
      
    - name: 运行单元测试
      run: npm run test
      
    - name: 运行集成测试
      run: npm run test:integration
      
    - name: 运行端到端测试
      run: npm run test:e2e
```

## 测试最佳实践

### 1. 测试隔离

- 每个测试使用独立的测试数据
- 测试之间不共享状态
- 自动清理测试数据

### 2. 错误处理

- 测试各种错误场景
- 验证错误响应格式
- 确保系统优雅降级

### 3. 性能测试

- 监控API响应时间
- 测试并发处理能力
- 验证系统稳定性

### 4. 数据一致性

- 验证数据库操作正确性
- 检查并发访问安全性
- 确保数据完整性

## 故障排除

### 常见问题

**1. 后端服务启动失败**
```bash
# 检查端口占用
netstat -ano | findstr :3000

# 手动启动后端
cd backend && npm run dev
```

**2. 数据库连接失败**
```bash
# 检查数据库文件权限
ls -la ./data/fortune.db

# 重新初始化数据库
rm ./data/fortune.db
cd backend && npm run dev
```

**3. 测试超时**
```bash
# 增加测试超时时间
jest --testTimeout=60000

# 或在测试文件中设置
jest.setTimeout(60000);
```

### 调试技巧

**1. 启用详细日志**
```bash
DEBUG=true npm run test:e2e
```

**2. 单独运行失败的测试**
```bash
npx jest --testNamePattern="特定测试名称"
```

**3. 保留测试数据**
```javascript
// 在测试中注释掉清理代码
// global.testUtils.cleanupTestData();
```

## 测试报告

### HTML报告

端到端测试会生成HTML报告：
- 位置: `./tests/e2e/reports/e2e-test-report.html`
- 包含详细的测试结果和统计信息

### 覆盖率报告

```bash
# 生成覆盖率报告
npm run test:coverage

# 查看覆盖率报告
open coverage/lcov-report/index.html
```

## 贡献指南

### 添加新测试

1. **单元测试**: 在相应模块的`__tests__`目录下添加
2. **集成测试**: 在`tests/e2e/`目录下添加
3. **遵循命名规范**: `*.test.js` 或 `*.spec.js`

### 测试代码规范

- 使用描述性的测试名称
- 每个测试只验证一个功能点
- 提供充分的断言和错误信息
- 包含必要的注释说明

### 提交前检查

```bash
# 运行所有测试
npm run test:all

# 检查代码格式
npm run lint

# 构建项目
npm run build
```

---

## 联系方式

如有测试相关问题，请联系开发团队或提交Issue。