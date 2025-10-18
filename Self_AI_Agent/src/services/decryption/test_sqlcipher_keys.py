#!/usr/bin/env python3
"""
尝试不同的SQLCipher密钥格式
"""

import subprocess
import sys
from pathlib import Path

# 配置
USER_ID = "687c38f284f0d9c778fb3e1b3492536b"
DB_PATH = Path.home() / f"Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/2.0b4.0.9/{USER_ID}/Message/msg_1.db"

print(f"数据库: {DB_PATH}")
print(f"存在: {DB_PATH.exists()}")
print(f"大小: {DB_PATH.stat().st_size / (1024*1024):.2f}MB\n")

# 确保sqlcipher在PATH中
subprocess.run("eval \"$(/opt/homebrew/bin/brew shellenv)\"", shell=True, executable='/bin/bash')

# 测试不同的密钥格式
key_formats = [
    # 格式1: 十六进制字符串
    f"PRAGMA key = \"x'{USER_ID}'\";",
    
    # 格式2: 原始字符串
    f"PRAGMA key = '{USER_ID}';",
    
    # 格式3: 双引号
    f'PRAGMA key = "x\\"{USER_ID}\\"";',
    
    # 格式4: UTF-8编码
    f"PRAGMA key = \"{USER_ID}\";",
    
    # 格式5: SQLCipher 4.x格式 (PBKDF2)
    f"PRAGMA key = '{USER_ID}'; PRAGMA cipher_page_size = 1024; PRAGMA kdf_iter = 64000;",
    
    # 格式6: 十六进制 blob
    f"PRAGMA key = \"x'{USER_ID}'\"; PRAGMA cipher_compatibility = 3;",
]

for i, key_cmd in enumerate(key_formats, 1):
    print(f"\n[测试 {i}/{len(key_formats)}] {key_cmd[:60]}...")
    
    try:
        # 构建完整命令
        full_cmd = f"{key_cmd} SELECT name FROM sqlite_master WHERE type='table' LIMIT 3;"
        
        result = subprocess.run(
            ["/opt/homebrew/bin/sqlcipher", str(DB_PATH), full_cmd],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0 and result.stdout and 'Error' not in result.stdout:
            print(f"✓ 成功!")
            print(f"输出:\n{result.stdout}")
            print(f"\n★★★ 找到正确的密钥格式! ★★★")
            print(f"格式: {key_cmd}")
            sys.exit(0)
        else:
            print(f"✗ 失败")
            if result.stderr:
                print(f"错误: {result.stderr.strip()}")
            if result.stdout:
                print(f"输出: {result.stdout.strip()}")
    
    except subprocess.TimeoutExpired:
        print(f"✗ 超时")
    except Exception as e:
        print(f"✗ 异常: {str(e)}")

print(f"\n{'='*60}")
print(f"所有格式都失败")
print(f"{'='*60}")
print(f"\n可能原因:")
print(f"1. 数据库使用了不同的密钥")
print(f"2. SQLCipher版本不兼容")
print(f"3. 数据库使用了自定义加密参数")
print(f"4. 用户ID不是实际的密钥")
