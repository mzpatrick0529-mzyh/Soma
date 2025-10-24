# 🚀 快速部署脚本 - Vercel + Railway

## 先决条件检查
echo "检查部署前置条件..."

# 1. 检查 Git 状态
if [ ! -d .git ]; then
    echo "❌ 未检测到 Git 仓库，正在初始化..."
    git init
    git add .
    git commit -m "Initial commit for deployment"
fi

# 2. 检查是否有远程仓库
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "⚠️  未检测到 GitHub 远程仓库"
    echo "请先创建 GitHub 仓库并运行："
    echo "  git remote add origin https://github.com/你的用户名/soma.git"
    echo "  git push -u origin main"
    exit 1
fi

# 3. 推送最新代码
echo "📤 推送最新代码到 GitHub..."
git add .
git commit -m "部署准备：更新配置文件" || true
git push origin main

echo "✅ 代码已推送到 GitHub"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 接下来请按照以下步骤手动部署："
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔸 步骤 1: 部署后端到 Railway"
echo "   1. 访问 https://railway.app"
echo "   2. 用 GitHub 登录"
echo "   3. 创建新项目 → 选择你的仓库"
echo "   4. 设置 Root Directory: Self_AI_Agent"
echo "   5. 添加环境变量（见下方）"
echo ""
echo "   必需的环境变量："
echo "   NODE_ENV=production"
echo "   PORT=8787"
echo "   GEMINI_API_KEY=你的密钥"
echo "   GOOGLE_CLIENT_ID=你的ClientID"
echo "   GOOGLE_CLIENT_SECRET=你的Secret"
echo "   JWT_SECRET=$(openssl rand -base64 32)"
echo ""
echo "   部署完成后会得到后端 URL，例如："
echo "   https://soma-backend-production.up.railway.app"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔸 步骤 2: 部署前端到 Vercel"
echo "   1. 访问 https://vercel.com"
echo "   2. 用 GitHub 登录"
echo "   3. 导入你的仓库"
echo "   4. Framework Preset: Vite"
echo "   5. 添加环境变量："
echo ""
echo "   VITE_API_BASE_URL=你的Railway后端URL/api"
echo "   VITE_SELF_AGENT_API_BASE_URL=你的Railway后端URL"
echo ""
echo "   6. 点击 Deploy"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 完成！你的网站将在几分钟内上线"
echo ""
echo "📖 详细指南请查看: docs/guides/DEPLOYMENT_GUIDE.md"
