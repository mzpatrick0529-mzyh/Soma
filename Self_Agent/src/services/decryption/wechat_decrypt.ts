/**
 * WeChat解密服务 - Node.js调用层
 * 通过child_process调用Python解密脚本
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

export interface DecryptionResult {
  status: 'completed' | 'failed';
  input: string;
  output: string;
  stats: {
    success: number;
    failed: number;
    skipped: number;
  };
  error?: string;
}

export interface DecryptionProgress {
  type: 'progress' | 'complete' | 'error';
  message: string;
  stats?: {
    success: number;
    failed: number;
    skipped: number;
  };
}

/**
 * 解密WeChat数据目录
 * 
 * @param wechatKey - WeChat数据库密钥（32位十六进制字符串）
 * @param inputDir - 输入目录（包含ChatPackage/Media/Index）
 * @param outputDir - 输出目录
 * @param onProgress - 进度回调函数
 * @returns 解密结果
 */
export async function decryptWeChatData(
  wechatKey: string,
  inputDir: string,
  outputDir: string,
  onProgress?: (progress: DecryptionProgress) => void
): Promise<DecryptionResult> {
  const scriptPath = path.join(__dirname, 'decrypt_service.py');
  
  // 验证输入
  if (!wechatKey || wechatKey.length !== 64) {
    throw new Error('Invalid WeChat key: must be 64-character hex string (32 bytes)');
  }
  
  try {
    await fs.access(inputDir);
  } catch {
    throw new Error(`Input directory not found: ${inputDir}`);
  }
  
  // 确保输出目录存在
  await fs.mkdir(outputDir, { recursive: true });
  
  return new Promise((resolve, reject) => {
    const args = [
      scriptPath,
      '--key', wechatKey,
      '--input', inputDir,
      '--output', outputDir,
      '--json'
    ];
    
    const python = spawn('python3', args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      
      // 解析进度信息
      const lines = text.split('\n').filter((l: string) => l.trim());
      for (const line of lines) {
        if (line.startsWith('✓') || line.startsWith('✗') || line.startsWith('⚠')) {
          onProgress?.({
            type: 'progress',
            message: line
          });
        }
      }
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Decryption failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // 解析JSON结果
        const result: DecryptionResult = JSON.parse(stdout);
        
        onProgress?.({
          type: 'complete',
          message: 'Decryption completed',
          stats: result.stats
        });
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse result: ${error}\nOutput: ${stdout}`));
      }
    });
    
    python.on('error', (error) => {
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
}

/**
 * 检查Python环境and依赖
 * 
 * @returns 环境检查结果
 */
export async function checkPythonEnvironment(): Promise<{
  python: boolean;
  pycryptodome: boolean;
  message: string;
}> {
  return new Promise((resolve) => {
    const python = spawn('python3', ['-c', 
      'import sys; from Crypto.Cipher import AES; print("ok")'
    ]);
    
    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.includes('ok')) {
        resolve({
          python: true,
          pycryptodome: true,
          message: 'Python environment ready'
        });
      } else {
        resolve({
          python: code === 0,
          pycryptodome: false,
          message: 'Missing pycryptodome. Install with: pip install pycryptodome'
        });
      }
    });
    
    python.on('error', () => {
      resolve({
        python: false,
        pycryptodome: false,
        message: 'Python 3 not found. Please install Python 3.8+'
      });
    });
  });
}

/**
 * 获取推荐的密钥获取方法
 */
export function getKeyExtractionGuide(): string {
  return `
## 如何获取WeChat数据库密钥

### 方法1：使用WeChatMsg工具（推荐）
1. 下载WeChatMsg: https://github.com/LC044/WeChatMsg
2. 运行GUI程序
3. 工具会Auto提取并显示密钥
4. 复制密钥并Save

### 方法2：手动提取（高级）
**macOS:**
\`\`\`bash
# 1. 找到WeChat数据库文件
~/Library/Containers/com.tencent.xinWeChat/Data/Library/Application Support/com.tencent.xinWeChat/*/Message/*.db

# 2. 使用逆向工具提取密钥（需要技术知识）
# 参考: https://github.com/LC044/WeChatMsg/wiki
\`\`\`

**Windows:**
\`\`\`
# 1. WeChat安装路径
C:\\Users\\<Username>\\Documents\\WeChat Files\\<WxID>\\Msg\\*.db

# 2. 使用WeChatMsg工具Auto提取密钥
\`\`\`

### 密钥格式
- 必须是64位十六进制字符串
- 示例: a1b2c3d4e5f6789012345678901234567890123456789012345678901234abcd
- 不要分享您的密钥！

### Security提示
⚠️ 密钥可以解密您的所有WeChat聊天记录
⚠️ 请妥善保管，不要泄露给他人
⚠️ 建议使用环境变量存储，不要硬编码在代码中
  `.trim();
}
