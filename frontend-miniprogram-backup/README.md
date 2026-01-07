# 微信小程序新年抽签应用 - 前端

## 项目简介

这是一个基于uni-app + Vue3 + TypeScript开发的微信小程序前端应用，为用户提供新年抽签功能。支持多平台编译，主要面向微信小程序，同时支持H5、App等平台。

## 版本信息

- **版本**: 1.0.0
- **Node.js要求**: >= 18.0.0
- **npm要求**: >= 8.0.0
- **许可证**: MIT

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 组件
│   │   ├── AnimatedBackground.vue    # 动画背景
│   │   ├── FortuneButton.vue        # 抽签按钮
│   │   └── NewYearDecoration.vue    # 新年装饰
│   ├── pages/              # 页面
│   │   ├── index/          # 首页
│   │   └── result/         # 结果页
│   ├── stores/             # 状态管理
│   │   ├── user.ts         # 用户状态
│   │   └── fortune.ts      # 抽签状态
│   ├── utils/              # 工具函数
│   │   ├── api.ts          # API调用
│   │   ├── auth.ts         # 微信登录
│   │   └── constants.ts    # 常量定义
│   ├── types/              # 类型定义
│   │   └── index.ts        # 全局类型
│   ├── styles/             # 样式文件
│   │   └── variables.scss  # SCSS变量
│   ├── App.vue             # 应用入口
│   ├── main.ts             # 主文件
│   ├── manifest.json       # 应用配置
│   └── pages.json          # 页面配置
├── tests/                  # 测试文件
│   ├── components/         # 组件测试
│   ├── stores/             # 状态管理测试
│   ├── utils/              # 工具函数测试
│   └── setup.ts            # 测试设置
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript配置
├── vite.config.ts          # Vite配置
├── jest.config.js          # Jest测试配置
└── babel.config.js         # Babel配置
```

## 技术栈

- **uni-app 3.x**: 跨平台开发框架，支持编译到多个小程序平台
- **Vue 3.4+**: 现代化前端框架，支持Composition API
- **TypeScript 5.x**: 类型安全的JavaScript超集
- **Pinia 2.x**: Vue 3官方推荐的状态管理库
- **Vite 5.x**: 现代化构建工具，提供快速的开发体验
- **SCSS**: CSS预处理器，支持嵌套和变量
- **Jest 29.x**: 测试框架，支持单元测试和集成测试
- **ESLint + Prettier**: 代码质量和格式化工具
- **Vue i18n**: 国际化支持（预留功能）

## 开发命令

### 基础命令

```bash
# 安装依赖
npm install

# 开发环境运行（默认微信小程序）
npm run dev
# 或者
npm run serve

# 构建生产版本（默认微信小程序）
npm run build

# 预览构建结果
npm run preview
```

### 平台特定命令

```bash
# 微信小程序
npm run dev:mp-weixin          # 开发
npm run build:mp-weixin        # 构建

# H5网页版
npm run dev:h5                 # 开发
npm run build:h5               # 构建
npm run dev:h5:ssr             # SSR开发

# App应用
npm run dev:app                # 开发
npm run build:app              # 构建
npm run dev:app-android        # Android开发
npm run dev:app-ios            # iOS开发

# 其他小程序平台
npm run dev:mp-alipay          # 支付宝小程序
npm run dev:mp-baidu           # 百度小程序
npm run dev:mp-qq              # QQ小程序
npm run dev:mp-toutiao         # 抖音小程序
npm run dev:mp-kuaishou        # 快手小程序
npm run dev:mp-lark            # 飞书小程序
npm run dev:mp-xhs             # 小红书小程序
```

### 代码质量命令

```bash
# 代码检查和修复
npm run lint                   # 检查并自动修复
npm run lint:check             # 仅检查不修复

# 代码格式化
npm run format                 # 格式化所有文件
npm run format:check           # 检查格式是否正确

# TypeScript类型检查
npm run type-check             # 单次检查
npm run type-check:watch       # 监听模式检查
```

### 测试命令

```bash
# 基础测试
npm test                       # 运行所有测试
npm run test:watch             # 监听模式运行测试
npm run test:coverage          # 生成覆盖率报告
npm run test:ci                # CI环境测试

# 分类测试
npm run test:unit              # 单元测试
npm run test:integration       # 集成测试
```

### 工具命令

```bash
# 清理构建文件
npm run clean                  # 清理dist和unpackage目录
```

## 功能特性

### 核心功能
- ✅ 新年主题UI设计（中国红配色方案）
- ✅ 动画背景效果（飘雪、烟花、浮动装饰）
- ✅ 交互式抽签按钮（支持冷却倒计时）
- ✅ 精美的运势结果展示页面
- ✅ 微信原生分享功能
- ✅ 响应式布局适配（支持各种屏幕尺寸）

### 技术特性
- ✅ TypeScript类型安全保障
- ✅ Pinia状态管理（用户状态、抽签状态）
- ✅ 完整的测试覆盖（单元测试、组件测试、集成测试）
- ✅ 代码质量保障（ESLint、Prettier）
- ✅ 多平台支持（微信小程序、H5、App等）
- ✅ 现代化开发体验（Vite热重载、TypeScript智能提示）

### 页面功能
- **首页**: 新年主题界面，动画背景，抽签按钮
- **结果页**: 运势展示，分享功能，再次抽签

### 核心组件
- **FortuneButton**: 抽签按钮，支持冷却状态和动画
- **AnimatedBackground**: 飘雪、烟花等动画背景
- **NewYearDecoration**: 新年装饰元素

### 状态管理
- **用户状态**: 登录状态、冷却时间管理
- **抽签状态**: 当前运势、历史记录、可用数量

### 工具功能
- **API调用**: 统一的HTTP请求封装
- **微信登录**: 微信小程序登录集成
- **本地存储**: 用户数据持久化

## 主题设计

### 色彩方案
- 中国红 (#FF4757)
- 金黄色 (#FFD700)
- 节庆橙 (#FF6B35)
- 深红色 (#C44569)
- 暖白色 (#FFF8E7)

### 动画效果
- 飘雪动画
- 烟花爆炸
- 按钮旋转装饰
- 卡片发光效果
- 粒子庆祝动画

## 测试覆盖

- 组件单元测试
- 状态管理测试
- API工具函数测试
- 用户交互测试

## 部署说明

1. 构建微信小程序版本：`npm run build:mp-weixin`
2. 使用微信开发者工具打开 `dist/build/mp-weixin` 目录
3. 配置小程序AppID和服务器域名
4. 上传代码并提交审核

## 注意事项

- 需要配置后端API服务地址
- 微信小程序需要配置合法域名
- 测试环境使用模拟登录，生产环境需要真实微信登录
- 图片资源需要上传到CDN或配置为网络图片