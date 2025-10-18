#!/bin/bash

# WeChat解密快速启动脚本
# 此脚本将设置环境变量并启动解密流程

echo "========================================================"
echo "    WeChat数据解密 - 快速启动"
echo "========================================================"
echo ""

# 1. 设置密钥
export WECHAT_DB_KEY='687c38f284f0d9c778fb3e1b3492536b'
echo "✓ 已设置解密密钥: ${WECHAT_DB_KEY:0:16}..."

# 2. 检查后端服务器
echo ""
echo "检查后端服务器状态..."
if curl -s http://localhost:8787/api/health > /dev/null 2>&1; then
    echo "✓ 后端服务器正在运行 (localhost:8787)"
else
    echo "⚠️  后端服务器未运行"
    echo "   请运行: cd Self_AI_Agent && npm run dev"
    echo ""
    read -p "是否现在启动后端? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd Self_AI_Agent
        npm run dev &
        BACKEND_PID=$!
        echo "✓ 后端服务器启动中... (PID: $BACKEND_PID)"
        sleep 5
        cd ..
    else
        echo "❌ 取消操作"
        exit 1
    fi
fi

# 3. 检查Python环境
echo ""
echo "检查Python环境..."
if python3 -c "from Crypto.Cipher import AES" 2>/dev/null; then
    echo "✓ pycryptodome已安装"
else
    echo "⚠️  需要安装pycryptodome"
    echo "   正在安装..."
    python3 -m pip install pycryptodome
    echo "✓ 安装完成"
fi

# 4. 显示待解密数据
echo ""
echo "========================================================"
echo "待解密数据统计"
echo "========================================================"

UPLOAD_DIR="Self_AI_Agent/uploads/extracted_import_1760644792278_vaff08kljb"

if [ -d "$UPLOAD_DIR" ]; then
    TOTAL_FILES=$(find "$UPLOAD_DIR" -type f | wc -l | tr -d ' ')
    RMFH_FILES=$(find "$UPLOAD_DIR" -name "*" -type f -path "*/ChatPackage/*" | wc -l | tr -d ' ')
    ENC_FILES=$(find "$UPLOAD_DIR" -name "*.enc" | wc -l | tr -d ' ')
    
    echo "总文件数: $TOTAL_FILES"
    echo "聊天记录(RMFH): $RMFH_FILES"
    echo "加密媒体(.enc): $ENC_FILES"
else
    echo "❌ 未找到上传数据目录: $UPLOAD_DIR"
    exit 1
fi

# 5. 选择解密方式
echo ""
echo "========================================================"
echo "选择解密方式"
echo "========================================================"
echo "1) 通过API解密 (推荐,支持进度显示)"
echo "2) 直接运行Python脚本解密"
echo "3) 仅测试解密(前3个文件)"
echo "4) 退出"
echo ""
read -p "请选择 (1-4): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo ""
        echo "通过API解密所有数据..."
        echo "这可能需要几分钟时间..."
        curl -X POST http://localhost:8787/api/decrypt/wechat \
          -H "Content-Type: application/json" \
          -d "{
            \"inputDir\": \"uploads/extracted_import_1760644792278_vaff08kljb\",
            \"outputDir\": \"memories/wechat/processed\"
          }"
        echo ""
        echo "✓ 解密请求已提交!"
        echo "  查看进度: curl http://localhost:8787/api/decrypt/status/wechat"
        ;;
    2)
        echo ""
        echo "运行Python解密脚本..."
        cd Self_AI_Agent
        python3 src/services/decryption/decrypt_service.py \
          "$UPLOAD_DIR" \
          "memories/wechat/processed"
        cd ..
        echo ""
        echo "✓ 解密完成!"
        ;;
    3)
        echo ""
        echo "测试解密前3个文件..."
        cd Self_AI_Agent
        python3 src/services/decryption/verify_decrypt.py
        cd ..
        ;;
    4)
        echo "退出"
        exit 0
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

# 6. 显示结果
echo ""
echo "========================================================"
echo "解密结果"
echo "========================================================"

OUTPUT_DIR="Self_AI_Agent/memories/wechat/processed"
if [ -d "$OUTPUT_DIR" ]; then
    DECRYPTED_FILES=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
    echo "✓ 已解密文件数: $DECRYPTED_FILES"
    echo "✓ 输出目录: $OUTPUT_DIR"
    
    if [ -f "$OUTPUT_DIR/../index.json" ]; then
        echo "✓ 索引文件已生成"
        cat "$OUTPUT_DIR/../index.json"
    fi
else
    echo "⚠️  输出目录不存在,可能解密未完成"
fi

echo ""
echo "========================================================"
echo "后续步骤"
echo "========================================================"
echo "1. 检查解密结果:"
echo "   ls -lh $OUTPUT_DIR"
echo ""
echo "2. 查看解密的聊天记录:"
echo "   cat $OUTPUT_DIR/[文件名]"
echo ""
echo "3. 重新导入到数据库:"
echo "   curl -X POST http://localhost:8787/api/memories/reindex"
echo ""
echo "4. 测试RAG问答:"
echo "   访问前端: http://127.0.0.1:8080"
echo ""
echo "✓ 完成!"
