#!/bin/bash

###############################################################################
# Soma 一键部署脚本
# 用途: 在新的云服务器上快速部署 Soma 应用
# 使用: bash deploy.sh
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 标题
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║             🚀 Soma 自动部署脚本 v1.0                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 检查是否为 root 用户
if [ "$EUID" -eq 0 ]; then 
    print_warning "请不要使用 root 用户运行此脚本"
    exit 1
fi

# 步骤1: 系统更新
print_info "步骤1/10: 更新系统软件包..."
sudo apt update && sudo apt upgrade -y
print_success "系统更新完成"

# 步骤2: 安装基础工具
print_info "步骤2/10: 安装基础工具..."
sudo apt install -y curl wget git vim htop ufw
print_success "基础工具安装完成"

# 步骤3: 安装 Node.js
print_info "步骤3/10: 安装 Node.js 20 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js 安装完成: $(node --version)"
else
    print_success "Node.js 已安装: $(node --version)"
fi

# 步骤4: 安装 PM2
print_info "步骤4/10: 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 安装完成: $(pm2 --version)"
else
    print_success "PM2 已安装: $(pm2 --version)"
fi

# 步骤5: 安装 Nginx
print_info "步骤5/10: 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx 安装完成"
else
    print_success "Nginx 已安装"
fi

# 步骤6: 配置防火墙
print_info "步骤6/10: 配置防火墙..."
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
print_success "防火墙配置完成"

# 步骤7: 克隆代码
print_info "步骤7/10: 准备项目目录..."
PROJECT_DIR="/home/$USER/soma"

if [ -d "$PROJECT_DIR" ]; then
    print_warning "项目目录已存在，跳过克隆"
else
    print_info "请选择代码获取方式:"
    echo "  1) Git克隆 (需要GitHub访问权限)"
    echo "  2) 手动上传 (稍后使用SCP上传)"
    read -p "请选择 [1/2]: " choice
    
    if [ "$choice" = "1" ]; then
        read -p "请输入 Git 仓库地址: " repo_url
        git clone "$repo_url" "$PROJECT_DIR"
        print_success "代码克隆完成"
    else
        mkdir -p "$PROJECT_DIR"
        print_warning "请使用以下命令上传代码:"
        echo "  scp -r /本地路径/Soma_V0 $USER@$(hostname -I | awk '{print $1}'):$PROJECT_DIR/"
        read -p "上传完成后按回车继续..."
    fi
fi

# 步骤8: 部署后端
print_info "步骤8/10: 部署后端服务..."
BACKEND_DIR="$PROJECT_DIR/Soma_V0/Self_AI_Agent"

if [ ! -d "$BACKEND_DIR" ]; then
    print_error "后端目录不存在，请确认代码已上传"
    exit 1
fi

cd "$BACKEND_DIR"

# 安装依赖
print_info "安装后端依赖..."
npm install

# 配置环境变量
if [ ! -f ".env" ]; then
    print_warning "未找到 .env 文件，正在创建..."
    read -p "请输入 OpenAI API Key: " openai_key
    cat > .env <<EOF
OPENAI_API_KEY=$openai_key
PORT=8787
DATABASE_PATH=$BACKEND_DIR/self_agent.db
EOF
    print_success ".env 文件创建完成"
fi

# 构建
print_info "构建后端..."
npm run build

# 启动服务
print_info "启动后端服务..."
pm2 delete soma-backend 2>/dev/null || true
pm2 start dist/server.js --name soma-backend
pm2 save
pm2 startup | grep sudo | bash
print_success "后端服务启动完成"

# 步骤9: 部署前端
print_info "步骤9/10: 部署前端..."
FRONTEND_DIR="$PROJECT_DIR/Soma_V0"

cd "$FRONTEND_DIR"

# 安装依赖
print_info "安装前端依赖..."
npm install

# 构建
print_info "构建前端..."
npm run build

# 配置 Nginx
print_info "配置 Nginx..."
SERVER_IP=$(hostname -I | awk '{print $1}')

sudo tee /etc/nginx/sites-available/soma > /dev/null <<EOF
server {
    listen 80;
    server_name $SERVER_IP;

    root $FRONTEND_DIR/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/soma /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试并重启 Nginx
sudo nginx -t
sudo systemctl restart nginx

print_success "前端部署完成"

# 步骤10: 验证部署
print_info "步骤10/10: 验证部署..."

# 检查后端
if curl -s http://localhost:8787/health > /dev/null; then
    print_success "后端健康检查通过"
else
    print_error "后端健康检查失败"
fi

# 检查 Nginx
if curl -s http://localhost > /dev/null; then
    print_success "Nginx 检查通过"
else
    print_error "Nginx 检查失败"
fi

# 完成
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                  🎉 部署完成！                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${BLUE}📊 部署信息:${NC}"
echo -e "  服务器IP: ${GREEN}$SERVER_IP${NC}"
echo -e "  前端地址: ${GREEN}http://$SERVER_IP${NC}"
echo -e "  后端地址: ${GREEN}http://$SERVER_IP:8787${NC}"
echo ""
echo -e "${BLUE}🔧 管理命令:${NC}"
echo -e "  查看后端状态: ${YELLOW}pm2 status${NC}"
echo -e "  查看后端日志: ${YELLOW}pm2 logs soma-backend${NC}"
echo -e "  重启后端: ${YELLOW}pm2 restart soma-backend${NC}"
echo -e "  重启Nginx: ${YELLOW}sudo systemctl restart nginx${NC}"
echo ""
echo -e "${BLUE}📚 下一步:${NC}"
echo -e "  1. 浏览器访问 ${GREEN}http://$SERVER_IP${NC}"
echo -e "  2. 配置域名 (可选)"
echo -e "  3. 配置 SSL 证书 (可选)"
echo ""
echo -e "${YELLOW}⚠️  注意: 请确保在云服务器控制台的安全组中开放 80、443 端口${NC}"
echo ""
