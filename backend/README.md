# 微信小程序新年抽签应用 - 后端服务

## 项目简介

这是一个基于Node.js + Express + TypeScript + SQLite开发的后端API服务，为微信小程序新年抽签应用提供数据支持。

## 技术栈

- **Node.js 18+**: JavaScript运行时环境
- **Express 4.x**: 轻量级Web框架
- **TypeScript**: 类型安全的JavaScript超集
- **better-sqlite3**: 高性能SQLite Node.js驱动
- **Jest**: 测试框架
- **Helmet**: 安全头中间件
- **CORS**: 跨域资源共享中间件
- **dotenv**: 环境变量管理

## 功能特性

- ✅ 用户抽签管理（防重复抽取）
- ✅ 抽签冷却机制（10秒间隔）
- ✅ 50条预设新年运势
- ✅ 用户抽签历史记录
- ✅ RESTful API接口
- ✅ 完整的单元测试覆盖
- ✅ TypeScript类型安全
- ✅ 错误处理和日志记录

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制环境变量模板文件：
```bash
cp .env.example .env
```

编辑 `.env` 文件配置必要参数（参见环境变量章节）。

### 3. 开发环境运行

```bash
npm run dev
```

### 4. 构建生产版本

```bash
npm run build
npm start
```

### 5. 运行测试

```bash
# 运行所有测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

## API接口

### 健康检查

```http
GET /api/health
```

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-05T08:00:00.000Z",
  "database": "connected"
}
```

### 抽签接口

```http
POST /api/fortune
Content-Type: application/json

{
  "openid": "user_openid_from_wechat"
}
```

**成功响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "text": "2026年财运爆棚，金银满屋！",
    "isNew": true
  }
}
```

**冷却期响应：**
```json
{
  "success": false,
  "error": "抽签冷却中，请稍后再试",
  "cooldown": 5
}
```

### 用户统计（调试用）

```http
GET /api/stats/:openid
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalDrawn": 3,
    "totalAvailable": 50,
    "remainingCount": 47
  }
}
```

## 项目结构

```
backend/
├── src/
│   ├── config/           # 配置文件
│   ├── database/         # 数据库管理
│   ├── middleware/       # Express中间件
│   ├── routes/           # API路由
│   ├── services/         # 业务逻辑服务
│   ├── types/            # TypeScript类型定义
│   ├── test/             # 测试配置
│   └── index.ts          # 应用入口
├── dist/                 # 编译输出目录
├── data/                 # SQLite数据库文件
├── package.json
├── tsconfig.json
└── jest.config.js
```

## 数据库设计

### fortunes表（运势表）
- `id`: 运势唯一标识符
- `text`: 运势文本内容
- `category`: 运势分类（财运、事业、爱情等）
- `created_at`: 创建时间

### user_draws表（用户抽签记录表）
- `id`: 记录唯一标识符
- `openid`: 微信用户唯一标识
- `fortune_id`: 抽中的运势ID
- `timestamp`: 抽签时间戳

## 环境变量

创建 `.env` 文件：

```bash
# 服务器端口
PORT=3000

# 数据库路径
DB_PATH=./data/fortune.db

# 运行环境
NODE_ENV=development
```

## 部署说明

### Docker部署（推荐）

1. 构建Docker镜像
2. 配置数据持久化挂载
3. 通过Cloudflare Tunnel提供HTTPS访问

### 直接部署

1. 安装Node.js 18+
2. 运行 `npm install --production`
3. 运行 `npm run build`
4. 运行 `npm start`

## 开发指南

### 可用的npm脚本

```bash
# 开发模式（热重载）
npm run dev

# 构建项目
npm run build

# 启动生产服务
npm start

# 运行测试
npm test

# 监听模式运行测试
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage

# 清理构建文件
npm run clean
```

### 添加新的API接口

1. 在 `src/routes/` 中添加路由
2. 在 `src/services/` 中添加业务逻辑
3. 在 `src/types/` 中定义类型
4. 编写对应的测试文件

### 数据库操作

所有数据库操作都通过 `DatabaseManager` 类进行，支持：
- 运势数据管理
- 用户抽签记录
- 数据完整性检查

### 测试

- 单元测试：`npm test`
- 测试覆盖率：`npm run test:coverage`
- 监听模式：`npm run test:watch`

测试文件位于各模块的 `__tests__` 目录中，使用Jest框架和supertest进行API测试。

## 许可证

MIT License