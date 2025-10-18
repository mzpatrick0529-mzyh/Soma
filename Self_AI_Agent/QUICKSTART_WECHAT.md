# 🚀 WeChat解密快速开始

## 立即开始的3个步骤

### 1️⃣ 获取密钥 (5分钟)

```bash
# 克隆WeChatMsg工具
git clone https://github.com/LC044/WeChatMsg.git
cd WeChatMsg

# 安装并运行
pip install -r requirements.txt
python main.py

# 复制工具显示的64位密钥
```

### 2️⃣ 配置环境 (2分钟)

```bash
# 设置密钥
export WECHAT_DB_KEY="your_64_char_hex_key"

# 安装Python加密库
pip3 install pycryptodome

# 验证
python3 -c "from Crypto.Cipher import AES; print('✓')"
```

### 3️⃣ 测试解密 (3分钟)

```bash
cd Self_AI_Agent
npx tsx test_wechat_decrypt.ts
```

## API使用

### 检查环境
```bash
curl http://localhost:8787/api/decrypt/check-environment
```

### 开始解密
```bash
curl -X POST http://localhost:8787/api/decrypt/wechat \
  -H "Content-Type: application/json" \
  -d '{
    "inputDir": "uploads/extracted_import_xxx",
    "userId": "your_user_id"
  }'
```

### 查看状态
```bash
curl http://localhost:8787/api/decrypt/status/wechat
```

## 目录结构

```
memories/
├── wechat/
│   ├── raw/          # 解密后的数据
│   ├── processed/    # 已处理的文档
│   └── index.json    # 索引文件
├── instagram/
└── google/
```

## 故障排除

| 问题 | 解决方案 |
|------|---------|
| `python3: command not found` | `brew install python3` |
| `pycryptodome not installed` | `pip3 install pycryptodome` |
| `Invalid key format` | 检查密钥是64位hex字符串 |
| `Permission denied` | 系统设置 > 隐私 > 完全磁盘访问 |

## 文档索引

- 📘 **完整指南**: `WECHAT_USER_GUIDE.md`
- 📗 **技术方案**: `WECHAT_DECRYPTION_INTEGRATION_PLAN.md`  
- 📕 **实施报告**: `WECHAT_IMPLEMENTATION_COMPLETE.md`
- 📙 **测试脚本**: `test_wechat_decrypt.ts`

## 安全提醒

⚠️ **密钥可以解密所有微信聊天记录**
- ✅ 使用环境变量
- ❌ 不要提交到Git
- ❌ 不要分享给他人

---

**需要帮助?** 参考 `WECHAT_USER_GUIDE.md` 获取详细说明
