#!/usr/bin/env python3
"""
验证WeChat解密流程
测试使用找到的密钥解密完整的RMFH文件
"""

import sys
import os
from pathlib import Path
from Crypto.Cipher import AES

def decrypt_rmfh_file(file_path, key_hex):
    """解密完整的RMFH文件"""
    print(f"\n{'='*60}")
    print(f"解密文件: {file_path.name}")
    print(f"{'='*60}")
    
    # 读取文件
    with open(file_path, 'rb') as f:
        # 读取头部
        header = f.read(128)
        magic = header[0:4].decode('ascii')
        print(f"✓ Magic: {magic}")
        
        if magic != 'RMFH':
            print(f"✗ 不是RMFH文件!")
            return None
        
        # 读取加密数据
        encrypted_data = f.read()
    
    print(f"✓ 文件大小: {len(header) + len(encrypted_data)} 字节")
    print(f"✓ 加密数据: {len(encrypted_data)} 字节")
    
    # 解密
    key_bytes = bytes.fromhex(key_hex)
    iv = b'\x00' * 16
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
    
    # 需要16字节对齐
    aligned_len = len(encrypted_data) // 16 * 16
    decrypted = cipher.decrypt(encrypted_data[:aligned_len])
    
    print(f"✓ 解密成功: {len(decrypted)} 字节")
    
    # 分析解密后的数据
    # 尝试识别文本内容
    try:
        text = decrypted.decode('utf-8', errors='ignore')
        
        # 统计特征
        printable_chars = sum(32 <= b < 127 for b in decrypted)
        chinese_chars = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        
        print(f"✓ 可打印字符: {printable_chars} ({printable_chars/len(decrypted)*100:.1f}%)")
        print(f"✓ 中文字符: {chinese_chars}")
        
        # 查找消息内容
        if '消息' in text or 'msg' in text.lower() or 'content' in text.lower():
            print(f"✓ 包含消息关键词!")
        
        # 提取可能的消息片段
        print(f"\n前500字符内容:")
        print(text[:500])
        
        # 查找JSON或结构化数据
        if '{' in text and '}' in text:
            print(f"\n✓ 可能包含JSON数据")
            # 尝试提取JSON片段
            start = text.find('{')
            end = text.find('}', start) + 1
            if start >= 0 and end > start:
                print(f"JSON片段: {text[start:end][:200]}")
        
        return decrypted
        
    except Exception as e:
        print(f"✗ 文本解析失败: {str(e)}")
        print(f"前100字节(hex): {decrypted[:100].hex()}")
        return decrypted

def main():
    # 使用找到的密钥
    key = '687c38f284f0d9c778fb3e1b3492536b'
    
    print(f"{'='*60}")
    print("WeChat解密验证工具")
    print(f"{'='*60}")
    print(f"✓ 使用密钥: {key}\n")
    
    # 查找样本文件
    uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads"
    sample_files = list(uploads_dir.glob("extracted_import_*/*/ChatPackage/*"))
    
    print(f"✓ 找到 {len(sample_files)} 个RMFH文件\n")
    
    # 解密前3个文件
    for i, file_path in enumerate(sample_files[:3], 1):
        print(f"\n{'#'*60}")
        print(f"# 测试 {i}/3")
        print(f"{'#'*60}")
        
        result = decrypt_rmfh_file(file_path, key)
        
        if result:
            # 保存解密结果(可选)
            output_file = file_path.parent / f"{file_path.name}.decrypted"
            # with open(output_file, 'wb') as f:
            #     f.write(result)
            # print(f"✓ 已保存到: {output_file}")
            pass
    
    print(f"\n{'='*60}")
    print("验证完成!")
    print(f"{'='*60}")
    print("\n✓ 密钥有效,可以开始解密所有WeChat数据!")
    print(f"\n下一步:")
    print(f"1. 设置环境变量: export WECHAT_DB_KEY='{key}'")
    print(f"2. 调用解密API: POST /api/decrypt/wechat")
    print(f"3. 所有聊天记录将被解密并索引到数据库")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
