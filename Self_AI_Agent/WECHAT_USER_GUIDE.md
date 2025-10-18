# WeChat数据解密与导入 - 用户操作指南

## 🎯 目标

实现WeChat加密数据的完整导入链路：
1. ✅ 解密ChatPackage和Media加密文件
2. ✅ 导入到memories/wechat目录
3. ✅ 构建向量索引
4. ✅ 支持RAG检索和训练

## 📋 您需要提供的信息

### 1. 微信数据库密钥 (WECHAT_DB_KEY)

**这是最关键的信息！** 没有密钥无法解密数据。

#### 如何获取密钥？

##### 方法1：使用WeChatMsg工具（强烈推荐）

```bash
# 1. 克隆WeChatMsg项目
git clone https://github.com/LC044/WeChatMsg.git
cd WeChatMsg

# 2. 安装依赖
pip install -r requirements.txt

# 3. 运行GUI程序
python main.py

# 4. 工具会自动检测微信并提取密钥
# 密钥会显示在界面上，复制保存即可
```

##### 方法2：手动提取（仅适用于技术人员）

**macOS系统:**
```bash
# 微信数据库位置
~/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/*/Message/*.db

# 需要使用专门的工具从内存中提取密钥
# 具体方法参考：https://github.com/LC044/WeChatMsg/wiki/密钥提取
```

**Windows系统:**
```
微信数据库位置：
C:\Users\<用户名>\Documents\WeChat Files\<微信ID>\Msg\*.db

推荐使用WeChatMsg工具自动提取
```

#### 密钥格式要求

- **长度**: 必须是64个字符
- **格式**: 十六进制字符串（0-9, a-f）
- **示例**: `a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd`

### 2. 配置密钥的方式

我们支持三种配置方式，按优先级从高到低：

#### 方式1：环境变量（推荐，最安全）

```bash
# macOS/Linux
export WECHAT_DB_KEY="your_64_char_hex_key_here"

# 永久保存到 ~/.zshrc 或 ~/.bashrc
echo 'export WECHAT_DB_KEY="your_key"' >> ~/.zshrc
source ~/.zshrc
```

#### 方式2：前端配置页面（即将支持）

通过前端设置页面输入密钥，后端加密存储在数据库中。

#### 方式3：配置文件（开发环境）

在 `Self_AI_Agent/.env` 文件中添加：
```
WECHAT_DB_KEY=your_64_char_hex_key_here
```

### 3. Python环境准备

#### 检查Python版本

```bash
python3 --version
# 需要 Python 3.8 或更高版本
```

#### 安装必要的依赖

```bash
pip3 install pycryptodome
```

验证安装：
```bash
python3 -c "from Crypto.Cipher import AES; print('✓ pycryptodome installed')"
```

## 🚀 使用流程

### 自动化流程（推荐）

1. **设置密钥**（只需一次）
```bash
export WECHAT_DB_KEY="your_actual_key_here"
```

2. **上传WeChat数据**
- 在前端界面选择"导入数据"
- 上传您的WeChat导出ZIP文件
- 系统会自动检测到加密数据

3. **自动解密和导入**
- 后端自动调用Python解密服务
- 解密后的数据存储到`memories/wechat/`
- 自动构建向量索引
- 前端显示导入进度

4. **使用RAG功能**
- 在Chat页面询问关于微信聊天的问题
- 系统会从解密后的数据中检索相关内容
- 生成个性化回复

### 手动流程（备选）

如果自动流程遇到问题，可以手动操作：

```bash
# 1. 手动运行解密脚本
cd Self_AI_Agent/src/services/decryption
python3 decrypt_service.py \
  --key "your_key" \
  --input "/path/to/uploaded/wechat/data" \
  --output "../../memories/wechat/raw"

# 2. 手动触发导入
# 使用Postman或curl调用导入API
curl -X POST http://localhost:8787/api/self-agent/import/wechat \
  -H "Content-Type: application/json" \
  -d '{"userId": "your_user_id", "dataDir": "memories/wechat/raw"}'
```

## 🔍 故障排除

### 问题1：找不到Python3

**症状**: `python3: command not found`

**解决方案**:
```bash
# macOS (使用Homebrew)
brew install python3

# 验证安装
python3 --version
```

### 问题2：密钥格式错误

