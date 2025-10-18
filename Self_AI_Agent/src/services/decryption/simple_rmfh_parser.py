#!/usr/bin/env python3
"""
RMFH文件简化解析器 - 不依赖blackboxprotobuf
直接提取所有可用文本,用于RAG系统
"""

import sys
import os
from pathlib import Path
import struct
import json
import re
from typing import Dict, List, Any, Optional
from Crypto.Cipher import AES
from datetime import datetime

class SimpleRMFHParser:
    """简化的RMFH文件解析器 - 专注于文本提取"""
    
    def __init__(self, key_hex: str):
        """初始化解析器
        
        Args:
            key_hex: 64字符十六进制密钥
        """
        self.key = bytes.fromhex(key_hex)
        self.iv = b'\x00' * 16
    
    def decrypt_file(self, file_path: Path) -> Optional[bytes]:
        """解密RMFH文件"""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(128)
                encrypted = f.read()
            
            if header[0:4] != b'RMFH':
                return None
            
            cipher = AES.new(self.key, AES.MODE_CBC, iv=self.iv)
            aligned_len = len(encrypted) // 16 * 16
            decrypted = cipher.decrypt(encrypted[:aligned_len])
            
            return decrypted
            
        except Exception as e:
            return None
    
    def parse(self, file_path: Path) -> Dict[str, Any]:
        """解析RMFH文件,提取所有可用文本
        
        专注于提取文本内容用于RAG,不需要完整的结构解析
        """
        result = {
            'file_path': str(file_path),
            'file_name': file_path.name,
            'success': False,
            'text_chunks': [],  # 提取的文本片段
            'full_text': '',  # 合并的完整文本
            'metadata': {},
            'stats': {},
        }
        
        # 1. 解密
        decrypted = self.decrypt_file(file_path)
        if decrypted is None:
            return result
        
        # 2. 提取元数据
        result['metadata'] = self.extract_metadata(file_path, decrypted)
        
        # 3. 多种方式提取文本
        all_chunks = []
        
        # 方法1: UTF-8解码提取
        chunks_utf8 = self.extract_text_utf8(decrypted)
        all_chunks.extend(chunks_utf8)
        
        # 方法2: 搜索中文字符
        chunks_chinese = self.extract_chinese_text(decrypted)
        all_chunks.extend(chunks_chinese)
        
        # 方法3: 搜索英文单词
        chunks_english = self.extract_english_text(decrypted)
        all_chunks.extend(chunks_english)
        
        # 去重和过滤
        result['text_chunks'] = self.deduplicate_chunks(all_chunks)
        result['full_text'] = '\n'.join(result['text_chunks'])
        
        # 4. 统计
        result['stats'] = {
            'raw_size': len(decrypted),
            'total_chunks': len(result['text_chunks']),
            'total_chars': len(result['full_text']),
            'printable_ratio': sum(32 <= b < 127 for b in decrypted) / len(decrypted),
        }
        
        result['success'] = True
        return result
    
    def extract_text_utf8(self, data: bytes) -> List[str]:
        """方法1: UTF-8解码提取连续可打印文本"""
        chunks = []
        
        try:
            text = data.decode('utf-8', errors='ignore')
            current_chunk = []
            
            for char in text:
                # 保留可打印字符(包括中文、英文、数字、标点)
                if char.isprintable() and ord(char) > 31:
                    current_chunk.append(char)
                else:
                    # 遇到不可打印字符,结束当前chunk
                    if len(current_chunk) >= 3:
                        chunk_text = ''.join(current_chunk).strip()
                        if chunk_text and len(chunk_text) >= 3:
                            chunks.append(chunk_text)
                    current_chunk = []
            
            # 添加最后一个chunk
            if len(current_chunk) >= 3:
                chunk_text = ''.join(current_chunk).strip()
                if chunk_text:
                    chunks.append(chunk_text)
                    
        except Exception:
            pass
        
        return chunks
    
    def extract_chinese_text(self, data: bytes) -> List[str]:
        """方法2: 专门提取中文文本"""
        chunks = []
        
        try:
            text = data.decode('utf-8', errors='ignore')
            
            # 正则查找中文字符串(至少2个连续中文字符)
            pattern = r'[\u4e00-\u9fff]{2,}(?:[\u4e00-\u9fff\w\s,.!?;:，。！?；:、…""''《》【】()（）-]+)?'
            matches = re.finditer(pattern, text)
            
            for match in matches:
                chunk = match.group().strip()
                if len(chunk) >= 2:
                    chunks.append(chunk)
                    
        except Exception:
            pass
        
        return chunks
    
    def extract_english_text(self, data: bytes) -> List[str]:
        """方法3: 提取英文文本"""
        chunks = []
        
        try:
            text = data.decode('utf-8', errors='ignore')
            
            # 正则查找英文单词(至少3个连续英文单词)
            pattern = r'\b[A-Za-z]+(?:\s+[A-Za-z]+){2,}\b'
            matches = re.finditer(pattern, text)
            
            for match in matches:
                chunk = match.group().strip()
                if len(chunk) >= 5:
                    chunks.append(chunk)
                    
        except Exception:
            pass
        
        return chunks
    
    def deduplicate_chunks(self, chunks: List[str]) -> List[str]:
        """去重和过滤文本片段"""
        seen = set()
        unique_chunks = []
        
        for chunk in chunks:
            # 归一化(去除多余空格)
            normalized = ' '.join(chunk.split())
            
            # 过滤条件
            if len(normalized) < 3:
                continue
            if normalized in seen:
                continue
            if len(normalized) > 1000:  # 太长的可能是噪音
                continue
            
            # 过滤纯符号或数字
            if not any(c.isalpha() or '\u4e00' <= c <= '\u9fff' for c in normalized):
                continue
            
            seen.add(normalized)
            unique_chunks.append(normalized)
        
        return unique_chunks
    
    def extract_metadata(self, file_path: Path, data: bytes) -> Dict:
        """提取元数据"""
        metadata = {}
        
        # 从文件名提取时间范围
        try:
            name = file_path.stem
            if '-' in name:
                start_ts, end_ts = name.split('-')
                start_ms = int(start_ts)
                end_ms = int(end_ms)
                
                start_dt = datetime.fromtimestamp(start_ms / 1000)
                end_dt = datetime.fromtimestamp(end_ms / 1000)
                
                metadata['time_range'] = {
                    'start': start_dt.isoformat(),
                    'end': end_dt.isoformat(),
                    'start_ms': start_ms,
                    'end_ms': end_ms,
                    'duration_days': (end_ms - start_ms) / (1000 * 86400),
                }
        except Exception:
            pass
        
        # 从文件路径提取联系人ID
        try:
            contact_id = file_path.parent.parent.name
            if len(contact_id) == 64:  # 哈希ID
                metadata['contact_id'] = contact_id
        except Exception:
            pass
        
        return metadata

