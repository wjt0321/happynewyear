# 需求文档

## 介绍

微信小程序新年抽签应用是一个轻量级的趣味抽奖系统，专为2026年新年期间小范围朋友使用而设计。用户通过微信小程序进行抽签，获得新年运势祝福语，并可分享给好友。系统采用前后端分离架构，前端为微信小程序，后端部署在用户NAS上。

## 术语表

- **Fortune_System**: 抽签系统，负责管理运势抽取逻辑
- **WeChat_MiniProgram**: 微信小程序前端应用
- **Backend_API**: 后端API服务，提供抽签接口
- **SQLite_Database**: SQLite数据库，存储运势和用户抽签记录
- **Docker_Container**: Docker容器，用于部署后端服务
- **Cloudflare_Tunnel**: Cloudflare隧道，提供HTTPS域名访问
- **OpenID**: 微信用户唯一标识符
- **Fortune_Pool**: 运势池，包含50条预设祝福语
- **User_Draw_Record**: 用户抽签记录，防止重复抽取

## 需求

### 需求 1

**用户故事：** 作为用户，我希望看到有节日氛围的首页，这样我能感受到新年的喜庆气氛。

#### 验收标准

1. WHEN 用户打开小程序 THEN Fortune_System SHALL 显示带有动画背景的首页界面
2. WHEN 首页加载完成 THEN WeChat_MiniProgram SHALL 展示飘雪或烟花动画效果
3. WHEN 首页渲染 THEN WeChat_MiniProgram SHALL 显示一个醒目的"抽签"按钮
4. WHEN 用户查看首页 THEN WeChat_MiniProgram SHALL 适配iPhone和安卓主流机型的屏幕尺寸

### 需求 2

**用户故事：** 作为用户，我希望能够抽取新年运势，这样我能获得有趣的新年祝福。

#### 验收标准

1. WHEN 用户点击抽签按钮 THEN Fortune_System SHALL 从运势池中随机选择一条运势
2. WHEN 系统选择运势 THEN Fortune_System SHALL 确保运势池包含50条预设祝福语
3. WHEN 运势被选中 THEN Fortune_System SHALL 为每条运势分配唯一ID
4. WHEN 用户已抽过某条运势 THEN Fortune_System SHALL 排除该运势不被重复抽取
5. WHEN 用户抽签 THEN Backend_API SHALL 通过微信openid识别用户身份

### 需求 3

**用户故事：** 作为用户，我希望看到精美的抽签结果展示，这样我能享受抽签的乐趣。

#### 验收标准

1. WHEN 抽签完成 THEN WeChat_MiniProgram SHALL 显示抽中的运势文本
2. WHEN 结果页加载 THEN WeChat_MiniProgram SHALL 播放金光闪烁等动画效果
3. WHEN 用户查看结果 THEN WeChat_MiniProgram SHALL 提供"分享给好友"按钮
4. WHEN 用户点击分享 THEN WeChat_MiniProgram SHALL 调用微信分享API
5. WHEN 用户查看结果 THEN WeChat_MiniProgram SHALL 提供"再抽一次"按钮

### 需求 4

**用户故事：** 作为用户，我希望系统能防止恶意刷取，这样能保证公平的抽签体验。

#### 验收标准

1. WHEN 用户点击"再抽一次" THEN Fortune_System SHALL 检查距离上次抽签的时间间隔
2. IF 时间间隔少于10秒 THEN Fortune_System SHALL 阻止抽签并显示等待提示
3. WHEN 时间间隔满足要求 THEN Fortune_System SHALL 允许用户进行下次抽签
4. WHEN 用户尝试频繁抽签 THEN Fortune_System SHALL 记录抽签时间戳防止刷取

### 需求 5

**用户故事：** 作为系统管理员，我希望有稳定的后端API服务，这样能支持小程序的正常运行。

#### 验收标准

1. WHEN 小程序发起抽签请求 THEN Backend_API SHALL 提供`/api/fortune`端点
2. WHEN API接收请求 THEN Backend_API SHALL 接受包含openid的POST请求
3. WHEN API处理完成 THEN Backend_API SHALL 返回包含id、text、isNew字段的JSON响应
4. WHEN API运行 THEN Backend_API SHALL 支持小于50的并发用户访问
5. WHEN 系统部署 THEN Backend_API SHALL 通过HTTPS协议提供服务

### 需求 6

**用户故事：** 作为系统管理员，我希望有可靠的数据存储方案，这样能持久化用户抽签记录。

#### 验收标准

1. WHEN 系统初始化 THEN SQLite_Database SHALL 创建fortunes表存储运势数据
2. WHEN 用户抽签 THEN SQLite_Database SHALL 在user_draws表记录抽签信息
3. WHEN 数据库操作 THEN SQLite_Database SHALL 存储openid、fortune_id和timestamp字段
4. WHEN 系统重启 THEN SQLite_Database SHALL 通过Docker volume保持数据持久化
5. WHEN 查询历史记录 THEN SQLite_Database SHALL 支持按用户openid查询抽签历史

### 需求 7

**用户故事：** 作为系统管理员，我希望有便捷的部署方案，这样能在NAS上稳定运行服务。

#### 验收标准

1. WHEN 部署系统 THEN Docker_Container SHALL 包含完整的Node.js后端服务
2. WHEN 容器启动 THEN Docker_Container SHALL 自动初始化SQLite数据库
3. WHEN 外部访问 THEN Cloudflare_Tunnel SHALL 提供HTTPS域名访问后端API
4. WHEN 数据持久化 THEN Docker_Container SHALL 将数据库文件挂载到NAS本地目录
5. WHEN 服务运行 THEN Docker_Container SHALL 在NAS环境中稳定运行

### 需求 8

**用户故事：** 作为开发者，我希望使用现代化的技术栈，这样能保证代码质量和未来扩展性。

#### 验收标准

1. WHEN 开发前端 THEN WeChat_MiniProgram SHALL 使用uni-app框架基于Vue 3和TypeScript
2. WHEN 开发后端 THEN Backend_API SHALL 使用Node.js和Express框架
3. WHEN 用户认证 THEN WeChat_MiniProgram SHALL 使用微信原生登录获取openid
4. WHEN 未来扩展 THEN WeChat_MiniProgram SHALL 支持编译为H5版本
5. WHERE 不使用微信云开发 THEN Backend_API SHALL 独立部署在用户NAS上