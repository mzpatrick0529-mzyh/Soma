#!/usr/bin/env python3
"""
尝试使用候选密钥解密RMFH文件
"""

import sys
import os
from pathlib import Path

def test_decrypt_with_key(rmfh_file, key_hex):
    """使用给定密钥尝试解密RMFH文件"""
    try:
        from Crypto.Cipher import AES
        from Crypto.Util.Padding import unpad
    except ImportError:
        print("✗ 需要安装pycryptodome: pip3 install pycryptodome")
        return False
    
    try:
        # 读取RMFH文件
        with open(rmfh_file, 'rb') as f:
            # 跳过128字节头部
            f.seek(128)
            encrypted_data = f.read(2048)  # 读取2KB测试
        
        if len(encrypted_data) < 16:
            print(f"✗ 文件太小: {len(encrypted_data)} 字节")
            return False
        
        # 转换密钥
        if len(key_hex) == 64:
            key_bytes = bytes.fromhex(key_hex)
        elif len(key_hex) == 32:
            # 如果是32字符,重复一次得到64字符
            key_hex = key_hex * 2
            key_bytes = bytes.fromhex(key_hex)
        else:
            # 如果长度不对,尝试作为字符串使用
            import hashlib
            key_bytes = hashlib.sha256(key_hex.encode()).digest()
        
        # 尝试不同的IV
        ivs = [
            b'\x00' * 16,  # 全0 IV
            key_bytes[:16],  # 使用密钥的前16字节作为IV
            bytes.fromhex('00000000000000000000000000000000'),
        ]
        
        for iv_idx, iv in enumerate(ivs):
            try:
                # AES-CBC 解密
                cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
                decrypted = cipher.decrypt(encrypted_data[:len(encrypted_data) // 16 * 16])
                
                # 检查解密结果的特征
                # 1. 可打印字符比例
                printable_ratio = sum(32 <= b < 127 for b in decrypted) / len(decrypted)
                
                # 2. 是否包含常见的中文UTF-8序列或聊天相关字符串
                text_attempts = [
                    decrypted,
                    decrypted[1:],  # 可能有1字节padding
                    decrypted[2:],  # 可能有2字节padding
                ]
                
                for text in text_attempts:
                    try:
                        decoded = text.decode('utf-8', errors='ignore')
                        # 检查是否包含常见的聊天关键词
                        keywords = ['msg', 'content', 'time', 'user', 'text', '消息', '内容', '时间']
                        keyword_found = any(kw in decoded.lower() for kw in keywords)
                        
                        if printable_ratio > 0.2 or keyword_found:
                            print(f"✓ IV模式{iv_idx} 可能有效!")
                            print(f"  可打印字符: {printable_ratio:.1%}")
                            print(f"  前200字符: {decoded[:200]}")
                            if keyword_found:
                                print(f"  ✓ 找到聊天关键词!")
                            return True
                    except:
                        pass
                        
            except Exception as e:
                continue
        
    except Exception as e:
        print(f"✗ 解密失败: {str(e)}")
        return False
    
    return False

def main():
    if len(sys.argv) > 1:
        key_to_test = sys.argv[1]
        print(f"测试单个密钥: {key_to_test}")
    else:
        # 读取候选密钥文件
        key_file = Path(__file__).parent / "candidate_keys.txt"
        if not key_file.exists():
            print("✗ 请先运行 extract_key_from_db.py 生成候选密钥")
            return 1
        
        with open(key_file, 'r') as f:
            lines = f.readlines()
        
        # 提取密钥
        keys = []
        for line in lines:
            if ':' in line and len(line.strip()) > 30:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    name = parts[0].strip()
                    key_value = parts[1].strip()
                    if len(key_value) >= 32:
                        keys.append((name, key_value))
        
        if not keys:
            print("✗ 未找到候选密钥")
            return 1
        
        print(f"{'='*60}")
        print(f"RMFH密钥测试工具")
        print(f"{'='*60}\n")
        print(f"✓ 加载了 {len(keys)} 个候选密钥\n")
    
    # 查找样本RMFH文件
    uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads"
    sample_files = list(uploads_dir.glob("extracted_import_*/*/ChatPackage/*"))[:5]
    
    if not sample_files:
        print("✗ 未找到RMFH样本文件")
        return 1
    
    print(f"✓ 找到 {len(sample_files)} 个样本文件\n")
    
    # 测试每个密钥
    if len(sys.argv) > 1:
        keys = [("手动输入", key_to_test)]
    
    for name, key in keys:
        print(f"{'='*60}")
        print(f"测试: {name}")
        print(f"密钥: {key}")
        print(f"{'='*60}")
        
        success_count = 0
        for sample_file in sample_files:
            print(f"\n样本: {sample_file.name}")
            if test_decrypt_with_key(sample_file, key):
                success_count += 1
                print("✓ 解密成功!")
        
        if success_count > 0:
            print(f"\n{'='*60}")
            print(f"✓✓✓ 找到有效密钥! ✓✓✓")
            print(f"{'='*60}")
            print(f"密钥类型: {name}")
            print(f"密钥值: {key}")
            print(f"成功解密: {success_count}/{len(sample_files)} 个文件")
            print(f"\n请保存此密钥并设置环境变量:")
            print(f"export WECHAT_DB_KEY='{key}'")
            return 0
        
        print(f"\n✗ 该密钥无效 (0/{len(sample_files)} 成功)\n")
    
    print(f"{'='*60}")
    print("所有候选密钥都无效")
    print(f"{'='*60}\n")
    print("可能的原因:")
    print("1. macOS微信使用了更复杂的密钥派生算法")
    print("2. 密钥存储在系统钥匙串的其他位置")
    print("3. 需要从微信进程内存中提取密钥")
    print("\n建议:")
    print("1. 尝试使用 WeChatTweak-macOS 工具")
    print("2. 重新导出微信数据,选择'可读文本'格式")
    print("3. 联系开发者获取更多帮助")
    
    return 1

if __name__ == "__main__":
    sys.exit(main())
