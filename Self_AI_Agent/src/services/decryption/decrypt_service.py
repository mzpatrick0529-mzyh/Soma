#!/usr/bin/env python3
"""
WeChat数据解密服务
基于WeChatMsg项目的核心解密功能
"""

import sys
import json
import os
import struct
from pathlib import Path
from typing import Dict, List, Optional
import argparse

# 尝试导入加密相关库
try:
    from Crypto.Cipher import AES
    from Crypto.Util.Padding import unpad
    CRYPTO_AVAILABLE = True
except ImportError:
    CRYPTO_AVAILABLE = False
    print("Warning: pycryptodome not installed. Install with: pip install pycryptodome", file=sys.stderr)


class WeChatDecryptor:
    """WeChat数据解密器"""
    
    def __init__(self, db_key: Optional[str] = None):
        """
        初始化解密器
        
        Args:
            db_key: 微信数据库密钥（32位十六进制字符串）
        """
        self.db_key = db_key
        if db_key:
            try:
                self.key_bytes = bytes.fromhex(db_key)
            except ValueError:
                raise ValueError("Invalid database key format. Expected 32-character hex string.")
        else:
            self.key_bytes = None
    
    def detect_file_type(self, file_path: str) -> str:
        """
        检测文件类型
        
        Args:
            file_path: 文件路径
            
        Returns:
            文件类型: 'rmfh', 'tar.enc', 'sqlite', 'text', 'unknown'
        """
        path = Path(file_path)
        
        # 检查扩展名
        if path.suffix == '.enc':
            return 'tar.enc'
        if path.suffix in ['.db', '.sqlite', '.wcdb']:
            return 'sqlite'
        
        # 检查文件头
        try:
            with open(file_path, 'rb') as f:
                header = f.read(16)
                
                # RMFH格式（ChatPackage）
                if header[:4] == b'RMFH':
                    return 'rmfh'
                
                # SQLite格式
                if header[:16] == b'SQLite format 3\x00':
                    return 'sqlite'
                
                # 加密的SQLite
                if len(header) == 16 and header[0:1] in [b'\x00', b'\x01']:
                    return 'sqlite_encrypted'
        except Exception as e:
            print(f"Error detecting file type: {e}", file=sys.stderr)
        
        return 'unknown'
    
    def decrypt_rmfh_file(self, input_path: str, output_path: str) -> bool:
        """
        解密RMFH格式的ChatPackage文件
        
        Args:
            input_path: 加密文件路径
            output_path: 输出文件路径
            
        Returns:
            是否成功
        """
        if not CRYPTO_AVAILABLE or not self.key_bytes:
            print(f"Cannot decrypt RMFH: crypto not available or no key", file=sys.stderr)
            return False
        
        try:
            with open(input_path, 'rb') as f:
                # 读取文件头
                magic = f.read(4)  # 'RMFH'
                if magic != b'RMFH':
                    print(f"Not a valid RMFH file: {input_path}", file=sys.stderr)
                    return False
                
                # 读取头部信息（可能需要根据实际格式调整）
                header = f.read(60)  # RMFH头部通常64字节
                
                # 读取加密数据
                encrypted_data = f.read()
            
            # 解密（使用AES-CBC，根据实际情况调整）
            iv = self.key_bytes[:16]  # 使用密钥前16字节作为IV
            cipher = AES.new(self.key_bytes, AES.MODE_CBC, iv)
            decrypted_data = unpad(cipher.decrypt(encrypted_data), AES.block_size)
            
            # 写入输出文件
            with open(output_path, 'wb') as f:
                f.write(decrypted_data)
            
            print(f"✓ Decrypted RMFH: {input_path} -> {output_path}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to decrypt RMFH {input_path}: {e}", file=sys.stderr)
            return False
    
    def decrypt_tar_enc(self, input_path: str, output_dir: str) -> bool:
        """
        解密.tar.enc格式的Media文件
        
        Args:
            input_path: 加密tar文件路径
            output_dir: 输出目录
            
        Returns:
            是否成功
        """
        if not CRYPTO_AVAILABLE or not self.key_bytes:
            print(f"Cannot decrypt tar.enc: crypto not available or no key", file=sys.stderr)
            return False
        
        try:
            with open(input_path, 'rb') as f:
                encrypted_data = f.read()
            
            # 解密tar数据
            iv = self.key_bytes[:16]
            cipher = AES.new(self.key_bytes, AES.MODE_CBC, iv)
            decrypted_tar = unpad(cipher.decrypt(encrypted_data), AES.block_size)
            
            # 保存解密的tar文件
            tar_path = Path(output_dir) / (Path(input_path).stem + '.tar')
            with open(tar_path, 'wb') as f:
                f.write(decrypted_tar)
            
            # 解压tar（需要tarfile模块）
            import tarfile
            with tarfile.open(tar_path, 'r') as tar:
                tar.extractall(output_dir)
            
            # 删除临时tar文件
            tar_path.unlink()
            
            print(f"✓ Decrypted tar.enc: {input_path} -> {output_dir}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to decrypt tar.enc {input_path}: {e}", file=sys.stderr)
            return False
    
    def decrypt_directory(self, input_dir: str, output_dir: str) -> Dict[str, int]:
        """
        解密整个目录
        
        Args:
            input_dir: 输入目录（包含ChatPackage/Media/Index）
            output_dir: 输出目录
            
        Returns:
            统计信息: {success, failed, skipped}
        """
        stats = {'success': 0, 'failed': 0, 'skipped': 0}
        
        input_path = Path(input_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # 遍历所有文件
        for root, dirs, files in os.walk(input_dir):
            rel_root = Path(root).relative_to(input_path)
            
            for file in files:
                input_file = Path(root) / file
                file_type = self.detect_file_type(str(input_file))
                
                if file_type == 'rmfh':
                    # 解密RMFH文件
                    output_file = output_path / rel_root / (file + '.decrypted')
                    output_file.parent.mkdir(parents=True, exist_ok=True)
                    if self.decrypt_rmfh_file(str(input_file), str(output_file)):
                        stats['success'] += 1
                    else:
                        stats['failed'] += 1
                
                elif file_type == 'tar.enc':
                    # 解密tar.enc文件
                    output_subdir = output_path / rel_root / file.replace('.tar.enc', '')
                    output_subdir.mkdir(parents=True, exist_ok=True)
                    if self.decrypt_tar_enc(str(input_file), str(output_subdir)):
                        stats['success'] += 1
                    else:
                        stats['failed'] += 1
                
                elif file_type == 'sqlite_encrypted':
                    print(f"⚠ Encrypted SQLite DB requires special handling: {input_file}", file=sys.stderr)
                    stats['skipped'] += 1
                
                else:
                    # 直接复制未加密文件
                    output_file = output_path / rel_root / file
                    output_file.parent.mkdir(parents=True, exist_ok=True)
                    import shutil
                    shutil.copy2(input_file, output_file)
                    stats['skipped'] += 1
        
        return stats


def main():
    parser = argparse.ArgumentParser(description='WeChat Data Decryption Service')
    parser.add_argument('--key', required=True, help='WeChat database key (32-char hex)')
    parser.add_argument('--input', required=True, help='Input directory with encrypted data')
    parser.add_argument('--output', required=True, help='Output directory for decrypted data')
    parser.add_argument('--json', action='store_true', help='Output results as JSON')
    
    args = parser.parse_args()
    
    # 创建解密器
    try:
        decryptor = WeChatDecryptor(args.key)
    except ValueError as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)
    
    # 解密目录
    stats = decryptor.decrypt_directory(args.input, args.output)
    
    # 输出结果
    result = {
        'status': 'completed',
        'input': args.input,
        'output': args.output,
        'stats': stats
    }
    
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print(f"\n=== Decryption Complete ===")
        print(f"Success: {stats['success']}")
        print(f"Failed: {stats['failed']}")
        print(f"Skipped: {stats['skipped']}")
        print(f"Output: {args.output}")
    
    sys.exit(0 if stats['failed'] == 0 else 1)


if __name__ == '__main__':
    main()
