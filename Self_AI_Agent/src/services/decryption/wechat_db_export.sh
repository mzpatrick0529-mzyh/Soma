#!/bin/bash
# WeChat数据库导出脚本
# 使用SQLCipher读取加密的微信数据库并导出为JSON

set -e

# 配置
WECHAT_KEY="687c38f284f0d9c778fb3e1b3492536b"
WECHAT_DIR="$HOME/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/$WECHAT_KEY"
MESSAGE_DIR="$WECHAT_DIR/Message"
OUTPUT_DIR="$(pwd)/memories/wechat/database_export"

# 激活Homebrew
if [ -f /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -f /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# 检查sqlcipher
if ! command -v sqlcipher &> /dev/null; then
  echo "✗ SQLCipher未安装"
  echo "请运行: brew install sqlcipher"
  exit 1
fi

echo "=========================================="
echo "WeChat数据库导出工具"
echo "=========================================="
echo ""
echo "✓ SQLCipher: $(sqlcipher --version | head -1)"
echo "✓ 密钥: $WECHAT_KEY"
echo "✓ 数据库目录: $MESSAGE_DIR"
echo ""

# 创建输出目录
mkdir -p "$OUTPUT_DIR"

# 查找msg_*.db文件
DB_FILES=($(ls "$MESSAGE_DIR"/msg_*.db 2>/dev/null || true))

if [ ${#DB_FILES[@]} -eq 0 ]; then
  echo "✗ 未找到数据库文件"
  exit 1
fi

echo "找到 ${#DB_FILES[@]} 个数据库文件"
echo ""

# 处理每个数据库
for DB_PATH in "${DB_FILES[@]}"; do
  DB_NAME=$(basename "$DB_PATH" .db)
  echo "=========================================="
  echo "处理: $DB_NAME"
  echo "=========================================="
  
  # 1. 检查数据库是否可访问
  echo "1. 测试数据库访问..."
  PRAGMA_CMD="PRAGMA key = \"x'$WECHAT_KEY'\";"
  
  if ! sqlcipher "$DB_PATH" "$PRAGMA_CMD SELECT 1;" &>/dev/null; then
    echo "✗ 无法解密数据库 $DB_NAME"
    echo "  可能原因: 密钥错误或数据库损坏"
    continue
  fi
  
  echo "✓ 数据库解密成功"
  
  # 2. 列出所有表
  echo "2. 读取表结构..."
  TABLES=$(sqlcipher "$DB_PATH" "$PRAGMA_CMD SELECT name FROM sqlite_master WHERE type='table';" 2>/dev/null)
  
  if [ -z "$TABLES" ]; then
    echo "✗ 无法读取表列表"
    continue
  fi
  
  echo "✓ 找到 $(echo "$TABLES" | wc -l | xargs) 个表"
  echo "$TABLES" | sed 's/^/  - /'
  
  # 3. 导出每个表
  echo "3. 导出数据..."
  
  for TABLE in $TABLES; do
    OUTPUT_FILE="$OUTPUT_DIR/${DB_NAME}_${TABLE}.json"
    
    # 获取行数
    ROW_COUNT=$(sqlcipher "$DB_PATH" "$PRAGMA_CMD SELECT COUNT(*) FROM $TABLE;" 2>/dev/null || echo "0")
    
    if [ "$ROW_COUNT" -eq 0 ]; then
      echo "  - $TABLE: 空表,跳过"
      continue
    fi
    
    echo "  - $TABLE: $ROW_COUNT 行 → $(basename "$OUTPUT_FILE")"
    
    # 导出为JSON格式
    # 使用.mode json需要SQLCipher 3.34+
    sqlcipher "$DB_PATH" <<EOF > "$OUTPUT_FILE" 2>/dev/null || true
$PRAGMA_CMD
.mode json
.output $OUTPUT_FILE
SELECT * FROM $TABLE LIMIT 1000;
.quit
EOF
    
    # 如果JSON模式失败,使用CSV
    if [ ! -s "$OUTPUT_FILE" ]; then
      CSV_FILE="$OUTPUT_DIR/${DB_NAME}_${TABLE}.csv"
      echo "    (使用CSV格式替代)"
      
      sqlcipher "$DB_PATH" <<EOF > "$CSV_FILE" 2>/dev/null || true
$PRAGMA_CMD
.mode csv
.headers on
.output $CSV_FILE
SELECT * FROM $TABLE LIMIT 1000;
.quit
EOF
      
      if [ -s "$CSV_FILE" ]; then
        echo "    ✓ CSV导出成功: $(wc -l < "$CSV_FILE") 行"
        rm -f "$OUTPUT_FILE"
      else
        echo "    ✗ 导出失败"
        rm -f "$OUTPUT_FILE" "$CSV_FILE"
      fi
    else
      echo "    ✓ JSON导出成功"
    fi
  done
  
  echo ""
done

echo "=========================================="
echo "导出完成"
echo "=========================================="
echo ""
echo "输出目录: $OUTPUT_DIR"
echo "导出文件:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{printf "  - %s (%s)\n", $9, $5}'
echo ""
echo "查看示例:"
echo "  head -20 $OUTPUT_DIR/*.json"
echo "  head -20 $OUTPUT_DIR/*.csv"
