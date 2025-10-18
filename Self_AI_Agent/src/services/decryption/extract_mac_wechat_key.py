#!/usr/bin/env python3
"""
macOS微信聊天记录加密密钥提取工具
从微信数据库中提取用于解密RMFH文件的密钥
"""

import sqlite3
import os
import sys
from pathlib import Path
import hashlib

def find_wechat_db_path():
    """查找macOS微信数据库路径"""
    base_path = Path.home() / "Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat"
    
    if not base_path.exists():
        return None, "未找到微信容器目录"
    
    # 查找版本目录(如2.0b4.0.9)
    version_dirs = [d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("2.")]
    if not version_dirs:
        return None, "未找到微信版本目录"
    
    # 使用最新的版本目录
    version_dir = sorted(version_dirs, reverse=True)[0]
    
    # 查找用户ID目录(32位哈希)
    user_dirs = [d for d in version_dir.iterdir() if d.is_dir() and len(d.name) == 32]
    if not user_dirs:
        return None, f"在{version_dir}中未找到用户目录"
    
    # 通常只有一个用户目录
    user_dir = user_dirs[0]
    
    return user_dir, None

def extract_key_from_contact_db(user_dir):
    """从wccontact_new2.db中提取密钥"""
    contact_db = user_dir / "wccontact_new2.db"
    
    if not contact_db.exists():
        return None, f"未找到联系人数据库: {contact_db}"
    
    try:
        conn = sqlite3.connect(str(contact_db))
        cursor = conn.cursor()
        
        # 查询可能包含密钥的表
        # 微信可能在多个地方存储密钥信息
        queries = [
            "SELECT name FROM sqlite_master WHERE type='table'",
        ]
        
        tables = []
        for query in queries:
            try:
                cursor.execute(query)
                tables.extend([row[0] for row in cursor.fetchall()])
            except:
                continue
        
        print(f"✓ 找到数据库表: {', '.join(tables)}")
        
        # 查找可能包含密钥的字段
        for table in tables:
            try:
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [row[1] for row in cursor.fetchall()]
                
                # 查找可疑的二进制或文本字段
                for col in columns:
                    if any(keyword in col.lower() for keyword in ['key', 'pwd', 'password', 'secret', 'encrypt', 'cipher']):
                        cursor.execute(f"SELECT {col} FROM {table} LIMIT 1")
                        result = cursor.fetchone()
                        if result and result[0]:
                            print(f"✓ 在表'{table}'的字段'{col}'中找到可能的密钥: {result[0]}")
            except Exception as e:
                continue
        
        conn.close()
        return None, "未在联系人数据库中找到明确的密钥字段"
        
    except Exception as e:
        return None, f"读取数据库失败: {str(e)}"

def extract_key_from_message_db(user_dir):
    """从Message数据库中提取密钥"""
    message_dir = user_dir / "Message"
    
    if not message_dir.exists():
        return None, f"未找到Message目录: {message_dir}"
    
    # 查找msg_*.db文件
    msg_dbs = list(message_dir.glob("msg_*.db"))
    
    if not msg_dbs:
        return None, "未找到消息数据库文件"
    
    print(f"✓ 找到{len(msg_dbs)}个消息数据库")
    
    # 尝试从第一个数据库提取
    msg_db = msg_dbs[0]
    
    try:
        conn = sqlite3.connect(str(msg_db))
        cursor = conn.cursor()
        
        # 查询表结构
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"✓ 消息数据库表: {', '.join(tables)}")
        
        conn.close()
        return None, "未在消息数据库中找到密钥信息"
        
    except Exception as e:
        return None, f"读取消息数据库失败: {str(e)}"

