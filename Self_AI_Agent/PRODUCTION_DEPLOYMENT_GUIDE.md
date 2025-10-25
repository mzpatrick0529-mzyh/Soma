# 🚀 生产环境部署指南

**版本**: Phase 7 Production Ready  
**更新日期**: 2025-10-24  
**适用系统**: Self_AI_Agent ML Backend

---

## 📋 目录

1. [系统要求](#系统要求)
2. [环境准备](#环境准备)
3. [依赖安装](#依赖安装)
4. [模型下载](#模型下载)
5. [数据库配置](#数据库配置)
6. [应用部署](#应用部署)
7. [健康检查](#健康检查)
8. [监控配置](#监控配置)
9. [性能优化](#性能优化)
10. [故障排查](#故障排查)
11. [安全配置](#安全配置)
12. [扩展指南](#扩展指南)

---

## 系统要求

### 硬件要求

#### 最小配置
- **CPU**: 4核心
- **内存**: 8 GB RAM
- **存储**: 50 GB SSD
- **网络**: 100 Mbps

#### 推荐配置
- **CPU**: 8核心 (支持AVX2指令集)
- **内存**: 16 GB RAM
- **存储**: 100 GB NVMe SSD
- **GPU** (可选): NVIDIA Tesla T4 / V100 (4GB+ VRAM)
- **网络**: 1 Gbps

#### 生产配置
- **CPU**: 16核心
- **内存**: 32 GB RAM
- **存储**: 200 GB NVMe SSD
- **GPU**: NVIDIA A100 (40GB VRAM)
- **网络**: 10 Gbps

### 软件要求

- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 11+
- **Python**: 3.11+ (必须)
- **Node.js**: 18+ (前端)
- **Docker**: 20.10+ (推荐)
- **Docker Compose**: 2.0+

### 依赖服务

- **PostgreSQL**: 14+ (主数据库)
- **Redis**: 7+ (缓存)
- **Neo4j**: 5+ (知识图谱)
- **Nginx**: 1.20+ (反向代理)

---

## 环境准备

### 1. 创建部署用户

```bash
# 创建专用用户
sudo useradd -m -s /bin/bash soma
sudo usermod -aG docker soma

# 切换到部署用户
sudo su - soma
```

### 2. 设置目录结构

```bash
# 创建应用目录
mkdir -p ~/soma/{app,logs,models,data,backups}

# 克隆代码
cd ~/soma/app
git clone https://github.com/mzpatrick0529-mzyh/Soma.git
cd Soma/Self_AI_Agent
```

### 3. 配置环境变量

```bash
# 创建环境配置
cat > ~/soma/.env << 'EOF'
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
NEO4J_PASSWORD=production_password

# ML Models
MODEL_DIR=/home/soma/soma/models
CACHE_DIR=/home/soma/soma/data/cache
HF_HOME=/home/soma/soma/models/huggingface

# Performance
MAX_WORKERS=8
CACHE_TTL=3600
BATCH_SIZE=32

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALLOWED_ORIGINS=https://yourdomain.com
API_RATE_LIMIT=1000/hour

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=INFO
EOF

# 加载环境变量
echo "source ~/soma/.env" >> ~/.bashrc
source ~/soma/.env
```

---

## 依赖安装

### 1. 系统依赖

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y \
    python3.11 \
    python3.11-dev \
    python3-pip \
    build-essential \
    git \
    curl \
    wget \
    postgresql-client \
    redis-tools \
    nginx

# CentOS/RHEL
sudo yum install -y \
    python311 \
    python311-devel \
    gcc \
    gcc-c++ \
    git \
    curl \
    wget \
    postgresql \
    redis \
    nginx
```

### 2. Python虚拟环境

```bash
# 创建虚拟环境
cd ~/soma/app/Soma/Self_AI_Agent
python3.11 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级pip
pip install --upgrade pip setuptools wheel
```

### 3. Python依赖包

```bash
# 安装生产依赖
pip install -r requirements.txt

# 额外的生产依赖
pip install \
    gunicorn==21.2.0 \
    uvicorn[standard]==0.24.0 \
    prometheus-client==0.19.0 \
    sentry-sdk==1.39.0 \
    python-multipart==0.0.6
```

### 4. ML模型依赖

```bash
# PyTorch (CPU版本)
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cpu

# 或GPU版本 (如果有NVIDIA GPU)
pip install torch==2.1.0 torchvision==0.16.0 --index-url https://download.pytorch.org/whl/cu118

# Transformers
pip install transformers==4.35.0 \
    sentence-transformers==2.2.2 \
    accelerate==0.25.0
```

### 5. 验证安装

```bash
# 检查Python版本
python --version  # 应显示 Python 3.11.x

# 检查关键包
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
python -c "import redis; print('Redis: OK')"
python -c "import psycopg2; print('PostgreSQL: OK')"
```

---

## 模型下载

### 1. 创建模型目录

```bash
mkdir -p ~/soma/models/{emotions,reasoning,embeddings}
```

### 2. 下载预训练模型

#### GoEmotions (情感识别)

```bash
cd ~/soma/models/emotions

# 方法1: 使用huggingface-cli
huggingface-cli download SamLowe/roberta-base-go_emotions-onnx --local-dir ./go_emotions

# 方法2: Python脚本
python << 'EOF'
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "SamLowe/roberta-base-go_emotions"
save_path = "/home/soma/soma/models/emotions/go_emotions"

print(f"Downloading {model_name}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

tokenizer.save_pretrained(save_path)
model.save_pretrained(save_path)
print(f"✅ Saved to {save_path}")
EOF
```

#### RoBERTa (因果推理)

```bash
cd ~/soma/models/reasoning

python << 'EOF'
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_name = "roberta-base"
save_path = "/home/soma/soma/models/reasoning/roberta_causal"

print(f"Downloading {model_name}...")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=3  # causal, correlation, none
)

tokenizer.save_pretrained(save_path)
model.save_pretrained(save_path)
print(f"✅ Saved to {save_path}")
EOF
```

#### Sentence Embeddings

```bash
cd ~/soma/models/embeddings

python << 'EOF'
from sentence_transformers import SentenceTransformer

model_name = "all-MiniLM-L6-v2"
save_path = "/home/soma/soma/models/embeddings/minilm"

print(f"Downloading {model_name}...")
model = SentenceTransformer(model_name)
model.save(save_path)
print(f"✅ Saved to {save_path}")
EOF
```

### 3. 验证模型

```bash
# 检查模型文件
ls -lh ~/soma/models/emotions/go_emotions/
ls -lh ~/soma/models/reasoning/roberta_causal/
ls -lh ~/soma/models/embeddings/minilm/

# 测试模型加载
python << 'EOF'
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model_path = "/home/soma/soma/models/emotions/go_emotions"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSequenceClassification.from_pretrained(model_path)

print("✅ GoEmotions model loaded successfully")
print(f"   Vocab size: {len(tokenizer)}")
print(f"   Labels: {model.config.num_labels}")
EOF
```

### 4. 模型大小统计

```bash
# 查看模型存储占用
du -sh ~/soma/models/*

# 预期大小:
# emotions/   ~500 MB
# reasoning/  ~500 MB  
# embeddings/ ~100 MB
# Total:      ~1.1 GB
```

---

## 数据库配置

### 1. PostgreSQL 设置

#### 安装 PostgreSQL

```bash
# Ubuntu
sudo apt-get install -y postgresql-14 postgresql-contrib-14

# CentOS
sudo yum install -y postgresql14-server postgresql14-contrib

# 初始化数据库
sudo postgresql-setup --initdb

# 启动服务
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### 创建数据库和用户

```bash
# 切换到postgres用户
sudo -u postgres psql

-- 在psql中执行:
CREATE DATABASE soma_production;
CREATE USER soma WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE soma_production TO soma;

-- 退出psql
\q
```

#### 配置pg_hba.conf

```bash
# 编辑配置文件
sudo nano /etc/postgresql/14/main/pg_hba.conf

# 添加以下行:
# local   soma_production   soma                  md5
# host    soma_production   soma   127.0.0.1/32   md5

# 重启PostgreSQL
sudo systemctl restart postgresql
```

#### 运行数据库迁移

```bash
cd ~/soma/app/Soma/Self_AI_Agent

# 执行迁移脚本
python << 'EOF'
import psycopg2
from pathlib import Path

DATABASE_URL = "postgresql://soma:secure_password_here@localhost:5432/soma_production"

# 连接数据库
conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

# 创建表结构
schema_sql = """
-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 情感分析记录
CREATE TABLE IF NOT EXISTS emotion_analyses (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    emotions JSONB NOT NULL,
    valence FLOAT,
    arousal FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 推理提取记录
CREATE TABLE IF NOT EXISTS reasoning_extractions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    causal_chains JSONB,
    reasoning_graph JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 用户画像
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    profile_data JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_emotions_user_id ON emotion_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_emotions_created_at ON emotion_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_reasoning_user_id ON reasoning_extractions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON user_profiles(user_id);
"""

cursor.execute(schema_sql)
conn.commit()

print("✅ Database schema created successfully")

cursor.close()
conn.close()
EOF
```

### 2. Redis 设置

```bash
# 安装Redis
sudo apt-get install -y redis-server

# 配置Redis
sudo nano /etc/redis/redis.conf

# 修改以下配置:
# maxmemory 2gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10

# 重启Redis
sudo systemctl restart redis
sudo systemctl enable redis

# 测试连接
redis-cli ping  # 应返回 PONG
```

### 3. Neo4j 设置

```bash
# 使用Docker运行Neo4j
docker run -d \
    --name neo4j \
    -p 7474:7474 \
    -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/production_password \
    -e NEO4J_dbms_memory_heap_initial__size=1G \
    -e NEO4J_dbms_memory_heap_max__size=2G \
    -v ~/soma/data/neo4j:/data \
    neo4j:5-community

# 等待启动
sleep 30

# 验证连接
curl http://localhost:7474

# 创建初始约束
python << 'EOF'
from neo4j import GraphDatabase

uri = "bolt://localhost:7687"
auth = ("neo4j", "production_password")

driver = GraphDatabase.driver(uri, auth=auth)

with driver.session() as session:
    # 创建约束
    session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE")
    session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (e:Emotion) REQUIRE e.name IS UNIQUE")
    session.run("CREATE CONSTRAINT IF NOT EXISTS FOR (r:Reasoning) REQUIRE r.id IS UNIQUE")
    
    print("✅ Neo4j constraints created")

driver.close()
EOF
```

---

## 应用部署

### 1. 配置应用

```bash
cd ~/soma/app/Soma/Self_AI_Agent

# 复制配置文件
cp config.example.py config.py

# 编辑配置
nano config.py
```

### 2. 使用Gunicorn部署

创建Gunicorn配置文件:

```bash
cat > ~/soma/app/Soma/Self_AI_Agent/gunicorn_config.py << 'EOF'
"""Gunicorn配置文件"""

import multiprocessing

# 服务器绑定
bind = "0.0.0.0:8000"

# Worker配置
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50

# 超时
timeout = 120
graceful_timeout = 30
keepalive = 5

# 日志
accesslog = "/home/soma/soma/logs/access.log"
errorlog = "/home/soma/soma/logs/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# 进程命名
proc_name = "soma_ml_backend"

# 守护进程
daemon = False
pidfile = "/home/soma/soma/soma.pid"

# 性能
preload_app = True
worker_tmp_dir = "/dev/shm"
EOF
```

### 3. 创建Systemd服务

```bash
sudo nano /etc/systemd/system/soma-ml.service
```

内容:

```ini
[Unit]
Description=Soma ML Backend Service
After=network.target postgresql.service redis.service

[Service]
Type=notify
User=soma
Group=soma
WorkingDirectory=/home/soma/soma/app/Soma/Self_AI_Agent
Environment="PATH=/home/soma/soma/app/Soma/Self_AI_Agent/venv/bin"
EnvironmentFile=/home/soma/soma/.env
ExecStart=/home/soma/soma/app/Soma/Self_AI_Agent/venv/bin/gunicorn \
    -c /home/soma/soma/app/Soma/Self_AI_Agent/gunicorn_config.py \
    src.server:app
ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

启动服务:

```bash
# 重载systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start soma-ml

# 开机自启
sudo systemctl enable soma-ml

# 查看状态
sudo systemctl status soma-ml

# 查看日志
sudo journalctl -u soma-ml -f
```

### 4. 配置Nginx反向代理

```bash
sudo nano /etc/nginx/sites-available/soma-ml
```

内容:

```nginx
upstream soma_backend {
    server 127.0.0.1:8000;
    keepalive 32;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # 请求大小限制
    client_max_body_size 10M;

    # 日志
    access_log /var/log/nginx/soma_access.log;
    error_log /var/log/nginx/soma_error.log;

    # 健康检查
    location /health {
        proxy_pass http://soma_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        access_log off;
    }

    # API路由
    location /api/ {
        proxy_pass http://soma_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 缓冲配置
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # 限流
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
    limit_req zone=api_limit burst=200 nodelay;
}
```

启用站点:

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/soma-ml /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

## 健康检查

### 1. 应用健康检查

```bash
# 基础健康检查
curl http://localhost:8000/health

# 详细健康检查
curl http://localhost:8000/health/detailed

# 就绪检查
curl http://localhost:8000/health/ready

# 存活检查
curl http://localhost:8000/health/live
```

### 2. 数据库健康检查

```bash
# PostgreSQL
psql -h localhost -U soma -d soma_production -c "SELECT version();"

# Redis
redis-cli ping

# Neo4j
curl http://localhost:7474/db/neo4j/tx/commit \
    -H "Content-Type: application/json" \
    -d '{"statements":[{"statement":"RETURN 1"}]}'
```

### 3. 模型健康检查

```bash
# 测试情感分析
curl -X POST http://localhost:8000/api/emotions/analyze \
    -H "Content-Type: application/json" \
    -d '{
        "user_id": "test_user",
        "text": "I am feeling great today!"
    }'

# 测试推理提取
curl -X POST http://localhost:8000/api/reasoning/extract \
    -H "Content-Type: application/json" \
    -d '{
        "user_id": "test_user",
        "text": "Because it was raining, I stayed home."
    }'
```

### 4. 性能监控

```bash
# CPU使用率
top -b -n 1 | grep soma

# 内存使用
ps aux | grep soma | awk '{sum+=$6} END {print sum/1024 " MB"}'

# 磁盘使用
df -h ~/soma

# 网络连接
netstat -an | grep 8000 | wc -l
```

---

## 监控配置

### 1. Prometheus监控

创建Prometheus配置:

```bash
mkdir -p ~/soma/monitoring
cat > ~/soma/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'soma-ml'
    static_configs:
      - targets: ['localhost:9090']
    metrics_path: '/metrics'
EOF

# 启动Prometheus (Docker)
docker run -d \
    --name prometheus \
    -p 9090:9090 \
    -v ~/soma/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
    prom/prometheus
```

### 2. Grafana仪表板

```bash
# 启动Grafana
docker run -d \
    --name grafana \
    -p 3000:3000 \
    -v ~/soma/data/grafana:/var/lib/grafana \
    grafana/grafana

# 访问: http://localhost:3000
# 默认账号: admin/admin
```

### 3. 日志聚合

```bash
# 配置日志轮转
sudo nano /etc/logrotate.d/soma

# 内容:
/home/soma/soma/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 soma soma
    sharedscripts
    postrotate
        systemctl reload soma-ml > /dev/null 2>&1 || true
    endscript
}
```

---

## 性能优化

### 1. PyTorch优化

```python
# 在应用启动时设置
import torch

# 线程数
torch.set_num_threads(4)

# CPU推理优化
torch.set_num_interop_threads(2)

# 禁用梯度计算
torch.set_grad_enabled(False)
```

### 2. 模型量化

```bash
# 使用Phase 7B.1的量化功能
python << 'EOF'
from ml.optimization.model_quantization import ProductionModelOptimizer

optimizer = ProductionModelOptimizer()

# 量化GoEmotions模型
optimizer.quantize_model(
    model_path="/home/soma/soma/models/emotions/go_emotions",
    output_path="/home/soma/soma/models/emotions/go_emotions_quantized",
    quantization_type="dynamic"
)

print("✅ Model quantized successfully")
EOF
```

### 3. 缓存优化

```bash
# 确保Redis配置正确
redis-cli CONFIG SET maxmemory 2gb
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# 预热缓存
python << 'EOF'
from ml.cache_manager import get_cache_manager

cache = get_cache_manager()

# 预热常见查询
common_inputs = [
    {"text": "I'm happy"},
    {"text": "I'm sad"},
    {"text": "I'm excited"}
]

cache.warm_cache(
    user_id="system",
    module="emotions",
    common_inputs=common_inputs
)

print("✅ Cache warmed")
EOF
```

### 4. 数据库优化

```sql
-- 在PostgreSQL中执行

-- 创建额外索引
CREATE INDEX CONCURRENTLY idx_emotions_valence ON emotion_analyses(valence);
CREATE INDEX CONCURRENTLY idx_emotions_arousal ON emotion_analyses(arousal);

-- 更新统计信息
ANALYZE emotion_analyses;
ANALYZE reasoning_extractions;
ANALYZE user_profiles;

-- 配置连接池
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET work_mem = '16MB';
```

---

## 故障排查

### 常见问题

#### 1. 应用无法启动

```bash
# 检查日志
sudo journalctl -u soma-ml -n 100

# 检查端口占用
sudo lsof -i :8000

# 检查Python环境
source ~/soma/app/Soma/Self_AI_Agent/venv/bin/activate
python -c "import sys; print(sys.executable)"

# 检查依赖
pip check
```

#### 2. 模型加载失败

```bash
# 检查模型文件
ls -lh ~/soma/models/emotions/go_emotions/

# 验证模型完整性
python << 'EOF'
from transformers import AutoTokenizer, AutoModelForSequenceClassification

try:
    model = AutoModelForSequenceClassification.from_pretrained(
        "/home/soma/soma/models/emotions/go_emotions"
    )
    print("✅ Model loaded")
except Exception as e:
    print(f"❌ Error: {e}")
EOF

# 重新下载模型
rm -rf ~/soma/models/emotions/go_emotions/
# 重新执行模型下载步骤
```

#### 3. 数据库连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U soma -d soma_production -c "SELECT 1;"

# 检查连接数
psql -h localhost -U soma -d soma_production -c \
    "SELECT count(*) FROM pg_stat_activity;"

# 重启PostgreSQL
sudo systemctl restart postgresql
```

#### 4. Redis内存不足

```bash
# 查看Redis内存使用
redis-cli INFO memory

# 清理缓存
redis-cli FLUSHDB

# 增加内存限制
redis-cli CONFIG SET maxmemory 4gb

# 或编辑配置文件
sudo nano /etc/redis/redis.conf
sudo systemctl restart redis
```

#### 5. 性能问题

```bash
# 查看系统资源
htop

# 查看应用性能
sudo py-spy top --pid $(pgrep -f gunicorn)

# 生成火焰图
sudo py-spy record --pid $(pgrep -f gunicorn) -o profile.svg

# 查看慢查询
tail -f ~/soma/logs/access.log | grep -E "duration=[0-9]{4,}"
```

### 诊断工具

```bash
# 安装诊断工具
pip install \
    py-spy \
    memory_profiler \
    line_profiler

# 性能分析
python -m cProfile -o profile.stats src/server.py

# 内存分析
python -m memory_profiler src/server.py
```

---

## 安全配置

### 1. 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# 内部端口仅允许本地访问
sudo ufw allow from 127.0.0.1 to any port 8000
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw allow from 127.0.0.1 to any port 6379
sudo ufw allow from 127.0.0.1 to any port 7687

# 启用防火墙
sudo ufw enable
```

### 2. SSL/TLS配置

```bash
# 安装certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. 环境变量加密

```bash
# 使用加密工具保护敏感信息
sudo apt-get install -y age

# 加密.env文件
age -e -o ~/soma/.env.encrypted ~/soma/.env

# 使用时解密
age -d ~/soma/.env.encrypted > ~/soma/.env
```

### 4. 限流配置

在Nginx中已配置基础限流,也可以在应用层添加:

```python
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/emotions/analyze")
@limiter.limit("100/minute")
async def analyze_emotion(request: Request):
    pass
```

---

## 扩展指南

### 水平扩展

```bash
# 启动多个实例
for i in {1..4}; do
    docker run -d \
        --name soma-ml-$i \
        -p $((8000+i)):8000 \
        -v ~/soma/models:/models \
        -e DATABASE_URL=$DATABASE_URL \
        -e REDIS_URL=$REDIS_URL \
        soma-ml:latest
done

# 配置负载均衡
cat > /etc/nginx/sites-available/soma-ml-lb << 'EOF'
upstream soma_cluster {
    least_conn;
    server 127.0.0.1:8001;
    server 127.0.0.1:8002;
    server 127.0.0.1:8003;
    server 127.0.0.1:8004;
}

server {
    listen 80;
    location / {
        proxy_pass http://soma_cluster;
    }
}
EOF
```

### 垂直扩展

```bash
# 增加Worker数量
# 编辑gunicorn_config.py
workers = 16  # 增加到16个

# 增加Redis内存
redis-cli CONFIG SET maxmemory 8gb

# 增加PostgreSQL资源
# 编辑postgresql.conf
max_connections = 400
shared_buffers = 4GB
effective_cache_size = 12GB
```

---

## 备份和恢复

### 数据库备份

```bash
# 创建备份脚本
cat > ~/soma/backups/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/soma/backups/postgres
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份PostgreSQL
pg_dump -h localhost -U soma soma_production | gzip > \
    $BACKUP_DIR/soma_$DATE.sql.gz

# 保留最近30天的备份
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "✅ Backup completed: soma_$DATE.sql.gz"
EOF

chmod +x ~/soma/backups/backup_db.sh

# 添加定时任务
crontab -e
# 添加: 0 2 * * * /home/soma/soma/backups/backup_db.sh
```

### 恢复数据

```bash
# 恢复PostgreSQL
gunzip < ~/soma/backups/postgres/soma_20251024_020000.sql.gz | \
    psql -h localhost -U soma soma_production

# 恢复Redis
redis-cli --rdb /path/to/dump.rdb

# 恢复Neo4j
docker cp backup.dump neo4j:/var/lib/neo4j/
docker exec neo4j neo4j-admin load --from=/var/lib/neo4j/backup.dump
```

---

## 生产检查清单

### 部署前检查

- [ ] 所有依赖已安装
- [ ] 模型文件已下载完整
- [ ] 数据库已初始化
- [ ] 环境变量已配置
- [ ] SSL证书已配置
- [ ] 防火墙规则已设置
- [ ] 日志目录已创建
- [ ] 备份计划已设置

### 部署后检查

- [ ] 健康检查通过
- [ ] 负载测试通过 (p95 < 200ms)
- [ ] 错误率 < 0.1%
- [ ] 监控仪表板正常
- [ ] 日志正常输出
- [ ] 备份自动执行
- [ ] SSL证书有效
- [ ] 限流规则生效

### 监控指标

- [ ] CPU使用率 < 80%
- [ ] 内存使用率 < 85%
- [ ] 磁盘使用率 < 80%
- [ ] 响应时间 p95 < 200ms
- [ ] 数据库连接数正常
- [ ] Redis命中率 > 90%
- [ ] 错误率 < 0.1%

---

## 联系支持

- **文档**: https://docs.yourdomain.com
- **问题追踪**: https://github.com/mzpatrick0529-mzyh/Soma/issues
- **技术支持**: support@yourdomain.com

---

**文档版本**: 7.0.0  
**最后更新**: 2025-10-24  
**维护者**: Soma DevOps Team
