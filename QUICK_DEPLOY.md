# 🚀 快速开始 - 3 步上线

## 方法 1: 一键部署（推荐）

### [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/soma)

点击按钮后：
1. 登录 Vercel
2. 连接 GitHub 仓库
3. 添加环境变量（见下方）
4. 点击 Deploy

### 环境变量配置

**前端（Vercel）:**
```env
VITE_API_BASE_URL=你的后端URL/api
VITE_SELF_AGENT_API_BASE_URL=你的后端URL
```

**后端（Railway）:**
```env
NODE_ENV=production
GEMINI_API_KEY=你的Gemini密钥
GOOGLE_CLIENT_ID=你的GoogleOAuth_ID
GOOGLE_CLIENT_SECRET=你的GoogleOAuth_Secret
JWT_SECRET=随机生成的32位字符串
```

---

## 方法 2: 使用脚本部署

### 步骤 1: 克隆仓库
```bash
git clone https://github.com/你的用户名/soma.git
cd soma
```

### 步骤 2: 安装依赖
```bash
npm install
cd Self_AI_Agent && npm install && cd ..
```

### 步骤 3: 运行部署脚本
```bash
# Vercel 部署
./auto-deploy.sh vercel

# Railway 部署
./auto-deploy.sh railway

# Docker 部署
./auto-deploy.sh docker
```

---

## 方法 3: 手动部署

详细步骤请查看: [完整部署指南](./DEPLOYMENT_GUIDE.md)

---

## 📊 部署状态

| 服务 | 状态 | URL |
|------|------|-----|
| 前端 | [![Vercel](https://vercelbadge.vercel.app/api/你的用户名/soma)](https://soma.vercel.app) | https://soma.vercel.app |
| 后端 | [![Railway](https://railway.app/button.svg)](https://soma-backend.railway.app) | https://soma-backend.railway.app |

---

## 🔍 部署验证

部署完成后，运行验证脚本：

```bash
./verify-deployment-online.sh https://你的前端域名 https://你的后端域名
```

期望输出：
```
🔍 Soma 部署验证
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
前端检查
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
检查 首页... ✓ 成功 (HTTP 200)
检查 robots.txt... ✓ 成功 (HTTP 200)
检查 sitemap.xml... ✓ 成功 (HTTP 200)

后端检查
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
检查 健康检查... ✓ 成功 (HTTP 200)
检查 Provider 信息... ✓ API 响应正常

🎉 所有检查通过！应用已成功部署
```

---

## 📱 访问你的应用

部署成功后，你的应用将在以下地址可访问：

- **生产环境**: https://你的域名.vercel.app
- **API 端点**: https://你的域名.railway.app/api
- **健康检查**: https://你的域名.railway.app/health

---

## 🌐 自定义域名（可选）

### 1. 在 Vercel 添加域名
1. 项目设置 → Domains
2. 输入你的域名（如 soma.com）
3. 按照提示添加 DNS 记录

### 2. 在 Railway 添加域名
1. 项目设置 → Settings → Domains
2. 点击 Generate Domain 或添加自定义域名

### 3. 配置 DNS
在域名服务商处添加以下记录：
```
CNAME www.yourdomain.com → cname.vercel-dns.com
CNAME api.yourdomain.com → 你的Railway域名
```

---

## 📈 SEO 与搜索引擎收录

### 自动提交 Sitemap

你的网站已包含以下 SEO 文件：
- `/robots.txt` - 搜索引擎爬虫指令
- `/sitemap.xml` - 网站结构地图
- `/manifest.json` - PWA 配置

### 提交到搜索引擎

1. **Google Search Console**
   - 访问: https://search.google.com/search-console
   - 添加网站并验证所有权
   - 提交 sitemap: `https://你的域名/sitemap.xml`

2. **Bing Webmaster Tools**
   - 访问: https://www.bing.com/webmasters
   - 添加网站并提交 sitemap

3. **百度站长平台**（如需）
   - 访问: https://ziyuan.baidu.com
   - 提交网站并等待收录

### 预期收录时间
- Google: 1-3 天
- Bing: 3-7 天
- 百度: 1-2 周

---

## 🔧 故障排查

### 前端无法访问后端

**症状**: 控制台显示 CORS 错误或 404

**解决方案**:
1. 检查 `vercel.json` 中的 rewrites 配置
2. 确认后端 URL 环境变量正确
3. 检查后端 CORS 配置允许前端域名

### 部署后页面空白

**症状**: 页面加载但显示空白

**解决方案**:
1. 打开浏览器控制台查看错误
2. 确认环境变量已正确设置
3. 检查 Vite 构建是否成功

### Google OAuth 失败

**症状**: 登录时重定向到错误页面

**解决方案**:
1. 在 Google Cloud Console 中添加正确的重定向 URI
2. 确认 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 正确
3. 检查 `GOOGLE_REDIRECT_URI` 环境变量

---

## 💰 成本估算

### 免费方案（适合个人/小型项目）
- **Vercel**: 免费 100GB 带宽/月
- **Railway**: 免费 $5/月额度（约 500 小时运行时间）
- **总计**: $0/月

### 付费升级（流量增长后）
- **Vercel Pro**: $20/月（无限带宽）
- **Railway Pro**: $5-20/月（按实际使用量）
- **自定义域名**: $10-15/年

---

## 📞 获取帮助

- 📖 [完整部署文档](./DEPLOYMENT_GUIDE.md)
- 🐛 [问题追踪](https://github.com/你的用户名/soma/issues)
- 💬 [社区讨论](https://github.com/你的用户名/soma/discussions)

---

**准备好了吗？点击上方的"Deploy with Vercel"按钮开始吧！🚀**