def try_extract_from_plist():
    """尝试从微信的plist配置文件中提取密钥"""
    plist_paths = [
        Path.home() / "Library/Containers/com.tencent.xinWeChat/Data/Library/Preferences/com.tencent.xinWeChat.plist",
        Path.home() / "Library/Preferences/com.tencent.xinWeChat.plist",
    ]
    
    for plist_path in plist_paths:
        if plist_path.exists():
            print(f"✓ 找到配置文件: {plist_path}")
            try:
                import plistlib
                with open(plist_path, 'rb') as f:
                    plist_data = plistlib.load(f)
                    
                print("配置文件键:")
                for key in plist_data.keys():
                    print(f"  - {key}")
                    
                # 查找可能的密钥字段
                for key, value in plist_data.items():
                    if any(keyword in key.lower() for keyword in ['key', 'encrypt', 'cipher', 'secret']):
                        print(f"✓ 可能的密钥字段 '{key}': {value}")
                        
            except Exception as e:
                print(f"✗ 读取plist失败: {str(e)}")
    
    return None, "未在plist中找到密钥"

def analyze_rmfh_header(sample_file):
    """分析RMFH文件头部结构"""
    print(f"\n{'='*60}")
    print("RMFH文件结构分析")
    print(f"{'='*60}")
    
    with open(sample_file, 'rb') as f:
        header = f.read(128)
        
    print(f"文件: {sample_file}")
    print(f"大小: {os.path.getsize(sample_file)} 字节")
    print(f"\n前128字节十六进制:")
    print(header.hex())
    
    # 解析头部
    magic = header[0:4].decode('ascii')
    print(f"\n✓ Magic: {magic}")
    
    # 尝试解析其他字段
    import struct
    
    try:
        # 假设的头部结构
        timestamp = struct.unpack('<Q', header[4:12])[0] if len(header) >= 12 else 0
        version = struct.unpack('<I', header[12:16])[0] if len(header) >= 16 else 0
        
        print(f"✓ 可能的时间戳: {timestamp}")
        print(f"✓ 可能的版本号: {version}")
        
        # 加密数据从0x80开始
        print(f"\n✓ 加密数据起始位置: 0x80 (128字节)")
        print(f"✓ 前16字节加密数据: {header[128-16:128].hex() if len(header) >= 128 else '(不足)'}")
        
    except Exception as e:
        print(f"✗ 解析失败: {str(e)}")

def generate_possible_keys(user_dir):
    """基于用户信息生成可能的密钥"""
    print(f"\n{'='*60}")
    print("尝试生成可能的密钥")
    print(f"{'='*60}")
    
    # 微信可能使用的密钥生成方式
    # 1. 用户ID的哈希
    user_id = user_dir.name
    print(f"✓ 用户ID: {user_id}")
    
    possible_keys = []
    
    # MD5哈希
    key1 = hashlib.md5(user_id.encode()).hexdigest()
    possible_keys.append(("MD5(用户ID)", key1))
    
    # SHA256哈希
    key2 = hashlib.sha256(user_id.encode()).hexdigest()[:64]
    possible_keys.append(("SHA256(用户ID)[:64]", key2))
    
    # 用户ID本身(如果是64字符)
    if len(user_id) == 64:
        possible_keys.append(("用户ID直接", user_id))
    
    # 2. 设备信息相关
    try:
        import platform
        import uuid
        
        mac_address = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0,8*6,8)][::-1])
        machine_id = platform.node()
        
        key3 = hashlib.sha256(f"{user_id}{mac_address}".encode()).hexdigest()[:64]
        possible_keys.append(("SHA256(用户ID+MAC)[:64]", key3))
        
        key4 = hashlib.sha256(f"{user_id}{machine_id}".encode()).hexdigest()[:64]
        possible_keys.append(("SHA256(用户ID+机器名)[:64]", key4))
        
    except Exception as e:
        pass
    
    print(f"\n生成了 {len(possible_keys)} 个可能的密钥:")
    for name, key in possible_keys:
        print(f"  {name}: {key}")
    
    return possible_keys