def batch_parse_files(key: str, input_dir: Path, output_dir: Path):
    """批量解析RMFH文件并保存结果"""
    parser = SimpleRMFHParser(key)
    
    # 创建输出目录
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 查找所有RMFH文件
    rmfh_files = list(input_dir.glob("**/ChatPackage/*"))
    
    print(f"✓ 找到 {len(rmfh_files)} 个RMFH文件")
    print(f"✓ 开始解析...")
    
    results = []
    success_count = 0
    total_text = 0
    
    for i, file_path in enumerate(rmfh_files, 1):
        if i % 50 == 0:
            print(f"  进度: {i}/{len(rmfh_files)}")
        
        result = parser.parse(file_path)
        
        if result['success']:
            success_count += 1
            total_text += result['stats']['total_chars']
            
            # 保存单个文件的解析结果
            output_file = output_dir / f"{file_path.stem}.txt"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(f"# 文件: {file_path.name}\n")
                f.write(f"# 时间: {result['metadata'].get('time_range', {}).get('start', 'Unknown')}\n")
                f.write(f"# 联系人: {result['metadata'].get('contact_id', 'Unknown')}\n")
                f.write(f"\n")
                f.write(result['full_text'])
            
            results.append(result)
    
    # 保存索引
    index = {
        'total_files': len(rmfh_files),
        'success_count': success_count,
        'total_text_chars': total_text,
        'files': [
            {
                'name': r['file_name'],
                'text_length': r['stats']['total_chars'],
                'chunks': r['stats']['total_chunks'],
                'metadata': r['metadata'],
            }
            for r in results
        ]
    }
    
    with open(output_dir / 'index.json', 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✓ 解析完成!")
    print(f"  - 成功: {success_count}/{len(rmfh_files)}")
    print(f"  - 总提取文本: {total_text:,} 字符")
    print(f"  - 平均每文件: {total_text//success_count if success_count > 0 else 0:,} 字符")
    print(f"  - 输出目录: {output_dir}")
    print(f"{'='*60}\n")
    
    return results

def main():
    """主函数 - 测试解析"""
    key = '687c38f284f0d9c778fb3e1b3492536b'
    
    print(f"{'='*60}")
    print("RMFH简化解析器 - 文本提取专用")
    print(f"{'='*60}\n")
    
    parser = SimpleRMFHParser(key)
    
    # 查找样本文件
    uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads"
    rmfh_files = list(uploads_dir.glob("extracted_import_*/*/ChatPackage/*"))
    
    if not rmfh_files:
        print("✗ 未找到RMFH文件")
        return 1
    
    print(f"✓ 找到 {len(rmfh_files)} 个文件")
    print(f"✓ 解析前10个样本...\n")
    
    total_chars = 0
    for i, file_path in enumerate(rmfh_files[:10], 1):
        print(f"\n[{i}/10] {file_path.name}")
        print(f"{'-'*60}")
        
        result = parser.parse(file_path)
        
        if result['success']:
            stats = result['stats']
            print(f"✓ 原始大小: {stats['raw_size']:,} 字节")
            print(f"✓ 文本片段: {stats['total_chunks']} 个")
            print(f"✓ 总字符数: {stats['total_chars']:,}")
            print(f"✓ 可打印比率: {stats['printable_ratio']*100:.1f}%")
            
            if result['metadata'].get('time_range'):
                tr = result['metadata']['time_range']
                print(f"✓ 时间范围: {tr['start'][:10]} ~ {tr['end'][:10]}")
                print(f"✓ 跨度: {tr['duration_days']:.1f} 天")
            
            # 显示部分文本
            if result['text_chunks']:
                print(f"\n  文本示例 (前5个片段):")
                for j, chunk in enumerate(result['text_chunks'][:5], 1):
                    preview = chunk[:60] if len(chunk) > 60 else chunk
                    print(f"    {j}. {preview}")
            
            total_chars += stats['total_chars']
        else:
            print(f"✗ 解析失败")
    
    print(f"\n{'='*60}")
    print(f"总计提取文本: {total_chars:,} 字符")
    print(f"平均每文件: {total_chars//10:,} 字符")
    print(f"{'='*60}\n")
    
    # 询问是否批量处理
    print(f"找到总计 {len(rmfh_files)} 个文件")
    response = input(f"是否批量解析所有文件? (y/n): ")
    
    if response.lower() == 'y':
        output_dir = Path(__file__).parent.parent.parent.parent / "memories/wechat/processed"
        batch_parse_files(key, uploads_dir, output_dir)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
