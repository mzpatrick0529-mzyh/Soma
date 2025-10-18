#!/usr/bin/env python3
"""
WeChat SQLCipher数据库读取工具
直接从微信本地数据库读取完整聊天记录
"""

import sys
import sqlite3
from pathlib import Path
import json
from datetime import datetime

def test_database_access(db_path: Path, key: str):
    """测试是否能访问数据库"""
    print(f"\n{'='*60}")
    print(f"测试数据库访问")
    print(f"{'='*60}")
    
    print(f"数据库路径: {db_path}")
    print(f"文件存在: {db_path.exists()}")
    
    if not db_path.exists():
        return False
    
    print(f"文件大小: {db_path.stat().st_size / (1024*1024):.2f} MB")
    
    # 尝试1: 直接打开(如果未加密)
    print(f"\n尝试1: 直接打开...")
    try:
        conn = sqlite3.connect(str(db_path))
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
        cursor.fetchone()
        print(f"✓ 数据库未加密,可以直接访问!")
        conn.close()
        return True
    except sqlite3.DatabaseError as e:
        error_msg = str(e)
        print(f"✗ 直接访问失败: {error_msg}")
        
        if "encrypted" in error_msg.lower() or "not a database" in error_msg.lower():
            print(f"  → 数据库已加密,需要密钥")
        elif "locked" in error_msg.lower():
            print(f"  → 数据库被锁定(微信可能正在使用)")
        
    # 尝试2: 使用PRAGMA key(标准sqlite3不支持,需要SQLCipher)
    print(f"\n尝试2: 使用PRAGMA key...")
    try:
        conn = sqlite3.connect(str(db_path))
        # 尝试设置密钥
        conn.execute(f"PRAGMA key = 'x\"{key}\"'")
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' LIMIT 1")
        cursor.fetchone()
        print(f"✓ 密钥有效!")
        conn.close()
        return True
    except Exception as e:
        print(f"✗ PRAGMA key不支持: {str(e)}")
        print(f"  → Python sqlite3模块不支持SQLCipher")
        print(f"  → 需要编译安装pysqlcipher3")
    
    return False

def read_wechat_messages(db_path: Path, key: str = None):
    """
    读取微信消息
    
    注意: 标准sqlite3不支持SQLCipher,此函数主要用于测试未加密的数据库
    """
    conn = sqlite3.connect(str(db_path))
    
    if key:
        try:
            conn.execute(f"PRAGMA key = 'x\"{key}\"'")
        except:
            pass
    
    # 列出所有表
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    print(f"\n找到 {len(tables)} 个表:")
    for table in tables:
        cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  - {table}: {count} 条记录")
        
        # 查看表结构
        cursor = conn.execute(f"PRAGMA table_info({table})")
        columns = cursor.fetchall()
        print(f"    字段: {', '.join(c[1] for c in columns)}")
    
    conn.close()

def check_wechat_databases():
    """检查微信数据库文件"""
    print(f"{'='*60}")
    print(f"WeChat数据库检查工具")
    print(f"{'='*60}\n")
    
    # 查找微信用户目录
    base_path = Path.home() / "Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat"
    
    if not base_path.exists():
        print(f"✗ 未找到微信目录: {base_path}")
        return 1
    
    # 查找用户ID目录
    version_dirs = sorted([d for d in base_path.iterdir() if d.is_dir() and d.name.startswith("2.")], reverse=True)
    if not version_dirs:
        print(f"✗ 未找到版本目录")
        return 1
    
    version_dir = version_dirs[0]
    user_dirs = [d for d in version_dir.iterdir() if d.is_dir() and len(d.name) == 32]
    
    print(f"✓ 微信版本: {version_dir.name}")
    print(f"✓ 找到 {len(user_dirs)} 个用户目录\n")
    
    for user_dir in user_dirs:
        user_id = user_dir.name
        print(f"\n{'='*60}")
        print(f"用户ID: {user_id}")
        print(f"{'='*60}")
        
        # 检查Message目录
        message_dir = user_dir / "Message"
        if not message_dir.exists():
            print(f"✗ Message目录不存在")
            continue
        
        # 查找msg_*.db文件
        msg_dbs = list(message_dir.glob("msg_*.db"))
        print(f"✓ 找到 {len(msg_dbs)} 个消息数据库\n")
        
        for i, db_path in enumerate(msg_dbs, 1):
            print(f"\n[{i}/{len(msg_dbs)}] {db_path.name}")
            print(f"{'-'*60}")
            
            # 测试访问
            accessible = test_database_access(db_path, user_id)
            
            if accessible:
                # 尝试读取内容
                try:
                    read_wechat_messages(db_path)
                except Exception as e:
                    print(f"✗ 读取失败: {str(e)}")
            
            if i >= 2:  # 只测试前2个数据库
                break
    
    return 0

def main():
    result = check_wechat_databases()
    
    if result != 0:
        print(f"\n{'='*60}")
        print(f"总结")
        print(f"{'='*60}\n")
        print(f"Python标准sqlite3模块**不支持SQLCipher加密**")
        print(f"\n解决方案:")
        print(f"\n1. 安装SQLCipher命令行工具:")
        print(f"   brew install sqlcipher")
        print(f"   sqlcipher ~/Library/.../msg_0.db")
        print(f"   > PRAGMA key = 'x\"687c38f284f0d9c778fb3e1b3492536b\"';")
        print(f"   > .tables")
        print(f"\n2. 编译安装pysqlcipher3(需要系统级SQLCipher库):")
        print(f"   brew install sqlcipher")
        print(f"   SQLCIPHER_PATH=$(brew --prefix sqlcipher)")
        print(f"   pip3 install pysqlcipher3")
        print(f"\n3. 使用微信提供的未加密导出:")
        print(f"   微信 -> 设置 -> 通用 -> 聊天记录迁移")
        print(f"   选择导出为文本或HTML格式")
    
    return result

if __name__ == "__main__":
    sys.exit(main())
