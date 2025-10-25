#!/bin/bash
###############################################################################
# Soma ML Backend - 快速部署脚本
# 版本: Phase 7 Production Ready
# 用途: 一键部署生产环境
###############################################################################

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印函数
print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查是否以root运行
check_root() {
    if [ "$EUID" -eq 0 ]; then 
        print_error "请不要以root用户运行此脚本"
        exit 1
    fi
}

# 检查系统要求
check_requirements() {
    print_header "检查系统要求"
    
    # 检查Python
    if command -v python3.11 &> /dev/null; then
        print_success "Python 3.11+ 已安装"
    else
        print_error "Python 3.11+ 未安装"
        exit 1
    fi
    
    # 检查Docker
    if command -v docker &> /dev/null; then
        print_success "Docker 已安装"
    else
        print_warning "Docker 未安装 (可选)"
    fi
    
    # 检查磁盘空间
    available=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$available" -gt 50 ]; then
        print_success "磁盘空间充足 (${available}GB 可用)"
    else
        print_error "磁盘空间不足 (需要至少50GB)"
        exit 1
    fi
    
    # 检查内存
    total_mem=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$total_mem" -ge 8 ]; then
        print_success "内存充足 (${total_mem}GB)"
    else
        print_warning "内存不足 (推荐至少8GB)"
    fi
}

# 创建目录结构
setup_directories() {
    print_header "创建目录结构"
    
    BASE_DIR="$HOME/soma"
    
    mkdir -p $BASE_DIR/{app,logs,models,data,backups,monitoring}
    mkdir -p $BASE_DIR/models/{emotions,reasoning,embeddings}
    mkdir -p $BASE_DIR/data/{cache,neo4j}
    
    print_success "目录结构已创建"
}

# 安装系统依赖
install_system_dependencies() {
    print_header "安装系统依赖"
    
    if command -v apt-get &> /dev/null; then
        print_info "检测到Debian/Ubuntu系统"
        sudo apt-get update
        sudo apt-get install -y \
            python3.11-dev \
            python3-pip \
            build-essential \
            git \
            curl \
            wget \
            postgresql-client \
            redis-tools
        print_success "系统依赖安装完成"
    elif command -v yum &> /dev/null; then
        print_info "检测到CentOS/RHEL系统"
        sudo yum install -y \
            python311-devel \
            gcc \
            gcc-c++ \
            git \
            curl \
            wget
        print_success "系统依赖安装完成"
    else
        print_warning "未识别的包管理器,跳过系统依赖安装"
    fi
}

# 克隆代码
clone_repository() {
    print_header "克隆代码仓库"
    
    REPO_DIR="$HOME/soma/app/Soma"
    
    if [ -d "$REPO_DIR" ]; then
        print_info "代码已存在,拉取最新代码..."
        cd $REPO_DIR
        git pull
    else
        print_info "克隆代码仓库..."
        cd $HOME/soma/app
        git clone https://github.com/mzpatrick0529-mzyh/Soma.git
    fi
    
    print_success "代码仓库就绪"
}

# 设置Python环境
setup_python_env() {
    print_header "设置Python虚拟环境"
    
    cd $HOME/soma/app/Soma/Self_AI_Agent
    
    if [ -d "venv" ]; then
        print_info "虚拟环境已存在"
    else
        print_info "创建虚拟环境..."
        python3.11 -m venv venv
    fi
    
    source venv/bin/activate
    
    print_info "升级pip..."
    pip install --upgrade pip setuptools wheel
    
    print_info "安装Python依赖..."
    pip install -r requirements.txt
    
    print_success "Python环境设置完成"
}