def test_key_with_sample(key, sample_file):
    """使用样本文件测试密钥"""
    try:
        from Crypto.Cipher import AES
        from Crypto.Util.Padding import unpad
        
        with open(sample_file, 'rb') as f:
            # 跳过128字节头部
            f.seek(128)
            encrypted_data = f.read(1024)  # 读取1KB测试
        
        # 尝试解密
        key_bytes = bytes.fromhex(key)
        cipher = AES.new(key_bytes, AES.MODE_CBC, iv=b'\x00' * 16)  # 假设IV全0
        
        try:
            decrypted = cipher.decrypt(encrypted_data[:len(encrypted_data) // 16 * 16])
            
            # 检查是否包含可打印字符
            printable_ratio = sum(32 <= b < 127 for b in decrypted) / len(decrypted)
            
            if printable_ratio > 0.3:  # 超过30%可打印字符
                print(f"✓ 密钥可能有效! (可打印字符占比: {printable_ratio:.1%})")
                print(f"  前100字节解密结果: {decrypted[:100]}")
                return True
                
        except Exception as e:
            pass
            
    except Exception as e:
        pass
    
    return False

def main():
    print(f"{'='*60}")
    print("macOS微信聊天记录密钥提取工具")
    print(f"{'='*60}\n")
    
    # 1. 查找微信目录
    user_dir, error = find_wechat_db_path()
    if error:
        print(f"✗ {error}")
        print("\n请确保:")
        print("  1. 已安装微信Mac版")
        print("  2. 至少登录过一次微信")
        return 1
    
    print(f"✓ 找到微信用户目录: {user_dir}\n")
    
    # 2. 分析导出数据中的样本文件
    uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads"
    sample_dirs = list(uploads_dir.glob("extracted_import_*/*/ChatPackage"))
    
    sample_file = None
    if sample_dirs:
        sample_files = list(sample_dirs[0].glob("*"))
        if sample_files:
            sample_file = sample_files[0]
            analyze_rmfh_header(sample_file)
    
    # 3. 尝试从数据库提取
    print(f"\n{'='*60}")
    print("从微信数据库提取密钥")
    print(f"{'='*60}\n")
    
    key, error = extract_key_from_contact_db(user_dir)
    if error:
        print(f"联系人数据库: {error}")
    
    key, error = extract_key_from_message_db(user_dir)
    if error:
        print(f"消息数据库: {error}")
    
    # 4. 尝试从plist提取
    try_extract_from_plist()
    
    # 5. 生成可能的密钥并测试
    possible_keys = generate_possible_keys(user_dir)
    
    if sample_file:
        print(f"\n{'='*60}")
        print("测试可能的密钥")
        print(f"{'='*60}\n")
        
        for name, key in possible_keys:
            print(f"测试 {name}...")
            if test_key_with_sample(key, sample_file):
                print(f"\n{'='*60}")
                print("✓✓✓ 可能找到有效密钥! ✓✓✓")
                print(f"{'='*60}")
                print(f"密钥类型: {name}")
                print(f"密钥值: {key}")
                print(f"\n请将此密钥保存并使用!")
                return 0
        
        print("\n✗ 所有生成的密钥都无效")
    
    # 6. 提供手动指南
    print(f"\n{'='*60}")
    print("手动提取密钥指南")
    print(f"{'='*60}\n")
    
    print("由于自动提取失败,您可以尝试以下方法:")
    print("\n1. 使用微信官方导出功能:")
    print("   - 打开微信 -> 设置 -> 通用 -> 聊天记录备份与迁移")
    print("   - 选择'导出聊天记录' -> 选择'可读文本格式'(如果有此选项)")
    print("   - 重新导出数据")
    
    print("\n2. 使用第三方工具:")
    print("   - WeChatTweak-macOS: https://github.com/Sunnyyoung/WeChatTweak-macOS")
    print("   - 此工具可能提供更底层的数据访问")
    
    print("\n3. 联系开发者:")
    print("   - 提供您的微信版本号")
    print("   - 我们可以协助分析具体的加密方案")
    
    print(f"\n微信版本信息:")
    print(f"  用户目录: {user_dir}")
    print(f"  版本路径: {user_dir.parent}")
    
    return 1

if __name__ == "__main__":
    sys.exit(main())
