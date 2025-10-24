#!/bin/bash
# 安全清理大文件脚本
# 释放 ~28GB 磁盘空间

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Self_AI_Agent 磁盘空间清理工具"
echo "=========================================="
echo ""

# 检查当前磁盘使用
echo "1. 当前磁盘状态:"
df -h / | tail -1
echo ""

# 统计当前大小
PROJECT_DIR="/Users/patrick_ma/Soma/Soma_V0"
cd "$PROJECT_DIR"

echo "2. 项目文件大小分析:"
echo ""
echo "数据库文件:"
du -sh Self_AI_Agent/self_agent.db* 2>/dev/null | while read size file; do
  echo "  $size  $(basename "$file")"
done
echo ""

echo "上传文件:"
UPLOADS_DIR="Self_AI_Agent/uploads"
if [ -d "$UPLOADS_DIR" ]; then
  ZIP_SIZE=$(du -sh $UPLOADS_DIR/files-*.zip 2>/dev/null | awk '{sum+=$1} END {print sum}')
  EXTRACTED_SIZE=$(du -sh $UPLOADS_DIR/extracted_import_* 2>/dev/null | awk '{sum+=$1} END {print sum}')
  
  echo "  ZIP备份: $(du -ch $UPLOADS_DIR/files-*.zip 2>/dev/null | tail -1 | cut -f1)"
  echo "  已解压: $(du -ch $UPLOADS_DIR/extracted_import_* 2>/dev/null | tail -1 | cut -f1)"
fi
echo ""

echo "npm缓存:"
if [ -d ".npm-cache" ]; then
  du -sh .npm-cache 2>/dev/null || echo "  0B"
else
  echo "  0B"
fi
echo ""

echo "=========================================="
echo "清理计划"
echo "=========================================="
echo ""
echo -e "${YELLOW}将要删除以下文件:${NC}"
echo ""

# 1. ZIP文件
echo -e "${RED}[A] ZIP备份文件 (已上传已解压,可安全删除)${NC}"
if ls $UPLOADS_DIR/files-*.zip 1> /dev/null 2>&1; then
  ls -lh $UPLOADS_DIR/files-*.zip | awk '{printf "    %s  %s\n", $5, $9}'
  ZIP_COUNT=$(ls $UPLOADS_DIR/files-*.zip 2>/dev/null | wc -l | xargs)
  ZIP_TOTAL=$(du -ch $UPLOADS_DIR/files-*.zip 2>/dev/null | tail -1 | cut -f1)
  echo "    总计: $ZIP_COUNT 个文件, $ZIP_TOTAL"
else
  echo "    (无ZIP文件)"
fi
echo ""

# 2. 解压目录
echo -e "${RED}[B] 已解压的导入数据 (已导入数据库,可删除)${NC}"
if ls -d $UPLOADS_DIR/extracted_import_* 1> /dev/null 2>&1; then
  du -sh $UPLOADS_DIR/extracted_import_* | awk '{printf "    %s  %s\n", $1, $2}'
  EXTRACTED_COUNT=$(ls -d $UPLOADS_DIR/extracted_import_* 2>/dev/null | wc -l | xargs)
  EXTRACTED_TOTAL=$(du -ch $UPLOADS_DIR/extracted_import_* 2>/dev/null | tail -1 | cut -f1)
  echo "    总计: $EXTRACTED_COUNT 个目录, $EXTRACTED_TOTAL"
else
  echo "    (无解压目录)"
fi
echo ""

# 3. npm缓存
echo -e "${YELLOW}[C] npm缓存 (可重新下载)${NC}"
if [ -d ".npm-cache" ]; then
  du -sh .npm-cache
else
  echo "    (无缓存)"
fi
echo ""

# 4. Git清理
echo -e "${YELLOW}[D] Git历史清理${NC}"
if [ -d ".git/refs/original" ]; then
  du -sh .git/refs/original 2>/dev/null || echo "    (无需清理)"
else
  echo "    (无需清理)"
fi
echo ""

# 计算总释放空间
echo "=========================================="
echo -e "${GREEN}预计释放空间:${NC}"
echo ""

TOTAL_RELEASE=0
if ls $UPLOADS_DIR/files-*.zip 1> /dev/null 2>&1; then
  ZIP_MB=$(du -sm $UPLOADS_DIR/files-*.zip 2>/dev/null | awk '{sum+=$1} END {print sum}')
  echo "  ZIP: ${ZIP_MB}MB"
  TOTAL_RELEASE=$((TOTAL_RELEASE + ZIP_MB))
fi