# 下载模型
download_models() {
    print_header "下载ML模型"
    
    MODEL_DIR="$HOME/soma/models"
    
    # GoEmotions模型
    if [ -d "$MODEL_DIR/emotions/go_emotions" ]; then
        print_info "GoEmotions模型已存在,跳过"
    else
        print_info "下载GoEmotions模型 (约500MB)..."
        python3 << EOF
from transformers import AutoTokenizer, AutoModelForSequenceClassification
model_name = "SamLowe/roberta-base-go_emotions"
save_path = "$MODEL_DIR/emotions/go_emotions"
print(f"Downloading {model_name}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)
tokenizer.save_pretrained(save_path)
model.save_pretrained(save_path)
print(f"✅ Saved to {save_path}")
EOF
        print_success "GoEmotions模型下载完成"
    fi
    
    # RoBERTa模型
    if [ -d "$MODEL_DIR/reasoning/roberta_causal" ]; then
        print_info "RoBERTa模型已存在,跳过"
    else
        print_info "下载RoBERTa模型 (约500MB)..."
        python3 << EOF
from transformers import AutoTokenizer, AutoModelForSequenceClassification
model_name = "roberta-base"
save_path = "$MODEL_DIR/reasoning/roberta_causal"
print(f"Downloading {model_name}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=3)
tokenizer.save_pretrained(save_path)
model.save_pretrained(save_path)
print(f"✅ Saved to {save_path}")
EOF
        print_success "RoBERTa模型下载完成"
    fi
    
    # Sentence Embeddings
    if [ -d "$MODEL_DIR/embeddings/minilm" ]; then
        print_info "Embeddings模型已存在,跳过"
    else
        print_info "下载Sentence Embeddings (约100MB)..."
        python3 << EOF
from sentence_transformers import SentenceTransformer
model_name = "all-MiniLM-L6-v2"
save_path = "$MODEL_DIR/embeddings/minilm"
print(f"Downloading {model_name}...")
model = SentenceTransformer(model_name)
model.save(save_path)
print(f"✅ Saved to {save_path}")
EOF
        print_success "Embeddings模型下载完成"
    fi
}

# 启动数据库服务
start_databases() {
    print_header "启动数据库服务"
    
    # 启动Redis (Docker)
    if ! docker ps | grep -q redis; then
        print_info "启动Redis..."
        docker run -d \
            --name redis \
            -p 6379:6379 \
            -v $HOME/soma/data/redis:/data \
            redis:7-alpine \
            redis-server --appendonly yes
        print_success "Redis已启动"
    else
        print_info "Redis已在运行"
    fi
    
    # 启动Neo4j (Docker)
    if ! docker ps | grep -q neo4j; then
        print_info "启动Neo4j..."
        docker run -d \
            --name neo4j \
            -p 7474:7474 \
            -p 7687:7687 \
            -e NEO4J_AUTH=neo4j/soma_password \
            -v $HOME/soma/data/neo4j:/data \
            neo4j:5-community
        sleep 10
        print_success "Neo4j已启动"
    else
        print_info "Neo4j已在运行"
    fi
    
    print_success "数据库服务就绪"
}

# 配置环境变量
setup_env() {
    print_header "配置环境变量"
    
    ENV_FILE="$HOME/soma/.env"
    
    if [ -f "$ENV_FILE" ]; then
        print_info "环境配置已存在"
    else
        cat > $ENV_FILE << 'EOF'
# Soma ML Backend Environment Configuration

# Application
NODE_ENV=production
APP_NAME=Self_AI_Agent
APP_VERSION=7.0.0

# Server
PORT=8000
HOST=0.0.0.0
WORKERS=4

# Database
DATABASE_URL=postgresql://soma:password@localhost:5432/soma_production
REDIS_URL=redis://localhost:6379/0
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=soma_password

# ML Models
MODEL_DIR=/home/$USER/soma/models
CACHE_DIR=/home/$USER/soma/data/cache
HF_HOME=/home/$USER/soma/models/huggingface

# Performance
MAX_WORKERS=8
CACHE_TTL=3600
BATCH_SIZE=32

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=INFO
EOF
        print_success "环境配置已创建: $ENV_FILE"
        print_warning "请根据实际情况修改配置"
    fi
}

# 运行健康检查
health_check() {
    print_header "健康检查"
    
    # 检查Redis
    if redis-cli ping &> /dev/null; then
        print_success "Redis 连接正常"
    else
        print_error "Redis 连接失败"
    fi
    
    # 检查Neo4j
    if curl -s http://localhost:7474 &> /dev/null; then
        print_success "Neo4j 连接正常"
    else
        print_error "Neo4j 连接失败"
    fi
    
    # 检查模型
    if [ -d "$HOME/soma/models/emotions/go_emotions" ]; then
        print_success "模型文件完整"
    else
        print_error "模型文件缺失"
    fi
}

# 启动应用
start_application() {
    print_header "启动应用"
    
    cd $HOME/soma/app/Soma/Self_AI_Agent
    source venv/bin/activate
    source $HOME/soma/.env
    
    print_info "使用Gunicorn启动应用..."
    
    gunicorn \
        -c gunicorn_config.py \
        -b 0.0.0.0:8000 \
        -w 4 \
        --worker-class uvicorn.workers.UvicornWorker \
        --daemon \
        --pid $HOME/soma/soma.pid \
        --access-logfile $HOME/soma/logs/access.log \
        --error-logfile $HOME/soma/logs/error.log \
        src.server:app
    
    sleep 3
    
    if [ -f "$HOME/soma/soma.pid" ]; then
        print_success "应用已启动 (PID: $(cat $HOME/soma/soma.pid))"
        print_info "访问: http://localhost:8000"
        print_info "健康检查: curl http://localhost:8000/health"
    else
        print_error "应用启动失败"
    fi
}

# 显示摘要
show_summary() {
    print_header "部署完成"
    
    cat << EOF
${GREEN}🎉 Soma ML Backend 部署成功!${NC}

📦 部署信息:
   应用目录: $HOME/soma/app/Soma/Self_AI_Agent
   模型目录: $HOME/soma/models
   日志目录: $HOME/soma/logs
   配置文件: $HOME/soma/.env

🚀 服务端点:
   应用地址: http://localhost:8000
   健康检查: http://localhost:8000/health
   Neo4j浏览器: http://localhost:7474
   Redis端口: 6379

📊 下一步:
   1. 修改环境配置: nano $HOME/soma/.env
   2. 运行负载测试: cd tests && locust -f load_test_comprehensive.py
   3. 查看日志: tail -f $HOME/soma/logs/error.log
   4. 停止应用: kill \$(cat $HOME/soma/soma.pid)

📖 完整文档: 
   PRODUCTION_DEPLOYMENT_GUIDE.md

${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}
EOF
}

# 主流程
main() {
    clear
    echo -e "${BLUE}"
    cat << "EOF"
   _____ ____  __  __          __  __ _      
  / ____/ __ \|  \/  |   /\   |  \/  | |     
 | (___| |  | | \  / |  /  \  | \  / | |     
  \___ \ |  | | |\/| | / /\ \ | |\/| | |     
  ____) | |__| | |  | |/ ____ \| |  | | |____ 
 |_____/ \____/|_|  |_/_/    \_\_|  |_|______|
                                              
   ML Backend - 生产环境部署脚本 v7.0.0
EOF
    echo -e "${NC}\n"
    
    check_root
    check_requirements
    setup_directories
    install_system_dependencies
    clone_repository
    setup_python_env
    download_models
    start_databases
    setup_env
    health_check
    
    read -p "是否立即启动应用? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        start_application
    else
        print_info "跳过应用启动"
    fi
    
    show_summary
}

# 执行主流程
main "$@"