**症状**: `Invalid WeChat key: must be 64-character hex string`

**原因**: 
- 密钥长度不是64位
- 包含非法字符（只能是0-9, a-f）
- 复制时多了空格或换行符

**解决方案**:
```bash
# 清理密钥字符串
key="a1b2c3d4..."
echo "$key" | tr -d '[:space:]' | wc -c  # 应该显示65（包含换行符）
```

### 问题3：pycryptodome未安装

**症状**: `ModuleNotFoundError: No module named 'Crypto'`

**解决方案**:
```bash
pip3 install pycryptodome

# 如果遇到权限问题
pip3 install --user pycryptodome
```

### 问题4：解密失败

**症状**: `Failed to decrypt RMFH` 或 `Failed to decrypt tar.enc`

**可能原因**:
1. 密钥错误或过期
2. WeChat数据文件损坏
3. WeChat版本不兼容

**解决方案**:
1. 重新提取最新的密钥
2. 重新导出WeChat数据
3. 查看详细错误日志：`tail -f Self_AI_Agent/logs/decryption.log`

### 问题5：权限错误

**症状**: `Permission denied` 访问微信数据库

**解决方案**:
```bash
# macOS - 给终端完全磁盘访问权限
系统设置 > 隐私与安全性 > 完全磁盘访问权限 > 添加Terminal

# 或者复制数据库到用户目录
cp ~/Library/Containers/com.tencent.xinWeChat/... ~/Desktop/wechat_backup/
```

## ⚠️ 安全警告

### 重要提示

1. **密钥泄露风险**: 
   - 密钥可以解密您的所有微信聊天记录
   - 不要分享给任何人
   - 不要上传到公开的Git仓库

2. **数据隐私**:
   - 解密后的数据是明文，请妥善保管
   - 建议在本地环境运行，不要使用公共服务器
   - 定期备份并加密存储

3. **合规使用**:
   - 仅用于个人数据管理和AI训练
   - 不得用于任何非法用途
   - 遵守当地法律法规

### 密钥安全最佳实践

```bash
# ✅ 推荐：使用环境变量
export WECHAT_DB_KEY="..."

# ✅ 推荐：使用加密的密钥管理工具
# 如 1Password, KeyChain, etc.

# ❌ 不推荐：硬编码在代码中
const key = "a1b2c3d4..."  // 危险！

# ❌ 不推荐：明文存储在配置文件并上传到Git
WECHAT_DB_KEY=...  # 如果这个文件在Git中，危险！
```

## 📊 预期结果

### 成功指标

完成所有步骤后，您应该看到：

1. **解密统计**
```
=== Decryption Complete ===
Success: 632
Failed: 0
Skipped: 828
Output: memories/wechat/raw
```

2. **导入统计**
```
[wechat-import] Import complete: 632 documents, 4824 chunks
```

3. **数据库验证**
```sql
SELECT COUNT(*) FROM documents WHERE source = 'wechat';
-- 应该返回 632

SELECT COUNT(*) FROM chunks WHERE user_id = 'your_id' AND metadata LIKE '%wechat%';
-- 应该返回 ~4800+
```

4. **RAG测试**
前端Chat询问："你看到我的微信聊天记录了吗？"
应该返回基于实际聊天内容的回复。

## 🆘 获取帮助

如果遇到本文档未涵盖的问题：

1. **查看日志**
```bash
tail -f Self_AI_Agent/logs/server.log
tail -f Self_AI_Agent/logs/decryption.log
```

2. **检查环境**
```bash
# 运行环境检查脚本
npm run check-env
```

3. **联系支持**
- 提Issue: [GitHub Issues]
- 提供错误日志和环境信息
- 描述复现步骤

## 📝 配置检查清单

在开始之前，请确认：

- [ ] Python 3.8+ 已安装
- [ ] pycryptodome 已安装
- [ ] 微信数据库密钥已获取（64位hex）
- [ ] 密钥已配置到环境变量
- [ ] WeChat导出数据已准备（包含ChatPackage/Media/Index）
- [ ] 磁盘空间充足（解密后数据约为原始2-3倍）
- [ ] 已阅读并理解安全警告

全部确认后，可以开始上传和导入数据！

---

**最后更新**: 2025-10-17
**版本**: 1.0.0
**支持的WeChat版本**: PC版 3.x+
