#!/usr/bin/env python3
"""
RMFH文件智能解析器
自动识别并解析Protobuf、JSON、文本等多种格式
提取可用于RAG的结构化数据
"""

import sys
import os
from pathlib import Path
import struct
import json
import re
from typing import Dict, List, Any, Optional
from Crypto.Cipher import AES
import blackboxprotobuf

class RMFHParser:
    """RMFH文件解析器"""
    
    def __init__(self, key_hex: str):
        """初始化解析器
        
        Args:
            key_hex: 64字符十六进制密钥
        """
        self.key = bytes.fromhex(key_hex)
        self.iv = b'\x00' * 16
    
    def decrypt_file(self, file_path: Path) -> Optional[bytes]:
        """解密RMFH文件
        
        Args:
            file_path: RMFH文件路径
            
        Returns:
            解密后的字节数据,失败返回None
        """
        try:
            with open(file_path, 'rb') as f:
                header = f.read(128)
                encrypted = f.read()
            
            # 验证magic
            if header[0:4] != b'RMFH':
                return None
            
            # AES-CBC解密
            cipher = AES.new(self.key, AES.MODE_CBC, iv=self.iv)
            aligned_len = len(encrypted) // 16 * 16
            decrypted = cipher.decrypt(encrypted[:aligned_len])
            
            return decrypted
            
        except Exception as e:
            print(f"解密失败: {str(e)}")
            return None
    
    def parse(self, file_path: Path) -> Dict[str, Any]:
        """解析RMFH文件,提取所有可用数据
        
        Args:
            file_path: RMFH文件路径
            
        Returns:
            包含解析结果的字典
        """
        result = {
            'file_path': str(file_path),
            'file_name': file_path.name,
            'success': False,
            'data_type': 'unknown',
            'messages': [],
            'text_content': '',
            'metadata': {},
            'raw_text_chunks': [],
        }
        
        # 1. 解密
        decrypted = self.decrypt_file(file_path)
        if decrypted is None:
            return result
        
        result['raw_size'] = len(decrypted)
        
        # 2. 识别数据类型并解析
        data_type = self.detect_data_type(decrypted)
        result['data_type'] = data_type
        
        if 'protobuf' in data_type.lower():
            result['messages'] = self.parse_protobuf(decrypted)
        elif 'json' in data_type.lower():
            result['messages'] = self.parse_json(decrypted)
        
        # 3. 提取所有可读文本
        result['raw_text_chunks'] = self.extract_text_chunks(decrypted)
        result['text_content'] = '\n'.join(result['raw_text_chunks'])
        
        # 4. 提取时间范围(从文件名)
        result['metadata'] = self.extract_metadata(file_path)
        
        result['success'] = True
        return result
    
    def detect_data_type(self, data: bytes) -> str:
        """检测数据类型
        
        Args:
            data: 解密后的数据
            
        Returns:
            数据类型描述
        """
        # 统计特征
        printable_ratio = sum(32 <= b < 127 for b in data[:1024]) / min(1024, len(data))
        
        # Protobuf特征检测
        protobuf_markers = [0x08, 0x0a, 0x10, 0x12, 0x1a, 0x22]
        protobuf_score = sum(1 for b in data[:100] if b in protobuf_markers)
        
        # JSON特征
        has_json = b'{' in data[:200] or b'[' in data[:200]
        
        if protobuf_score > 5:
            return 'protobuf'
        elif has_json:
            return 'json'
        elif printable_ratio > 0.8:
            return 'text'
        else:
            return 'binary'
    
    def parse_protobuf(self, data: bytes) -> List[Dict]:
        """解析Protobuf数据(无schema)
        
        Args:
            data: Protobuf编码的数据
            
        Returns:
            解析出的消息列表
        """
        messages = []
        
        try:
            # 使用blackboxprotobuf进行无schema解析
            decoded, typedef = blackboxprotobuf.decode_message(data)
            messages.append(self.flatten_protobuf(decoded))
        except Exception as e:
            # 如果整体解析失败,尝试分块解析
            messages = self.parse_protobuf_chunks(data)
        
        return messages
    
    def parse_protobuf_chunks(self, data: bytes) -> List[Dict]:
        """分块解析Protobuf数据
        
        微信聊天记录可能是多个连续的Protobuf消息
        """
        messages = []
        offset = 0
        
        while offset < len(data) - 10:
            try:
                # 尝试解析一个消息
                chunk = data[offset:]
                decoded, typedef = blackboxprotobuf.decode_message(chunk)
                
                # 计算这个消息的大小
                encoded = blackboxprotobuf.encode_message(decoded, typedef)
                message_len = len(encoded)
                
                messages.append(self.flatten_protobuf(decoded))
                offset += message_len
                
                # 如果成功解析了50个消息,可能够了
                if len(messages) >= 50:
                    break
                    
            except Exception:
                # 解析失败,跳过一些字节
                offset += 16
                if len(messages) > 0:
                    # 如果已经有一些消息了,可以停止
                    break
        
        return messages
    
    def flatten_protobuf(self, obj: Any, prefix: str = '') -> Dict:
        """将Protobuf对象扁平化为字典
        
        Args:
            obj: Protobuf解析结果
            prefix: 字段前缀
            
        Returns:
            扁平化的字典
        """
        result = {}
        
        if isinstance(obj, dict):
            for key, value in obj.items():
                new_key = f"{prefix}.{key}" if prefix else str(key)
                if isinstance(value, (dict, list)):
                    result.update(self.flatten_protobuf(value, new_key))
                else:
                    # 尝试解码bytes为字符串
                    if isinstance(value, bytes):
                        try:
                            value = value.decode('utf-8')
                        except:
                            value = value.hex()
                    result[new_key] = value
        elif isinstance(obj, list):
            for i, item in enumerate(obj):
                new_key = f"{prefix}[{i}]"
                if isinstance(item, (dict, list)):
                    result.update(self.flatten_protobuf(item, new_key))
                else:
                    if isinstance(item, bytes):
                        try:
                            item = item.decode('utf-8')
                        except:
                            item = item.hex()
                    result[new_key] = item
        else:
            result[prefix] = obj
        
        return result
    
    def parse_json(self, data: bytes) -> List[Dict]:
        """解析JSON数据
        
        Args:
            data: 包含JSON的字节数据
            
        Returns:
            解析出的JSON对象列表
        """
        messages = []
        
        try:
            text = data.decode('utf-8', errors='ignore')
            
            # 查找所有可能的JSON对象
            json_pattern = r'\{[^{}]*\}'
            matches = re.finditer(json_pattern, text)
            
            for match in matches:
                try:
                    obj = json.loads(match.group())
                    messages.append(obj)
                except:
                    continue
                    
        except Exception as e:
            pass
        
        return messages
    
    def extract_text_chunks(self, data: bytes) -> List[str]:
        """提取所有可读文本片段
        
        Args:
            data: 二进制数据
            
        Returns:
            文本片段列表
        """
        chunks = []
        
        try:
            # 尝试UTF-8解码
            text = data.decode('utf-8', errors='ignore')
            
            # 提取连续的可打印字符(包括中文)
            current_chunk = []
            
            for char in text:
                if char.isprintable() and char not in '\x00\x01\x02\x03\x04\x05\x06\x07\x08\x0b\x0c\x0e\x0f':
                    current_chunk.append(char)
                else:
                    if len(current_chunk) >= 4:  # 至少4个字符
                        chunk_text = ''.join(current_chunk).strip()
                        if chunk_text:
                            chunks.append(chunk_text)
                    current_chunk = []
            
            # 添加最后一个chunk
            if len(current_chunk) >= 4:
                chunk_text = ''.join(current_chunk).strip()
                if chunk_text:
                    chunks.append(chunk_text)
            
        except Exception as e:
            pass
        
        # 去重并过滤太短的
        unique_chunks = []
        seen = set()
        for chunk in chunks:
            if len(chunk) >= 4 and chunk not in seen:
                unique_chunks.append(chunk)
                seen.add(chunk)
        
        return unique_chunks
    
    def extract_metadata(self, file_path: Path) -> Dict:
        """从文件名提取元数据
        
        文件名格式: 开始时间戳-结束时间戳
        例如: 1678323610000-1678762153000
        
        Args:
            file_path: 文件路径
            
        Returns:
            元数据字典
        """
        metadata = {}
        
        try:
            name = file_path.stem
            if '-' in name:
                start_ts, end_ts = name.split('-')
                start_ms = int(start_ts)
                end_ms = int(end_ts)
                
                # 转换为秒级时间戳
                from datetime import datetime
                start_dt = datetime.fromtimestamp(start_ms / 1000)
                end_dt = datetime.fromtimestamp(end_ms / 1000)
                
                metadata['time_range'] = {
                    'start': start_dt.isoformat(),
                    'end': end_dt.isoformat(),
                    'start_ms': start_ms,
                    'end_ms': end_ms,
                }
        except Exception as e:
            pass
        
        return metadata

