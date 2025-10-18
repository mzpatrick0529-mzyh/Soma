#!/usr/bin/env python3
"""
RMFH文件内部结构分析工具
解密后分析数据格式,识别Protobuf、JSON、二进制等不同类型
"""

import sys
import os
from pathlib import Path
import struct
import json
from Crypto.Cipher import AES

def analyze_decrypted_data(data, max_bytes=2048):
    """深度分析解密后的数据"""
    print(f"\n{'='*60}")
    print("数据结构分析")
    print(f"{'='*60}")
    
    total_len = len(data)
    print(f"总长度: {total_len} 字节")
    
    # 1. 基本统计
    printable = sum(32 <= b < 127 for b in data)
    chinese = 0
    try:
        text = data.decode('utf-8', errors='ignore')
        chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
    except:
        text = None
    
    print(f"可打印ASCII: {printable} ({printable/total_len*100:.1f}%)")
    print(f"中文字符: {chinese}")
    
    # 2. 检测数据格式标识
    formats = []
    
    # Protobuf特征(通常有0x08, 0x10, 0x12, 0x1a等varint标记)
    protobuf_markers = [0x08, 0x10, 0x12, 0x1a, 0x22]
    protobuf_score = sum(1 for b in data[:100] if b in protobuf_markers)
    if protobuf_score > 3:
        formats.append("Protobuf (可能)")
    
    # JSON特征
    if b'{' in data[:100] or b'[' in data[:100]:
        formats.append("JSON (可能)")
    
    # XML特征
    if b'<' in data[:100] and b'>' in data[:100]:
        formats.append("XML (可能)")
    
    # 纯文本特征
    if printable > total_len * 0.8:
        formats.append("纯文本")
    
    # 二进制特征
    if printable < total_len * 0.3:
        formats.append("二进制数据")
    
    print(f"可能格式: {', '.join(formats) if formats else '未知'}")
    
    # 3. 查找特征字符串
    print(f"\n查找关键字:")
    keywords = [
        b'msg', b'message', b'content', b'text', b'data',
        b'time', b'timestamp', b'createtime',
        b'user', b'username', b'nickname',
        b'type', b'msgtype',
        '\u6d88\u606f'.encode('utf-8'),  # 消息
        '\u5185\u5bb9'.encode('utf-8'),  # 内容
        '\u65f6\u95f4'.encode('utf-8'),  # 时间
    ]
    
    found_keywords = []
    for kw in keywords:
        if kw in data:
            pos = data.find(kw)
            found_keywords.append(f"{kw.decode('utf-8', errors='ignore')} @{pos}")
    
    if found_keywords:
        for kw in found_keywords[:10]:
            print(f"  - {kw}")
    else:
        print("  (未找到常见关键字)")
    
    # 4. 尝试解析前几个字段
    print(f"\n前256字节结构分析:")
    offset = 0
    sample = data[:256]
    
    # 尝试读取可能的头部字段
    try:
        # 假设有length前缀
        if len(sample) >= 4:
            length1 = struct.unpack('<I', sample[0:4])[0]
            length2 = struct.unpack('>I', sample[0:4])[0]
            print(f"  偏移0 - 可能的长度字段: {length1} (小端) / {length2} (大端)")
        
        if len(sample) >= 8:
            ts1 = struct.unpack('<Q', sample[0:8])[0]
            ts2 = struct.unpack('>Q', sample[0:8])[0]
            # 检查是否是合理的时间戳(2000-2030年)
            if 946684800000 < ts1 < 1893456000000:
                print(f"  偏移0 - 可能的时间戳(ms): {ts1}")
            if 946684800000 < ts2 < 1893456000000:
                print(f"  偏移0 - 可能的时间戳(ms): {ts2}")
    except:
        pass
    
    # 5. 查找重复模式
    print(f"\n模式分析:")
    # 查找0x00填充
    zero_runs = []
    run_start = None
    run_len = 0
    for i, b in enumerate(data[:1024]):
        if b == 0x00:
            if run_start is None:
                run_start = i
            run_len += 1
        else:
            if run_len > 4:
                zero_runs.append((run_start, run_len))
            run_start = None
            run_len = 0
    
    if zero_runs:
        print(f"  发现 {len(zero_runs)} 处连续0x00填充:")
        for start, length in zero_runs[:3]:
            print(f"    偏移{start}: {length}字节")
    
    # 6. 提取可读文本片段
    if text:
        print(f"\n提取的文本片段:")
        # 查找连续的可打印字符
        readable_chunks = []
        current_chunk = []
        
        for c in text:
            if c.isprintable() or '\u4e00' <= c <= '\u9fff':
                current_chunk.append(c)
            else:
                if len(current_chunk) > 3:
                    readable_chunks.append(''.join(current_chunk))
                current_chunk = []
        
        if current_chunk and len(current_chunk) > 3:
            readable_chunks.append(''.join(current_chunk))
        
        for i, chunk in enumerate(readable_chunks[:10], 1):
            if len(chunk) > 100:
                chunk = chunk[:100] + "..."
            print(f"  片段{i}: {chunk}")
    
    # 7. 十六进制dump前几个块
    print(f"\n十六进制dump (前128字节):")
    for i in range(0, min(128, len(data)), 16):
        hex_part = ' '.join(f'{b:02x}' for b in data[i:i+16])
        ascii_part = ''.join(chr(b) if 32 <= b < 127 else '.' for b in data[i:i+16])
        print(f"  {i:04x}: {hex_part:<48} {ascii_part}")
    
    return {
        'total_length': total_len,
        'printable_ratio': printable / total_len,
        'formats': formats,
        'keywords_found': len(found_keywords),
        'readable_chunks': len(readable_chunks) if text else 0,
    }

