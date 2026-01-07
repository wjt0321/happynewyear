# 🎊 新年抽签应用 - Web版

基于Vue3 + TypeScript开发的纯Web新年抽签应用，支持本地部署和Docker容器化部署。后端使用Node.js + Express + SQLite。

## 🎉 最新更新 (2026-01-07)

### 🆕 Web前端转换完成

**重大更新：项目已从微信小程序转换为纯Web前端！**

#### 主要变更
- ✅ **移除微信依赖** - 完全移除uni-app和微信小程序API
- ✅ **纯Web前端** - 使用Vue3 + Vite + TypeScript构建
- ✅ **本地登录系统** - 支持昵称登录，无需微信认证
- ✅ **浏览器存储** - 使用localStorage管理用户数据
- ✅ **Docker部署** - 支持完整的Web前端+后端容器化部署
- ✅ **保留原小程序** - 微信小程序代码已备份到 `frontend-miniprogram-backup/`

#### 技术栈升级
**前端（Web版）：**
- Vue 3.5 + TypeScript 5.9
- Vite 7.2（构建工具）
- Vue Router 4（路由管理）
- Pinia 2（状态管理）
- Axios（HTTP客户端）

**后端（保持不变）：**
- Node.js + Express
- SQLite数据库
- TypeScript

#### 功能变更
| 功能 | 微信小程序版 | Web版 |
|------|------------|--------|
| 登录方式 | 微信登录 | 昵称登录 |
| 分享功能 | 微信分享 | 复制到剪贴板 |
| 平台支持 | 微信小程序 | 现代浏览器 |
| 部署方式 | 需微信审核 | 自由部署 |

## 📱 功能特色

- 🎊 **新年主题界面** - 中国红配色，精美动画效果
- 🎲 **智能抽签系统** - 50条精选新年运势，不重复抽取
- ⏰ **防刷机制** - 10秒冷却期，防止恶意刷取
- � **复制分享** - 一键复制运势到剪贴板
- 🔐 **本地登录** - 简单的昵称登录系统
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🐳 **Docker部署** - 一键容器化部署
- 💾 **数据持久化** - localStorage保存用户记录

## 🏗️ 技术架构

### 前端技术栈（Web版）
- **Vue 3** - 现代化前端框架
- **Vite** - 快速的构建工具
- **TypeScript** - 类型安全
- **Vue Router** - 单页应用路由
- **Pinia** - 状态管理
- **Axios** - HTTP客户端

### 后端技术栈
- **Node.js 18+** - JavaScript运行时
- **Express 4.x** - Web框架
- **SQLite 3** - 轻量级数据库
- **better-sqlite3** - 高性能数据库驱动
- **TypeScript** - 类型安全

### 部署技术
- **Docker** - 容器化部署
- **Nginx** - Web服务器
- **Docker Compose** - 服务编排

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 8.0.0
- Docker (可选，用于容器化部署)

### 方式一：本地开发

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 启动后端服务（终端1）
cd backend
npm run dev
# 后端运行在 http://localhost:5000

# 启动前端开发服务器（终端2）
cd frontend
npm run dev
# 前端运行在 http://localhost:5173
```

### 方式二：Docker部署

#### Web版部署（推荐）

```bash
# 1. 构建并启动完整Web服务
docker compose -f docker-compose.web.yml up -d

# 2. 访问应用
# 前端：http://localhost:8080
# 后端API：http://localhost:5000

# 3. 查看日志
docker compose -f docker-compose.web.yml logs -f

# 4. 停止服务
docker compose -f docker-compose.web.yml down
```

#### 环境变量配置

创建 `.env` 文件：
```env
# 后端服务端口
BACKEND_PORT=5000

# 前端服务端口
FRONTEND_PORT=8080

# 数据存储路径
DATA_PATH=./data
```

## 🧪 测试

### 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

## 🐳 Docker部署详解

### 部署方式选择

项目提供多种Docker部署配置：

| 部署方式 | 配置文件 | 端口 | 适用场景 |
|---------|----------|------|----------|
| **Web版（推荐）** | `docker-compose.web.yml` | 8080 | 纯Web前端+后端 |
| 开发环境 | `docker-compose.dev.yml` | 3000 | 本地开发调试 |
| 生产环境 | `docker-compose.prod.yml` | 3000 | 云服务器部署 |
| NAS环境 | `docker-compose.nas.yml` | 18080 | NAS系统部署 |

### Web版部署架构

```
┌─────────────────────────────────────┐
│     Docker Compose编排          │
├─────────────────────────────────────┤
│                                 │
│  ┌──────────────┐  ┌─────────┐ │
│  │  Nginx      │  │         │ │
│  │  :8080      │  │         │ │
│  └──────┬───────┘  │         │ │
│         │           │         │ │
│         ▼           │         │ │
│  ┌──────────────┐  │         │ │
│  │  Vue3前端    │  │         │ │
│  │  (静态文件)  │  │         │ │
│  └──────────────┘  │         │ │
│                   │         │ │
│                   └─────────┤ │
│                             │ │
│  ┌────────────────────────┐   │ │
│  │  Express后端 API     │   │ │
│  │  :5000              │   │ │
│  │  SQLite数据库         │   │ │
│  └────────────────────────┘   │ │
│                             │ │
└─────────────────────────────────┘
```

## 📁 项目结构

```
happynewyear/
├── backend/                      # 后端API服务
│   ├── src/
│   │   ├── database/            # 数据库相关
│   │   ├── routes/              # API路由
│   │   ├── services/            # 业务逻辑
│   │   ├── middleware/          # 中间件
│   │   └── types/               # 类型定义
│   ├── Dockerfile              # Docker配置
│   └── package.json
├── frontend/                     # Web前端应用（新）
│   ├── src/
│   │   ├── components/         # 组件（LoginModal等）
│   │   ├── views/             # 页面（HomeView、ResultView）
│   │   ├── stores/            # 状态管理（user、fortune）
│   │   ├── router/            # 路由配置
│   │   ├── App.vue            # 根组件
│   │   └── main.ts           # 入口文件
│   ├── Dockerfile              # Docker配置
│   ├── nginx.conf             # Nginx配置
│   └── package.json
├── frontend-miniprogram-backup/  # 微信小程序备份
│   ├── src/
│   │   ├── pages/             # 小程序页面
│   │   ├── components/        # 小程序组件
│   │   ├── stores/            # 小程序状态管理
│   │   └── utils/             # 小程序工具函数
│   └── package.json
├── scripts/                     # 部署脚本
├── docs/                        # 项目文档
├── docker-compose.web.yml        # Web版部署配置
├── docker-compose.nas.yml        # NAS部署配置
├── docker-compose.dev.yml        # 开发环境配置
└── docker-compose.prod.yml       # 生产环境配置
```

## 🔧 配置说明

### 环境变量

#### 前端环境变量（frontend/.env）

```env
# 开发环境
VITE_API_BASE_URL=/api

