# 🚀 Soma 快速部署 - 立即上线！

## 🎯 最快速的方式（5分钟上线）

### 方案 A: Vercel + Railway（推荐）

#### 第 1 步: 部署后端（2分钟）

1. 访问 https://railway.app
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的 `Soma_V0` 仓库
5. **重要**: 设置 Root Directory 为 `Self_AI_Agent`
6. 添加环境变量：

```bash
NODE_ENV=production
PORT=8787
GEMINI_API_KEY=你的Gemini_API密钥
JWT_SECRET=任意32位随机字符串
```

7. 点击 "Deploy"
8. 复制生成的 URL（例如: `https://soma-backend-production.up.railway.app`）

#### 第 2 步: 部署前端（2分钟）

1. 访问 https://vercel.com
2. 点击 "Add New" → "Project"
3. 选择你的 `Soma_V0` 仓库
4. Framework Preset: 自动检测 Vite
5. 添加环境变量：

```bash
VITE_API_BASE_URL=你的Railway后端URL/api
VITE_SELF_AGENT_API_BASE_URL=你的Railway后端URL
```

6. 点击 "Deploy"
7. 等待部署完成（约1-2分钟）

#### 第 3 步: 配置 Google OAuth（1分钟）

1. 访问 https://console.cloud.google.com
2. 创建 OAuth 2.0 凭据
3. 添加授权重定向 URI：
   ```
   你的Railway后端URL/auth/google/callback
   ```
4. 复制 Client ID 和 Secret
5. 在 Railway 中添加环境变量：
   ```
   GOOGLE_CLIENT_ID=你的Client_ID
   GOOGLE_CLIENT_SECRET=你的Client_Secret
   GOOGLE_REDIRECT_URI=你的Railway后端URL/auth/google/callback
   ```

### ✅ 完成！

访问你的 Vercel URL，应用已经上线了！🎉

---

## 🛠️ 方案 B: 使用自动化脚本

### 准备工作

```bash
cd /Users/patrick_ma/Soma/Soma_V0

# 安装 Vercel CLI
npm install -g vercel

# 安装 Railway CLI (可选)
npm install -g @railway/cli
```

### 运行部署脚本

```bash
# 一键部署到 Vercel
./auto-deploy.sh vercel

# 或部署到 Railway
./auto-deploy.sh railway

# 或使用 Docker
./auto-deploy.sh docker
```

---

## 🐳 方案 C: Docker 自托管（适合有服务器的情况）

### 1. 准备服务器

需要一台 Linux 服务器（VPS），例如：
- DigitalOcean Droplet ($5/月起)
- AWS EC2 Free Tier (12个月免费)
- 阿里云 ECS (按量付费)

### 2. 安装 Docker

```bash
# SSH 连接到服务器
ssh root@你的服务器IP

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 上传代码并部署

```bash
# 在本地打包代码
cd /Users/patrick_ma/Soma/Soma_V0
tar -czf soma.tar.gz --exclude=node_modules --exclude=dist .

# 上传到服务器
scp soma.tar.gz root@你的服务器IP:/root/

# 在服务器上解压并部署
ssh root@你的服务器IP
cd /root
tar -xzf soma.tar.gz
cd Soma_V0

# 创建环境变量文件
cp .env.production.example .env.production
# 编辑 .env.production 填入真实值
nano .env.production

# 启动服务
docker-compose up -d
```

### 4. 配置域名（可选）

安装 Nginx 或 Caddy 作为反向代理：

```bash
# 使用 Caddy (自动 HTTPS)
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy

# 配置 Caddyfile
sudo nano /etc/caddy/Caddyfile
```

添加以下内容：

```caddyfile
yourdomain.com {
    reverse_proxy localhost:80
}

api.yourdomain.com {
    reverse_proxy localhost:8787
}
```

重启 Caddy:
```bash
sudo systemctl restart caddy
```

---

## 📊 部署后验证

运行验证脚本确保一切正常：

```bash
./verify-deployment-online.sh https://你的域名 https://你的后端域名
```

期望输出：
```
🔍 Soma 部署验证
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 所有检查通过！
🎉 应用已成功部署
```

---

## 🌐 让搜索引擎收录你的网站

### 1. 提交到 Google

1. 访问 https://search.google.com/search-console
2. 添加资源（输入你的域名）
3. 验证所有权（HTML 文件或 DNS 记录）
4. 提交 Sitemap: `https://你的域名/sitemap.xml`

**预计收录时间**: 1-3天

### 2. 提交到 Bing

1. 访问 https://www.bing.com/webmasters
2. 添加网站并验证
3. 提交 Sitemap

**预计收录时间**: 3-7天

### 3. 加速收录技巧

- 在社交媒体分享你的网站链接
- 在相关论坛、博客中提及
- 获取外部链接（Backlinks）
- 定期更新内容

---

## 💰 成本对比

| 方案 | 免费额度 | 付费价格 | 适合场景 |
|------|----------|----------|----------|
| **Vercel + Railway** | 前端免费无限，后端$5/月 | $20-50/月 | 个人项目，快速上线 |
| **Render** | 750小时/月 | $7-25/月 | 小型项目 |
| **Docker VPS** | 无 | $5-20/月 | 完全控制，长期运营 |

**推荐**: 先用免费方案，有流量后再升级

---

## 🆘 常见问题

### Q: 部署后前端显示空白？
A: 
1. 打开浏览器控制台查看错误
2. 检查环境变量 `VITE_API_BASE_URL` 是否正确
3. 确认后端 URL 可访问

### Q: API 请求 404 错误？
A:
1. 检查 `vercel.json` 中的 rewrites 配置
2. 确认后端 URL 是否包含 `/api` 前缀
3. 查看 Vercel Functions 日志

### Q: Google OAuth 回调失败？
A:
1. 在 Google Cloud Console 中添加正确的重定向 URI
2. 确保使用 HTTPS（不能是 HTTP）
3. 检查环境变量 `GOOGLE_REDIRECT_URI` 与实际回调地址一致

### Q: Railway 部署失败？
A:
1. 检查 Root Directory 是否设置为 `Self_AI_Agent`
2. 确认 `package.json` 中有 `build` 和 `start` 命令
3. 查看 Railway 日志找到具体错误

---

## 📞 获取帮助

- 📖 完整文档: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- ✅ 检查清单: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- 🐛 问题反馈: GitHub Issues

---

## 🎉 下一步

部署完成后，你可以：

1. **分享给朋友**: 发送你的网站链接
2. **自定义域名**: 购买域名并绑定
3. **监控性能**: 使用 Vercel Analytics
4. **持续优化**: 根据用户反馈改进

---

**准备好了吗？选择一个方案，立即开始部署！🚀**
