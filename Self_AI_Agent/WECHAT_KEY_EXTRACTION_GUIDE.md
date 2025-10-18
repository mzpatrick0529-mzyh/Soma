# WeChat密钥提取 - 替代方案

## ⚠️ 重要发现

WeChatMsg项目虽然有40k+ stars，但**目前没有可用的Release版本**，也没有标准的Python包可以直接安装。该项目主要是一个GUI应用程序，需要从源码构建。

## 🎯 实际可行的方案

### 方案1: 使用我们自己的Python脚本（推荐）

我们已经实现了核心的解密功能，**但需要您手动提供密钥**。以下是获取密钥的方法：

#### macOS 获取密钥的步骤

```bash
# 1. 安装必要工具
pip3 install pycryptodome pyobjc

# 2. 创建密钥提取脚本
cat > extract_wechat_key.py << 'EOF'
#!/usr/bin/env python3
"""
提取macOS微信数据库密钥
需要微信正在运行
"""
import os
import sys
import hashlib
import hmac

def get_wechat_key_mac():
    """
    macOS微信密钥提取
    基于IMEI和uin计算
    """
    try:
        # 方法1: 从Keychain提取
        import subprocess
        result = subprocess.run(
            ['security', 'find-generic-password', '-w', '-s', 'WeChat', '-a', 'WeChat'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            key = result.stdout.strip()
            print(f"✓ 找到密钥 (Keychain): {key}")
            return key
    except Exception as e:
        print(f"Keychain方法失败: {e}")
    
    # 方法2: 计算密钥
    print("\n⚠️ 需要手动操作:")
    print("1. 打开 钥匙串访问 (Keychain Access)")
    print("2. 搜索 'WeChat'")
    print("3. 双击条目，勾选'显示密码'")
    print("4. 输入系统密码")
    print("5. 复制显示的密钥\n")
    
    return None

if __name__ == '__main__':
    print("=== 微信数据库密钥提取工具 ===\n")
    key = get_wechat_key_mac()
    
    if not key:
        print("\n❌ 自动提取失败")
        print("\n请手动操作:")
        print("1. 打开 '钥匙串访问' 应用")
        print("2. 在搜索框输入 'WeChat' 或 '微信'")
        print("3. 找到 'com.tencent.xinWeChat' 条目")
        print("4. 双击，勾选 '显示密码'")
        print("5. 输入Mac登录密码")
        print("6. 复制64位十六进制密钥")
        sys.exit(1)
    
    print(f"\n✅ 密钥已提取!")
    print(f"密钥: {key}")
    print(f"\n请将此密钥设置为环境变量:")
    print(f'export WECHAT_DB_KEY="{key}"')
EOF

chmod +x extract_wechat_key.py

# 3. 运行提取脚本
python3 extract_wechat_key.py
```

#### Windows 获取密钥的步骤

```python
# Windows版本的密钥提取
# 需要以管理员权限运行

import winreg
import hashlib

def get_wechat_key_windows():
    """
    Windows微信密钥提取
    """
    try:
        # 打开注册表
        key = winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Tencent\WeChat",
            0,
            winreg.KEY_READ
        )
        
        # 读取密钥
        value, _ = winreg.QueryValueEx(key, "DataPath")
        winreg.CloseKey(key)
        
        print(f"✓ 微信数据路径: {value}")
        
        # 密钥通常存储在注册表或数据库中
        # 需要进一步分析
        
    except Exception as e:
        print(f"❌ 提取失败: {e}")
        print("\n手动步骤:")
        print("1. 打开微信安装目录")
        print("2. 找到 Documents\\WeChat Files\\<你的微信ID>\\")
        print("3. 密钥可能在 config.dat 或数据库文件中")
```

### 方案2: 手动从钥匙串获取（macOS最简单）

**步骤**:

1. 打开 **钥匙串访问** (Keychain Access)
   - 应用程序 > 实用工具 > 钥匙串访问

2. 在搜索框输入 **"WeChat"** 或 **"微信"**

3. 找到以下条目:
   - `com.tencent.xinWeChat` 
   - 或 `WeChat`
   - 类型: 应用程序密码

4. **双击该条目**

5. 勾选 **"显示密码"** 复选框

6. 输入您的 **Mac 登录密码**

7. 密码框会显示 **64位十六进制字符串**

8. **复制这个密钥**

### 方案3: 使用数据库工具直接查看

如果密钥在数据库中:

```bash
# 1. 找到微信数据库
find ~/Library/Containers/com.tencent.xinWeChat -name "*.db" 2>/dev/null

# 2. 使用DB Browser查看
# 下载: https://sqlitebrowser.org/
# 打开数据库文件，查看是否有密钥相关表
```

### 方案4: 使用第三方工具（需谨慎）

一些第三方工具可以提取密钥，但请注意安全性：

1. **WeChatTweak-macOS** (开源)
   ```bash
   git clone https://github.com/Sunnyyoung/WeChatTweak-macOS.git
   # 查看源码了解密钥提取方法
   ```

2. **在线教程搜索**
   - 搜索: "微信数据库密钥提取 macOS"
   - 搜索: "WeChat database key extraction"

## 🔧 获取密钥后的操作

一旦您获得64位密钥，立即配置：

```bash
# 1. 配置环境变量
export WECHAT_DB_KEY="your_64_character_hex_key_here"

# 2. 永久保存
echo 'export WECHAT_DB_KEY="your_key"' >> ~/.zshrc
source ~/.zshrc

# 3. 验证
echo $WECHAT_DB_KEY  # 应该显示您的密钥

# 4. 测试解密
cd /Users/patrick_ma/Soma/Soma_V0/Self_AI_Agent
npx tsx test_wechat_decrypt.ts
```

## 📝 密钥格式验证

您的密钥应该：
- ✅ 长度: 正好64个字符
- ✅ 字符: 只包含 0-9 和 a-f (十六进制)
- ✅ 示例: `a1b2c3d4e5f6...` (64位)

验证脚本:
```bash
key="your_key_here"
echo $key | grep -E '^[0-9a-fA-F]{64}$' && echo "✓ 格式正确" || echo "✗ 格式错误"
```

## 🆘 如果所有方法都失败

如果无法获取密钥，可以考虑：

### 临时方案：使用明文导出

1. **使用微信PC版的导出功能**
   - 微信设置 > 聊天 > 聊天记录备份与迁移
   - 导出为明文格式（如果支持）

2. **使用第三方导出工具**
   - 搜索支持明文导出的微信备份工具
   - ⚠️ 注意数据安全

3. **手动复制聊天记录**
   - 对于重要对话，手动截图或复制文本
   - 然后通过前端上传

## 🔐 安全提醒

- 🔴 **密钥非常敏感** - 可以解密所有聊天记录
- 🔴 **不要分享密钥** - 不要发送给任何人
- 🔴 **妥善保管** - 使用密码管理器存储
- 🔴 **环境变量** - 不要提交到Git仓库

## 📞 需要帮助？

如果您成功获取了密钥，请告诉我，我会帮您：
1. 验证密钥格式
2. 配置到环境变量
3. 运行完整的解密测试
4. 导入数据到系统

---

**当前状态**: 等待您提供密钥
**下一步**: 获取密钥 → 配置环境变量 → 运行测试