# 生产环境（frontend/.env.production）
VITE_API_BASE_URL=https://ny.wxbfnnas.com
```

#### 后端环境变量（backend/.env）

```env
# 服务配置
PORT=3000
NODE_ENV=production

# 数据库配置
DB_PATH=/app/data/fortune.db
```

## 📊 API文档

### 抽签接口

```http
POST /api/fortune
Content-Type: application/json

{
  "openid": "user_openid_here"
}
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "id": 49,
    "text": "龙腾虎跃，大展宏图！",
    "isNew": true
  }
}
```

### 健康检查

```http
GET /api/health
```

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2026-01-07T12:00:00.000Z",
  "database": "connected"
}
```

## 🎨 界面预览

### 首页（HomeView）
- 新年主题背景（紫色渐变）
- 中央抽签按钮（带动画效果）
- 剩余运势统计
- 冷却倒计时显示
- 功能特性卡片展示

### 登录弹窗（LoginModal）
- 简洁的昵称输入框
- 输入验证（2-20字符）
- 功能特性展示

### 结果页（ResultView）
- 运势卡片展示
- 新运势徽章
- 复制分享按钮
- 再次抽签按钮

## 🔒 安全特性

- **用户会话管理** - 基于24小时时间戳
- **防刷机制** - 10秒冷却期
- **数据完整性** - 外键约束和唯一性检查
- **输入验证** - 严格的参数校验
- **错误处理** - 完善的异常处理机制
- **Docker安全** - 只读根文件系统、安全选项

## 📈 性能优化

- **数据库索引** - 优化查询性能
- **连接池管理** - 高效的数据库连接
- **缓存机制** - 运势数据缓存
- **响应式设计** - 适配各种设备
- **代码分割** - 路由懒加载
- **Gzip压缩** - Nginx启用压缩
- **静态资源缓存** - 浏览器缓存策略

## 🌐 浏览器支持

支持以下现代浏览器：
- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

需要的特性：
- ES6+
- CSS Grid
- CSS Flexbox
- localStorage API
- Clipboard API

## 🐛 故障排除

### 常见问题

1. **前端无法连接后端**
   ```bash
   # 检查后端服务是否运行
   curl http://localhost:5000/api/health

   # 检查Vite代理配置
   # 确保 vite.config.ts 中 proxy 配置正确
   ```

2. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :5000
   # 或
   netstat -tulpn | grep :5000
   ```

3. **localStorage数据丢失**
   - 确保使用现代浏览器
   - 检查浏览器隐私设置
   - 清除浏览器缓存后数据会重置

4. **Docker容器启动失败**
   ```bash
   # 查看容器日志
   docker compose -f docker-compose.web.yml logs

   # 检查端口占用
   docker ps -a
   ```

## 📝 更新日志

### v2.0.0 (2026-01-07) - Web前端转换版
- 🆕 **重大更新** - 从微信小程序转换为纯Web前端
- ✨ 新增Vue3 + Vite + TypeScript技术栈
- 🔐 新增本地登录系统（昵称登录）
- 📋 新增复制分享功能
- 🐳 新增Docker Web部署配置
- 💾 新增浏览器本地存储支持
- 📱 优化响应式设计和动画效果
- 📚 更新完整文档

### v1.0.0 (2026-01-06) - 微信小程序版
- ✨ 初始版本发布
- 🎊 完整的新年抽签功能
- 📱 微信小程序支持
- 🐳 Docker容器化部署
- 🧪 完整的测试覆盖

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 👥 作者

- **wjt0321** - 项目维护者 - [GitHub](https://github.com/wjt0321)

## 🙏 致谢

- 感谢Vue.js社区的技术支持
- 感谢Vite团队提供优秀的构建工具
- 感谢所有测试用户的反馈

## 📚 相关文档

- [BRANCH_INFO.md](./BRANCH_INFO.md) - 分支说明和版本对比

- [WEB转换说明.md](./WEB转换说明.md) - Web前端转换详细说明
- [GITHUB上传总结.md](./GITHUB_UPLOAD_SUMMARY.md) - GitHub上传总结
- [docs/API文档.md](./docs/API文档.md) - 完整API文档
- [docs/部署指南.md](./docs/部署指南.md) - 部署说明
- [docs/使用指南.md](./docs/使用指南.md) - 使用说明

---

**🎊 祝您2026年新年快乐，好运连连！🎊**

**GitHub仓库：** https://github.com/wjt0321/happynewyear.git
