# 🚀 Soma 部署指南

## 📋 部署架构

```
前端 (Vite + React) → Vercel (免费)
后端 (Express + SQLite) → Railway/Render (免费层)
数据库 (SQLite) → 本地文件存储
```

---

## ⚡ 方案一：快速部署（推荐）

### 第 1 步：准备代码仓库

确保你的代码已推送到 GitHub：

```bash
cd /Users/patrick_ma/Soma/Soma_V0
git add .
git commit -m "准备部署"
git push origin main
```

---

### 第 2 步：部署后端到 Railway

#### 2.1 创建 Railway 项目

1. 访问 [Railway.app](https://railway.app)
2. 用 GitHub 账号登录
3. 点击 **New Project** → **Deploy from GitHub repo**
4. 选择 `synapse-weave-grid` 仓库
5. 选择 **Self_AI_Agent** 目录作为根目录

#### 2.2 配置环境变量

在 Railway 项目设置中添加：

```env
NODE_ENV=production
PORT=8787
GEMINI_API_KEY=你的Gemini_API_Key
GOOGLE_CLIENT_ID=你的Google_OAuth_Client_ID
GOOGLE_CLIENT_SECRET=你的Google_OAuth_Secret
GOOGLE_REDIRECT_URI=https://你的后端域名.railway.app/auth/google/callback
JWT_SECRET=请生成一个随机字符串
```

#### 2.3 设置构建命令

在 Railway 设置中：
- **Root Directory**: `Self_AI_Agent`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### 2.4 获取后端 URL

部署完成后，Railway 会给你一个域名，例如：
```
https://soma-backend-production.up.railway.app
```

保存这个 URL！

---

### 第 3 步：部署前端到 Vercel

#### 3.1 创建 Vercel 项目

1. 访问 [Vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 **Add New** → **Project**
4. 导入 `synapse-weave-grid` 仓库

#### 3.2 配置构建设置

- **Framework Preset**: Vite
- **Root Directory**: `./` (保持默认)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

#### 3.3 设置环境变量

在 Vercel 项目设置 → Environment Variables 中添加：

```env
VITE_API_BASE_URL=https://你的后端域名.railway.app/api
VITE_SELF_AGENT_API_BASE_URL=https://你的后端域名.railway.app
VITE_APP_NAME=Soma
VITE_APP_VERSION=1.0.0
```

#### 3.4 部署

点击 **Deploy**，几分钟后你会得到一个 URL：
```
https://soma.vercel.app
```

---

## 🔧 方案二：使用 Render（一体化部署）

### 优点
- 前后端在同一平台
- 配置更简单
- 免费层支持

### 部署步骤

#### 1. 后端服务（Web Service）

1. 访问 [Render.com](https://render.com)
2. 创建 **New Web Service**
3. 连接 GitHub 仓库
4. 配置：
   - **Root Directory**: `Self_AI_Agent`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
   - **Plan**: Free

5. 添加环境变量（同 Railway 配置）

#### 2. 前端服务（Static Site）

1. 创建 **New Static Site**
2. 连接同一个 GitHub 仓库
3. 配置：
   - **Root Directory**: `./`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. 添加环境变量（同 Vercel 配置，但使用 Render 的后端 URL）

---

## 🐳 方案三：Docker 部署（自托管）

如果你有自己的服务器（VPS），可以使用 Docker：

### 3.1 创建 Dockerfile

**前端 Dockerfile** (已为你创建在根目录)

**后端 Dockerfile** (已为你创建在 Self_AI_Agent 目录)

### 3.2 使用 Docker Compose

```bash
# 构建并启动
docker-compose up -d --build

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### 3.3 配置反向代理（Nginx/Caddy）

使用 Caddy 自动 HTTPS：

```caddyfile
yourdomain.com {
    reverse_proxy localhost:8080
}

api.yourdomain.com {
    reverse_proxy localhost:8787
}
```

---

## 🌐 域名配置

### 购买域名（可选）

推荐平台：
- Namecheap
- GoDaddy
- Cloudflare Registrar

### 配置 DNS

1. 在 Vercel/Railway 项目设置中添加自定义域名
2. 在域名服务商处添加 CNAME 记录：
   ```
   www.yourdomain.com → cname.vercel-dns.com
   api.yourdomain.com → 你的Railway域名
   ```

---

## 📱 SEO 优化（让搜索引擎收录）

### 1. 添加 robots.txt

已创建在 `public/robots.txt`

### 2. 创建 sitemap.xml

已创建在项目根目录

### 3. 提交到搜索引擎

- **Google Search Console**: https://search.google.com/search-console
- **Bing Webmaster Tools**: https://www.bing.com/webmasters

提交你的网站 URL 和 sitemap.xml

### 4. 优化元标签

在 `index.html` 中已包含完整的 SEO 标签。

---

## ✅ 部署后检查清单

- [ ] 后端健康检查：访问 `https://你的后端域名/health`
- [ ] 前端正常加载：访问 `https://你的前端域名`
- [ ] API 连接正常：查看浏览器控制台无错误
- [ ] Google OAuth 正常：能够登录
- [ ] 数据导入功能：能够上传文件
- [ ] 聊天功能：能够与 AI 对话
- [ ] Memories 展示：能够查看时间轴

---

## 🔒 安全建议

1. **启用 HTTPS**（Vercel/Railway 自动提供）
2. **设置 CORS 白名单**（已在后端配置）
3. **保护敏感环境变量**（不要提交到 Git）
4. **定期备份数据库**（SQLite 文件）
5. **限流保护**（可选，使用 Railway/Render 的限流功能）

---

## 📊 监控和日志

### Vercel Analytics
免费的性能监控，自动启用

### Railway Logs
实时查看后端日志：
```bash
railway logs
```

### Sentry（可选）
错误追踪和性能监控：
1. 注册 [Sentry.io](https://sentry.io)
2. 添加 DSN 到环境变量
3. 前端已集成，自动上报错误

---

## 💰 成本估算

### 免费方案
- Vercel: 免费 100GB 带宽/月
- Railway: 免费 $5/月额度
- Render: 免费 750 小时/月
- **总计**: $0/月（足够个人/小型项目使用）

### 付费升级（流量增长后）
- Vercel Pro: $20/月
- Railway Pro: $5-20/月（按使用量）
- 自定义域名: $10-15/年

---

## 🆘 常见问题

### Q: 部署后 API 404？
A: 检查 Vite 配置中的 API 代理是否正确，环境变量 `VITE_API_BASE_URL` 是否设置。

### Q: Google OAuth 回调失败？
A: 确保在 Google Cloud Console 中添加了正确的重定向 URI。

### Q: 数据库迁移？
A: SQLite 文件在 `Self_AI_Agent/self_agent.db`，可以直接复制到服务器。

### Q: 如何更新代码？
A: 推送到 GitHub 后，Vercel/Railway 会自动重新部署。

---

## 📞 支持

如有问题，请：
1. 查看部署平台的日志
2. 检查浏览器控制台错误
3. 参考本指南的故障排查部分

---

**祝部署顺利！🎉**