def decrypt_and_analyze(rmfh_file, key_hex):
    """解密并分析RMFH文件"""
    print(f"\n{'#'*60}")
    print(f"分析文件: {rmfh_file.name}")
    print(f"{'#'*60}")
    
    # 1. 读取和解密
    with open(rmfh_file, 'rb') as f:
        header = f.read(128)
        encrypted = f.read()
    
    # 验证RMFH magic
    magic = header[0:4].decode('ascii')
    if magic != 'RMFH':
        print(f"✗ 不是RMFH文件!")
        return None
    
    print(f"✓ Magic: {magic}")
    print(f"✓ 文件大小: {len(header) + len(encrypted)} 字节")
    
    # 解密
    key_bytes = bytes.fromhex(key_hex)
    iv = b'\x00' * 16
    cipher = AES.new(key_bytes, AES.MODE_CBC, iv=iv)
    
    aligned_len = len(encrypted) // 16 * 16
    decrypted = cipher.decrypt(encrypted[:aligned_len])
    
    print(f"✓ 解密成功: {len(decrypted)} 字节")
    
    # 2. 分析数据
    result = analyze_decrypted_data(decrypted)
    
    # 3. 尝试特定格式解析
    print(f"\n{'='*60}")
    print("尝试格式解析")
    print(f"{'='*60}")
    
    # 尝试1: Protobuf (需要有.proto定义)
    print("\n[Protobuf解析]")
    print("  需要知道具体的.proto schema才能解析")
    print("  但可以尝试通用的字段提取...")
    
    try:
        # 简单的varint解码
        parsed_fields = parse_protobuf_generic(decrypted[:512])
        if parsed_fields:
            print(f"  可能的Protobuf字段:")
            for field in parsed_fields[:5]:
                print(f"    {field}")
    except Exception as e:
        print(f"  ✗ 解析失败: {str(e)}")
    
    # 尝试2: JSON提取
    print("\n[JSON解析]")
    try:
        # 查找JSON片段
        text = decrypted.decode('utf-8', errors='ignore')
        json_start = text.find('{')
        json_end = text.rfind('}')
        
        if json_start >= 0 and json_end > json_start:
            json_str = text[json_start:json_end+1]
            try:
                data = json.loads(json_str)
                print(f"  ✓ 找到有效JSON!")
                print(f"  内容: {json.dumps(data, ensure_ascii=False, indent=2)[:200]}")
            except:
                print(f"  ✗ JSON格式无效")
    except Exception as e:
        print(f"  ✗ 查找失败: {str(e)}")
    
    return result

def parse_protobuf_generic(data):
    """通用Protobuf字段提取(无需schema)"""
    fields = []
    offset = 0
    
    while offset < len(data) - 1:
        try:
            # 读取tag (varint)
            tag, consumed = read_varint(data[offset:])
            if consumed == 0:
                break
            
            offset += consumed
            
            field_number = tag >> 3
            wire_type = tag & 0x07
            
            # 根据wire_type读取值
            if wire_type == 0:  # Varint
                value, consumed = read_varint(data[offset:])
                fields.append(f"字段{field_number}: varint = {value}")
                offset += consumed
            elif wire_type == 2:  # Length-delimited
                length, consumed = read_varint(data[offset:])
                offset += consumed
                if offset + length <= len(data):
                    value_bytes = data[offset:offset+length]
                    # 尝试解码为字符串
                    try:
                        value_str = value_bytes.decode('utf-8')
                        fields.append(f"字段{field_number}: string = '{value_str[:50]}'")
                    except:
                        fields.append(f"字段{field_number}: bytes = {value_bytes[:20].hex()}")
                    offset += length
            else:
                # 其他类型暂不处理
                break
                
            if len(fields) >= 20:  # 最多提取20个字段
                break
                
        except Exception as e:
            break
    
    return fields

def read_varint(data):
    """读取Protobuf varint"""
    result = 0
    shift = 0
    consumed = 0
    
    for b in data[:10]:  # varint最多10字节
        consumed += 1
        result |= (b & 0x7F) << shift
        if (b & 0x80) == 0:
            return result, consumed
        shift += 7
    
    return 0, 0

def main():
    key = '687c38f284f0d9c778fb3e1b3492536b'
    
    print(f"{'='*60}")
    print("RMFH文件结构深度分析工具")
    print(f"{'='*60}")
    
    # 查找样本文件
    uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads"
    sample_files = list(uploads_dir.glob("extracted_import_*/*/ChatPackage/*"))
    
    if not sample_files:
        print("✗ 未找到样本文件")
        return 1
    
    print(f"\n✓ 找到 {len(sample_files)} 个RMFH文件")
    print(f"✓ 分析前5个样本...\n")
    
    results = []
    for i, file_path in enumerate(sample_files[:5], 1):
        result = decrypt_and_analyze(file_path, key)
        if result:
            results.append(result)
        
        if i < 5:
            input("\n按回车继续下一个文件...")
    
    # 汇总统计
    print(f"\n{'='*60}")
    print("汇总统计")
    print(f"{'='*60}")
    
    if results:
        avg_printable = sum(r['printable_ratio'] for r in results) / len(results)
        all_formats = set()
        for r in results:
            all_formats.update(r['formats'])
        
        print(f"平均可打印字符比: {avg_printable*100:.1f}%")
        print(f"检测到的格式: {', '.join(all_formats)}")
        print(f"\n结论:")
        print(f"  - 数据主要是二进制格式")
        print(f"  - 可能包含Protobuf序列化数据")
        print(f"  - 需要微信的.proto定义文件才能完整解析")
        print(f"  - 但部分文本内容可以直接提取使用")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
