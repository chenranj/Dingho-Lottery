# DH Lottery - 抽奖程序

基于 Cloudflare Workers + Durable Objects 的实时抽奖应用，无需数据库。

## 功能

- **用户端**：查看抽奖标题、输入昵称和 Luma 邮箱加入、实时查看已加入用户
- **管理端** (`/dingho`)：设置标题、中奖人数、发起抽奖、开始抽奖（带动画）、重新开始
- **实时同步**：WebSocket 实时更新，多端同步
- **无数据库**：状态存储在 Durable Object 内存中

## 开发

```bash
# 安装依赖
npm install

# 开发模式：同时启动 Vite 前端 + Wrangler Worker
npm run dev

# 访问
# - 用户端: http://localhost:5173/
# - 管理端: http://localhost:5173/dingho
# - 或直接访问 Worker: http://localhost:8787/
```

## 部署到 Cloudflare

```bash
npm run deploy
```

需要先登录 Cloudflare：`npx wrangler login`

## 技术栈

- **前端**：React + Vite + TypeScript
- **后端**：Cloudflare Workers + Durable Objects
- **样式**：暗色主题 + 毛玻璃效果