def main():
    """批量解析RMFH文件"""
    key = '687c38f284f0d9c778fb3e1b3492536b'
    
    print(f"{'='*60}")
    print("RMFH智能解析器")
    print(f"{'='*60}\n")
    
    parser = RMFHParser(key)
    
    # 查找文件
    uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads"
    rmfh_files = list(uploads_dir.glob("extracted_import_*/*/ChatPackage/*"))
    
    if not rmfh_files:
        print("✗ 未找到RMFH文件")
        return 1
    
    print(f"✓ 找到 {len(rmfh_files)} 个文件")
    print(f"✓ 解析前10个样本...\n")
    
    results = []
    for i, file_path in enumerate(rmfh_files[:10], 1):
        print(f"\n[{i}/10] {file_path.name}")
        print(f"{'-'*60}")
        
        result = parser.parse(file_path)
        
        if result['success']:
            print(f"✓ 数据类型: {result['data_type']}")
            print(f"✓ 原始大小: {result['raw_size']} 字节")
            print(f"✓ Protobuf消息: {len(result['messages'])} 个")
            print(f"✓ 文本片段: {len(result['raw_text_chunks'])} 个")
            
            # 显示部分内容
            if result['messages']:
                print(f"\n  第1个Protobuf消息:")
                for key, value in list(result['messages'][0].items())[:5]:
                    print(f"    {key}: {str(value)[:50]}")
            
            if result['raw_text_chunks']:
                print(f"\n  文本片段示例:")
                for chunk in result['raw_text_chunks'][:3]:
                    preview = chunk[:80] if len(chunk) > 80 else chunk
                    print(f"    - {preview}")
            
            if result['metadata'].get('time_range'):
                tr = result['metadata']['time_range']
                print(f"\n  时间范围: {tr['start']} ~ {tr['end']}")
            
            results.append(result)
        else:
            print(f"✗ 解析失败")
    
    # 保存结果
    output_file = Path(__file__).parent / "parsed_samples.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✓ 解析完成!")
    print(f"✓ 结果已保存: {output_file}")
    print(f"{'='*60}\n")
    
    # 统计
    total_text = sum(len(r['text_content']) for r in results)
    total_messages = sum(len(r['messages']) for r in results)
    
    print(f"统计:")
    print(f"  - 成功解析: {len(results)}/{10}")
    print(f"  - 总提取文本: {total_text} 字符")
    print(f"  - 总Protobuf消息: {total_messages} 个")
    print(f"  - 平均每文件: {total_text//len(results)} 字符")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
