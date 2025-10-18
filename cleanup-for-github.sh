#!/bin/bash
# 清理大文件准备GitHub推送

set -e

echo "=========================================="
echo "磁盘空间清理工具"
echo "=========================================="
echo ""

# 显示当前磁盘使用
echo "1. 当前磁盘空间:"
df -h / | tail -1
echo ""

# 显示大文件
echo "2. 查找大文件 (>100MB)..."
echo ""
find /Users/patrick_ma/Soma/Soma_V0 -type f -size +100M -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | while read file; do
  size=$(du -h "$file" | cut -f1)
  echo "  $size  $file"
done

echo ""
echo "=========================================="
echo "清理选项"
echo "=========================================="
echo ""
echo "建议清理:"
echo "  1. ✓ ZIP备份文件 (可重新生成)"
echo "  2. ✓ npm缓存 (可重新下载)"
echo "  3. ⚠️ self_agent.db (会丢失导入的数据!)"
echo "  4. ⚠️ 上传的文件 (会丢失原始文件!)"
echo ""

read -p "是否清理ZIP和缓存? (y/n): " answer

if [ "$answer" = "y" ]; then
  echo ""
  echo "开始清理..."
  
  # 清理ZIP文件
  echo "  - 删除ZIP备份..."
  rm -f /Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent/uploads/files-*.zip 2>/dev/null || true
  echo "    ✓ 完成"
  
  # 清理npm缓存
  echo "  - 清理npm缓存..."
  rm -rf /Users/patrick_ma/Soma/Soma_V0/.npm-cache 2>/dev/null || true
  npm cache clean --force 2>/dev/null || true
  echo "    ✓ 完成"
  
  # 清理Git
  echo "  - 清理Git引用..."
  cd /Users/patrick_ma/Soma/Soma_V0
  rm -rf .git/refs/original/ 2>/dev/null || true
  git reflog expire --expire=now --all 2>/dev/null || true
  git gc --prune=now --aggressive
  echo "    ✓ 完成"
  
  echo ""
  echo "清理完成!"
  echo ""
  echo "清理后磁盘空间:"
  df -h / | tail -1
  echo ""
  
  echo "=========================================="
  echo "GitHub推送准备"
  echo "=========================================="
  echo ""
  echo "现在可以推送到GitHub:"
  echo "  cd /Users/patrick_ma/Soma/Soma_V0"
  echo "  git add -A"
  echo "  git commit -m 'Clean up large files'"
  echo "  git push soma main"
  echo ""
else
  echo "跳过清理"
fi