if ls -d $UPLOADS_DIR/extracted_import_* 1> /dev/null 2>&1; then
  EXTRACTED_MB=$(du -sm $UPLOADS_DIR/extracted_import_* 2>/dev/null | awk '{sum+=$1} END {print sum}')
  echo "  解压: ${EXTRACTED_MB}MB"
  TOTAL_RELEASE=$((TOTAL_RELEASE + EXTRACTED_MB))
fi

if [ -d ".npm-cache" ]; then
  NPM_MB=$(du -sm .npm-cache 2>/dev/null | cut -f1)
  echo "  npm: ${NPM_MB}MB"
  TOTAL_RELEASE=$((TOTAL_RELEASE + NPM_MB))
fi

echo ""
TOTAL_GB=$(echo "scale=2; $TOTAL_RELEASE / 1024" | bc)
echo -e "${GREEN}总计: ${TOTAL_GB}GB${NC}"
echo ""

echo "=========================================="
echo "⚠️  重要提醒"
echo "=========================================="
echo ""
echo "1. ZIP文件删除后无法恢复(但已解压)"
echo "2. 解压目录删除后无法恢复(但已导入数据库)"
echo "3. npm缓存可以重新下载"
echo "4. 建议先检查数据库是否包含所需数据"
echo ""

# 询问确认
read -p "是否继续清理? (yes/no): " answer

if [ "$answer" != "yes" ]; then
  echo ""
  echo "清理已取消"
  exit 0
fi

echo ""
echo "=========================================="
echo "开始清理..."
echo "=========================================="
echo ""

# 执行清理
CLEANED=0

# A. 删除ZIP
if ls $UPLOADS_DIR/files-*.zip 1> /dev/null 2>&1; then
  echo "[1/4] 删除ZIP备份..."
  ZIP_COUNT=$(ls $UPLOADS_DIR/files-*.zip 2>/dev/null | wc -l | xargs)
  rm -f $UPLOADS_DIR/files-*.zip
  echo -e "  ${GREEN}✓ 删除 $ZIP_COUNT 个ZIP文件${NC}"
  CLEANED=$((CLEANED + 1))
else
  echo "[1/4] 跳过 (无ZIP文件)"
fi

# B. 删除解压目录
if ls -d $UPLOADS_DIR/extracted_import_* 1> /dev/null 2>&1; then
  echo "[2/4] 删除解压目录..."
  EXTRACTED_COUNT=$(ls -d $UPLOADS_DIR/extracted_import_* 2>/dev/null | wc -l | xargs)
  rm -rf $UPLOADS_DIR/extracted_import_*
  echo -e "  ${GREEN}✓ 删除 $EXTRACTED_COUNT 个目录${NC}"
  CLEANED=$((CLEANED + 1))
else
  echo "[2/4] 跳过 (无解压目录)"
fi

# C. 清理npm缓存
echo "[3/4] 清理npm缓存..."
if [ -d ".npm-cache" ]; then
  rm -rf .npm-cache 2>/dev/null || true
fi
npm cache clean --force 2>/dev/null || true
echo -e "  ${GREEN}✓ npm缓存已清理${NC}"
CLEANED=$((CLEANED + 1))

# D. 清理Git
echo "[4/4] 清理Git历史..."
rm -rf .git/refs/original/ 2>/dev/null || true
git reflog expire --expire=now --all 2>/dev/null || true
git gc --prune=now --aggressive >/dev/null 2>&1 || true
echo -e "  ${GREEN}✓ Git已优化${NC}"
CLEANED=$((CLEANED + 1))

echo ""
echo "=========================================="
echo -e "${GREEN}清理完成!${NC}"
echo "=========================================="
echo ""
echo "清理后磁盘状态:"
df -h / | tail -1
echo ""

# 显示项目大小变化
echo "项目目录大小:"
du -sh "$PROJECT_DIR" 2>/dev/null || echo "计算中..."
echo ""

echo "详细大小:"
echo "  self_agent.db: $(du -sh Self_AI_Agent/self_agent.db 2>/dev/null | cut -f1)"
echo "  uploads/: $(du -sh Self_AI_Agent/uploads 2>/dev/null | cut -f1 || echo '0B')"
echo "  node_modules/: $(du -sh node_modules 2>/dev/null | cut -f1 || echo '0B')"
echo ""

echo "=========================================="
echo "下一步建议"
echo "=========================================="
echo ""
echo "1. 检查数据库内容:"
echo "   sqlite3 Self_AI_Agent/self_agent.db"
echo "   SELECT source, COUNT(*) FROM documents GROUP BY source;"
echo ""
echo "2. 清理数据库中的加密WeChat数据:"
echo "   见 docs/archive/DATABASE_ANALYSIS_REPORT.md"
echo ""
echo "3. 推送到GitHub:"
echo "   git add -A"
echo "   git commit -m 'chore: Clean up large files'"
echo "   git push soma main"
echo ""
