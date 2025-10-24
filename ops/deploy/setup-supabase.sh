#!/bin/bash

# ============================================
# Soma MVP数据库迁移到Supabase
# ============================================

set -e  # 遇到错误立即退出

echo "🚀 Soma数据库迁移向导"
echo "================================"
echo ""

# 检查是否已有Supabase凭证
if [ -f "Self_AI_Agent/.env.supabase" ]; then
  echo "⚠️  检测到现有Supabase配置文件"
  read -p "是否要覆盖现有配置？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 取消操作"
    exit 1
  fi
fi

# 收集Supabase信息
echo "📝 请输入您的Supabase项目信息"
echo "   (可在 https://app.supabase.com/project/_/settings/api 找到)"
echo ""

read -p "Supabase Project URL (例: https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Supabase Service Role Key: " SUPABASE_SERVICE_KEY

# 验证输入
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "❌ 错误: 所有字段都是必填的"
  exit 1
fi

# 提取Database URL
DB_HOST=$(echo $SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co||').supabase.co
read -p "Database Password (在创建项目时设置的密码): " -s DB_PASSWORD
echo ""

DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${DB_HOST}:5432/postgres"

# 创建环境变量文件
echo "💾 创建Supabase配置文件..."
cat > Self_AI_Agent/.env.supabase << EOF
# ============================================
# Supabase Configuration (自动生成)
# 生成时间: $(date)
# ============================================

# 数据库类型
DB_TYPE=supabase

# Supabase连接信息
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}
DATABASE_URL=${DATABASE_URL}

# 端到端加密
E2EE_ENABLED=true

# PBKDF2配置
PBKDF2_ITERATIONS=100000

# JWT配置 (用于API认证)
JWT_SECRET=$(openssl rand -base64 32)
EOF

echo "✅ 配置文件已创建: Self_AI_Agent/.env.supabase"
echo ""

# 测试数据库连接
echo "🔌 测试数据库连接..."
if command -v psql &> /dev/null; then
  if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
    echo "✅ 数据库连接成功"
  else
    echo "⚠️  数据库连接失败，请检查密码和URL是否正确"
    echo "   您可以稍后手动测试"
  fi
else
  echo "⚠️  未检测到psql命令，跳过连接测试"
  echo "   可以安装PostgreSQL客户端后测试: brew install postgresql"
fi
echo ""

# 询问是否立即执行Schema迁移
read -p "📊 是否立即执行Schema迁移？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🔨 执行Schema迁移..."
  
  if [ -f "Self_AI_Agent/src/db/supabase_schema.sql" ]; then
    if command -v psql &> /dev/null; then
      psql "$DATABASE_URL" -f Self_AI_Agent/src/db/supabase_schema.sql
      echo "✅ Schema迁移完成"
    else
      echo "⚠️  未检测到psql命令"
      echo "   请手动在Supabase Dashboard执行schema迁移:"
      echo "   1. 访问 ${SUPABASE_URL}/project/_/sql"
      echo "   2. 复制 Self_AI_Agent/src/db/supabase_schema.sql 内容"
      echo "   3. 粘贴并执行"
    fi
  else
    echo "⚠️  未找到schema文件: Self_AI_Agent/src/db/supabase_schema.sql"
    echo "   请参考文档手动创建schema"
  fi
else
  echo "⏭️  跳过Schema迁移"
  echo "   您可以稍后在Supabase Dashboard手动执行"
fi
echo ""

# 安装依赖
read -p "📦 是否安装Supabase依赖包？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📦 安装依赖包..."
  cd Self_AI_Agent
  npm install @supabase/supabase-js pg
  npm install --save-dev @types/pg
  cd ..
  echo "✅ 依赖安装完成"
else
  echo "⏭️  跳过依赖安装"
fi
echo ""

# 迁移现有数据
if [ -f "Self_AI_Agent/self_agent.db" ]; then
  read -p "🔄 检测到本地SQLite数据库，是否迁移数据到Supabase？(y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  数据迁移功能即将推出"
    echo "   目前建议使用新的Supabase数据库"
    echo "   本地数据库将保留作为备份"
  fi
else
  echo "ℹ️  未检测到本地数据库，将使用全新的Supabase数据库"
fi
echo ""

# 更新启动脚本
echo "🔧 更新启动配置..."
if ! grep -q "env.supabase" Self_AI_Agent/package.json 2>/dev/null; then
  echo "ℹ️  提示: 运行开发服务器时需要加载Supabase环境变量"
  echo "   使用命令: npm run dev:supabase"
fi
echo ""

# 完成
echo "================================"
echo "✅ Supabase配置完成！"
echo ""
echo "📋 下一步操作:"
echo "   1. 启动后端服务 (使用Supabase):"
echo "      cd Self_AI_Agent"
echo "      source .env.supabase && npm run dev"
echo ""
echo "   2. 验证数据库连接:"
echo "      访问 ${SUPABASE_URL}/project/_/editor"
echo "      检查tables是否创建成功"
echo ""
echo "   3. 测试端到端加密:"
echo "      npm test -- supabase-integration"
echo ""
echo "📖 详细文档: docs/database/DATABASE_MIGRATION_STRATEGY.md"
echo "💡 问题反馈: https://github.com/your-repo/issues"
echo ""
