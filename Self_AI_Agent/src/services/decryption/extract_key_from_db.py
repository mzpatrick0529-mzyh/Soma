#!/usr/bin/env python3
"""
从微信数据库中提取加密密钥
"""

import sqlite3
import sys
import os
from pathlib import Path

def analyze_database(db_path):
    """分析数据库结构和内容"""
    print(f"\n{'='*60}")
    print(f"分析数据库: {db_path.name}")
    print(f"{'='*60}")
    
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # 获取所有表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"\n✓ 找到 {len(tables)} 个表:")
        for table in tables:
            print(f"  - {table}")
        
        # 分析每个表的结构
        for table in tables:
            print(f"\n表 '{table}' 的字段:")
            cursor.execute(f"PRAGMA table_info({table})")
            columns = cursor.fetchall()
            
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                print(f"  - {col_name} ({col_type})")
                
                # 检查是否有可疑的密钥字段
                if any(keyword in col_name.lower() for keyword in ['key', 'pwd', 'password', 'secret', 'encrypt', 'cipher', 'salt', 'iv']):
                    # 尝试读取内容
                    try:
                        cursor.execute(f"SELECT {col_name} FROM {table} LIMIT 3")
                        values = cursor.fetchall()
                        if values:
                            print(f"    ⚠️ 可疑字段! 前3个值:")
                            for i, val in enumerate(values, 1):
                                val_str = str(val[0])[:100] if val[0] else "NULL"
                                print(f"       {i}. {val_str}")
                    except Exception as e:
                        print(f"    ✗ 读取失败: {str(e)}")
        
        # 查找包含二进制数据的字段
        print(f"\n{'='*60}")
        print("查找包含二进制数据的字段")
        print(f"{'='*60}")
        
        for table in tables:
            cursor.execute(f"PRAGMA table_info({table})")
            columns = [col[1] for col in cursor.fetchall()]
            
            for col in columns:
                try:
                    cursor.execute(f"SELECT typeof({col}), length({col}), {col} FROM {table} WHERE {col} IS NOT NULL LIMIT 1")
                    result = cursor.fetchone()
                    if result and result[0] == 'blob' and result[1] and result[1] >= 16:
                        print(f"\n✓ {table}.{col}:")
                        print(f"  类型: {result[0]}, 长度: {result[1]} 字节")
                        if result[2]:
                            hex_data = result[2].hex() if isinstance(result[2], bytes) else str(result[2])
                            print(f"  前64字节: {hex_data[:128]}")
                except Exception as e:
                    pass
        
        conn.close()
        
    except Exception as e:
        print(f"✗ 分析失败: {str(e)}")

def search_for_keys(user_dir):
    """在用户目录中搜索所有可能包含密钥的数据库"""
    print(f"\n{'='*60}")
    print(f"搜索密钥")
    print(f"{'='*60}")
    
    # 常见的数据库文件
    db_files = [
        user_dir / "Contact" / "wccontact_new2.db",
        user_dir / "Message" / "msg_0.db",
        user_dir / "Message" / "msg_1.db",
        user_dir / "Account" / "account.db",
        user_dir / "ChatSync" / "ChatSync.db",
    ]
    
    # 添加其他可能的db文件
    for pattern in ["*.db", "*.sqlite", "*.sqlite3"]:
        db_files.extend(user_dir.rglob(pattern))
    
    # 去重
    db_files = list(set([f for f in db_files if f.exists()]))
    
    print(f"✓ 找到 {len(db_files)} 个数据库文件\n")
    
    for db_file in db_files:
        analyze_database(db_file)

def try_common_encryption_keys(user_id):
    """尝试常见的加密密钥生成方法"""
    import hashlib
    
    print(f"\n{'='*60}")
    print("尝试常见加密方案")
    print(f"{'='*60}")
    
    # 微信可能的密钥生成方式
    methods = [
        ("用户ID", user_id),
        ("MD5(用户ID)", hashlib.md5(user_id.encode()).hexdigest()),
        ("SHA1(用户ID)", hashlib.sha1(user_id.encode()).hexdigest()),
        ("SHA256(用户ID)[:32]", hashlib.sha256(user_id.encode()).hexdigest()[:32]),
        ("SHA256(用户ID)[:64]", hashlib.sha256(user_id.encode()).hexdigest()),
    ]
    
    # IMEI相关(如果可以获取)
    try:
        import uuid
        mac = ':'.join(['{:02x}'.format((uuid.getnode() >> i) & 0xff) for i in range(0,8*6,8)][::-1])
        methods.extend([
            ("MD5(用户ID+MAC)", hashlib.md5(f"{user_id}{mac}".encode()).hexdigest()),
            ("SHA256(用户ID+MAC)", hashlib.sha256(f"{user_id}{mac}".encode()).hexdigest()[:64]),
        ])
    except:
        pass
    
    print(f"\n生成了 {len(methods)} 个候选密钥:\n")
    for name, key in methods:
        print(f"  {name}:")
        print(f"    {key}")
    
    return methods

def main():
    # 查找活跃的微信用户目录
    base_path = Path.home() / "Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat"
    
    if not base_path.exists():
        print("✗ 未找到微信安装目录")
        return 1
    
    # 查找版本目录
    version_dirs = sorted([d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("2.")], reverse=True)
    if not version_dirs:
        print("✗ 未找到微信版本目录")
        return 1
    
    version_dir = version_dirs[0]
    
    # 查找用户目录(排除空MD5)
    user_dirs = [d for d in version_dir.iterdir() if d.is_dir() and len(d.name) == 32 and d.name != "d41d8cd98f00b204e9800998ecf8427e"]
    
    if not user_dirs:
        print("✗ 未找到活跃的微信用户目录")
        return 1
    
    user_dir = user_dirs[0]
    user_id = user_dir.name
    
    print(f"{'='*60}")
    print("微信密钥提取工具 v2")
    print(f"{'='*60}")
    print(f"\n✓ 用户目录: {user_dir}")
    print(f"✓ 用户ID: {user_id}")
    
    # 搜索数据库
    search_for_keys(user_dir)
    
    # 生成候选密钥
    candidate_keys = try_common_encryption_keys(user_id)
    
    # 保存结果
    output_file = Path(__file__).parent / "candidate_keys.txt"
    with open(output_file, 'w') as f:
        f.write(f"用户ID: {user_id}\n\n")
        f.write("候选密钥:\n")
        for name, key in candidate_keys:
            f.write(f"{name}: {key}\n")
    
    print(f"\n{'='*60}")
    print(f"✓ 候选密钥已保存到: {output_file}")
    print(f"{'='*60}")
    print("\n下一步: 使用这些密钥尝试解密RMFH文件")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
