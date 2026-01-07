# Debian 环境迁移建议

## 项目识别

这是一个**微信小程序新年抽签应用**：
- **前端**: uni-app + Vue3 + TypeScript
- **后端**: Node.js 18 + Express + SQLite
- **部署**: Docker (已配置 Linux 环境)

---

## 好消息

这个项目原本就是为 **Linux/NAS** 环境设计的，迁移到 Debian 实际上会更顺畅：

- ✅ 所有脚本都是 `.sh` bash 脚本，Debian 原生支持
- ✅ Docker 配置基于 `node:18-alpine` Linux 镜像
- ✅ 路径风格都是 Linux (`/volume1/docker/...`)
- ✅ 已有完整的 NAS 部署脚本 (`scripts/start-nas.sh` 等)

---

## Debian 开发环境搭建

### 1. 系统依赖

```bash
# 更新包管理器
sudo apt update

# 安装 Node.js 18 (推荐使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 安装 npm 8+
npm install -g npm@latest

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo apt install docker-compose-plugin

# 安装 Git
sudo apt install git
```

### 2. 项目依赖

```bash
# 克隆项目后
cd /path/to/news小程序

# 安装根依赖
npm install

# 安装后端依赖
cd backend && npm install && cd ..

# 安装前端依赖
cd frontend && npm install && cd ..
```

### 3. Windows vs Debian 差异

| 方面 | Windows | Debian |
|------|---------|--------|
| 脚本运行 | 需要 WSL/Git Bash | 原生 bash 支持 |
| 路径分隔符 | `\` | `/` |
| Docker Desktop | 需要 | 原生 Docker |
| 端口占用 | 可能有 Hyper-V 冲突 | 更干净 |
| 文件权限 | 不敏感 | 需要 `chmod`/`chown` |

---

## 开发工作流

### 后端开发

```bash
# 方式一: 直接运行 (需要安装 sqlite3 编译依赖)
sudo apt install python3 build-essential sqlite3
cd backend
npm run dev

# 方式二: Docker 开发环境 (推荐)
docker-compose -f docker-compose.dev.yml up
```

### 前端开发

```bash
# 前端需要在微信开发者工具中运行
# Debian 上可以通过 WSL 或 Wine 运行 Windows 版微信开发者工具
# 或者使用 HBuilderX 的 Linux 版 (如果可用)

cd frontend
npm run dev        # 启动开发服务器
npm run build      # 构建小程序
```

### 运行测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test

# E2E 测试
npm run test:e2e
```

---

## 部署建议

### 本地 Debian 部署

```bash
# 使用项目自带部署脚本
chmod +x scripts/deploy.sh
./scripts/deploy.sh prod

# 或使用 Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### NAS 部署

项目已配置群晖 NAS 支持：

```bash
# 修改 .env.nas.example 中的路径
# 群晖: /volume1/docker/wechat-fortune-draw
# 威联通: /share/Container/wechat-fortune-draw
# Unraid: /mnt/user/appdata/wechat-fortune-draw

# 运行 NAS 部署脚本
chmod +x scripts/start-nas.sh
./scripts/start-nas.sh
```

---

## 需要注意的配置文件

| 文件 | 说明 |
|------|------|
| `.env.example` | 环境变量模板 |
| `.env.docker` | Docker 环境变量 |
| `.env.nas.example` | NAS 配置模板 |
| `integration-config.json` | 集成配置 |
| `docker-compose.nas.yml` | NAS Docker 配置 |

---

## 潜在问题和解决方案

### 1. SQLite 编译问题

```bash
# better-sqlite3 需要编译
sudo apt install python3 build-essential sqlite3 libsqlite3-dev
```

### 2. 端口占用

```bash
# 检查端口占用
sudo netstat -tuln | grep 3000

# 修改 docker-compose.nas.yml 中的端口
# NAS 环境已使用高端口 (18080) 避免冲突
```

### 3. 文件权限

```bash
# Docker 容器以 nodejs:1001 用户运行
# 确保数据目录权限正确
sudo chown -R 1001:1001 ./data
```

---

## 推荐的开发环境配置

### VS Code 远程开发

1. 在 Debian 上安装 SSH 服务
2. 使用 VS Code Remote-SSH 插件连接
3. 本地 Windows 使用 VS Code 编辑，远程 Debian 运行

### 微信开发者工具

前端小程序开发仍需要微信开发者工具：

**方案 A**: Windows 本地运行微信开发者工具
- 通过 SMB/WebDAV 访问 Debian 上的代码
- 修改 `VITE_API_BASE_URL` 指向 Debian 后端

**方案 B**: WSL 运行
- 在 WSL 中安装开发环境
- 微信开发者工具访问 WSL 文件系统

---

## 快速检查清单

- [ ] 安装 Node.js 18+
- [ ] 安装 Docker 和 Docker Compose
- [ ] 安装项目依赖
- [ ] 复制并配置 `.env` 文件
- [ ] 配置微信小程序 AppID
- [ ] 测试后端启动 (`npm run dev`)
- [ ] 测试 Docker 构建 (`docker-compose build`)
- [ ] 配置前端 API 地址
- [ ] 运行测试套件
- [ ] 尝试部署脚本
