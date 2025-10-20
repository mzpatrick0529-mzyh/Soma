#!/bin/bash

# Soma 一键部署到生产环境
# 使用方法: ./auto-deploy.sh [vercel|railway|render|docker]

set -e

DEPLOY_TARGET=${1:-"vercel"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Soma 自动部署脚本"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "目标平台: $DEPLOY_TARGET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. 检查必要工具
check_tools() {
    echo "🔍 检查必要工具..."
    
    if ! command -v git &> /dev/null; then
        echo "❌ Git 未安装，请先安装 Git"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    echo "✅ 工具检查通过"
}

# 2. 构建前端
build_frontend() {
    echo ""
    echo "📦 构建前端..."
    cd "$SCRIPT_DIR"
    
    if [ ! -d "node_modules" ]; then
        echo "安装前端依赖..."
        npm install
    fi
    
    echo "构建前端资源..."
    npm run build
    
    echo "✅ 前端构建完成"
}

# 3. 构建后端
build_backend() {
    echo ""
    echo "📦 构建后端..."
    cd "$SCRIPT_DIR/Self_AI_Agent"
    
    if [ ! -d "node_modules" ]; then
        echo "安装后端依赖..."
        npm install
    fi
    
    echo "编译 TypeScript..."
    npm run build
    
    echo "✅ 后端构建完成"
}

# 4. 提交到 Git
git_push() {
    echo ""
    echo "📤 推送代码到 GitHub..."
    cd "$SCRIPT_DIR"
    
    # 检查是否有改动
    if [[ -z $(git status -s) ]]; then
        echo "ℹ️  没有新的改动需要提交"
    else
        git add .
        git commit -m "部署: $(date '+%Y-%m-%d %H:%M:%S')" || true
        git push origin main
        echo "✅ 代码已推送"
    fi
}

# 5. Vercel 部署
deploy_vercel() {
    echo ""
    echo "🔷 部署到 Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "安装 Vercel CLI..."
        npm install -g vercel
    fi
    
    cd "$SCRIPT_DIR"
    vercel --prod
    
    echo "✅ Vercel 部署完成"
}

# 6. Railway 部署
deploy_railway() {
    echo ""
    echo "🚂 部署到 Railway..."
    
    if ! command -v railway &> /dev/null; then
        echo "安装 Railway CLI..."
        npm install -g @railway/cli
    fi
    
    cd "$SCRIPT_DIR/Self_AI_Agent"
    railway up
    
    echo "✅ Railway 部署完成"
}

# 7. Docker 部署
deploy_docker() {
    echo ""
    echo "🐳 Docker 部署..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    cd "$SCRIPT_DIR"
    
    echo "停止现有容器..."
    docker-compose down || true
    
    echo "构建并启动容器..."
    docker-compose up -d --build
    
    echo "等待容器启动..."
    sleep 10
    
    echo "检查容器状态..."
    docker-compose ps
    
    echo "✅ Docker 部署完成"
    echo ""
    echo "访问应用:"
    echo "  前端: http://localhost"
    echo "  后端: http://localhost:8787"
}

# 8. 生成部署报告
generate_report() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 部署报告"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "平台: $DEPLOY_TARGET"
    echo "Git Commit: $(git rev-parse --short HEAD)"
    echo "分支: $(git branch --show-current)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎉 部署成功！"
    echo ""
    echo "📖 查看详细文档: cat DEPLOYMENT_GUIDE.md"
}

# 主流程
main() {
    check_tools
    build_frontend
    build_backend
    git_push
    
    case $DEPLOY_TARGET in
        vercel)
            deploy_vercel
            ;;
        railway)
            deploy_railway
            ;;
        docker)
            deploy_docker
            ;;
        render)
            echo "Render 部署请访问: https://render.com"
            echo "并使用 render.yaml 配置文件"
            ;;
        *)
            echo "❌ 未知的部署目标: $DEPLOY_TARGET"
            echo "支持的选项: vercel, railway, render, docker"
            exit 1
            ;;
    esac
    
    generate_report
}

# 运行主流程
main
