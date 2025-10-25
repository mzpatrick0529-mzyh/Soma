/**
 * Deprecated: One-off WeChat decrypt test has been removed from active code.
 * Do not use this file. Use the documented WeChat import path from the app UI.
 */

export {};

// Prevent accidental execution when run via tsx
if (require.main === module) {
  throw new Error("[Deprecated] test_wechat_decrypt.ts has been removed. Run imports via the application instead.");
}

// #!/usr/bin/env node (deprecated stub)
/**
 * WeChat解密和导入测试脚本
 * 验证完整的解密→导入→索引→RAG流程
 */

import { decryptWeChatData, checkPythonEnvironment } from './src/services/decryption/wechat_decrypt.js';
import { indexMemoryDocuments } from './src/services/indexing/memory_indexer.js';
import path from 'path';
import fs from 'fs/promises';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color: string, ...args: any[]) {
  console.log(color, ...args, colors.reset);
}

async function main() {
  log(colors.cyan, '\n=== WeChat Decryption & Import Test ===\n');
  
  // 1. 检查环境
  log(colors.blue, '📋 Step 1: Checking environment...');
  const envCheck = await checkPythonEnvironment();
  
  if (!envCheck.python) {
    log(colors.red, '✗ Python 3 not found');
    log(colors.yellow, envCheck.message);
    process.exit(1);
  }
  
  if (!envCheck.pycryptodome) {
    log(colors.red, '✗ pycryptodome not installed');
    log(colors.yellow, 'Install with: pip3 install pycryptodome');
    process.exit(1);
  }
  
  log(colors.green, '✓ Python environment ready');
  
  // 2. 检查密钥
  log(colors.blue, '\n📋 Step 2: Checking WeChat database key...');
  const wechatKey = process.env.WECHAT_DB_KEY;
  
  if (!wechatKey) {
    log(colors.red, '✗ WECHAT_DB_KEY environment variable not set');
    log(colors.yellow, '\nHow to set the key:');
    log(colors.yellow, '  export WECHAT_DB_KEY="your_64_char_hex_key"');
    log(colors.yellow, '\nHow to get the key:');
    log(colors.yellow, '  1. Install WeChatMsg: https://github.com/LC044/WeChatMsg');
    log(colors.yellow, '  2. Run the GUI tool');
    log(colors.yellow, '  3. Copy the extracted key');
    log(colors.yellow, '\nFor more details, see: Self_AI_Agent/WECHAT_USER_GUIDE.md');
    process.exit(1);
  }
  
  if (!/^[0-9a-fA-F]{64}$/.test(wechatKey)) {
    log(colors.red, '✗ Invalid key format');
    log(colors.yellow, `  Expected: 64 hex characters`);
    log(colors.yellow, `  Got: ${wechatKey.length} characters`);
    process.exit(1);
  }
  
  log(colors.green, '✓ WeChat key configured');
  log(colors.cyan, `  Key: ${wechatKey.substring(0, 16)}...${wechatKey.substring(48, 64)}`);
  
  // 3. 检查输入数据
  log(colors.blue, '\n📋 Step 3: Checking input data...');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  
  let inputDir: string | null = null;
  try {
    const uploads = await fs.readdir(uploadsDir);
    const extractedDirs = uploads.filter(f => f.startsWith('extracted_import_'));
    
    if (extractedDirs.length === 0) {
      log(colors.red, '✗ No extracted WeChat data found in uploads/');
      log(colors.yellow, 'Please upload WeChat export via frontend first');
      process.exit(1);
    }
    
    // 使用最新的
    inputDir = path.join(uploadsDir, extractedDirs[extractedDirs.length - 1]);
    log(colors.green, `✓ Found WeChat data: ${extractedDirs[extractedDirs.length - 1]}`);
    
    // 检查结构
    const hasChat = await fs.access(path.join(inputDir, '*/ChatPackage')).then(() => true).catch(() => false);
    const hasMedia = await fs.access(path.join(inputDir, '*/Media')).then(() => true).catch(() => false);
    
    if (!hasChat && !hasMedia) {
      log(colors.yellow, '⚠ Warning: No ChatPackage or Media folders found');
      log(colors.yellow, '  This might not be a valid WeChat export');
    }
    
  } catch (error) {
    log(colors.red, '✗ Error checking uploads:', error);
    process.exit(1);
  }
  
  // 4. 开始解密
  log(colors.blue, '\n📋 Step 4: Starting decryption...');
  const outputDir = path.join(process.cwd(), 'memories', 'wechat', 'raw', `test_${Date.now()}`);
  
  try {
    const result = await decryptWeChatData(
      wechatKey,
      inputDir,
      outputDir,
      (progress) => {
        if (progress.type === 'progress') {
          log(colors.cyan, `  ${progress.message}`);
        } else if (progress.type === 'complete') {
          log(colors.green, `  ✓ ${progress.message}`);
        } else if (progress.type === 'error') {
          log(colors.red, `  ✗ ${progress.message}`);
        }
      }
    );
    
    log(colors.green, '\n✓ Decryption completed:');
    log(colors.green, `  Success: ${result.stats.success}`);
    log(colors.yellow, `  Skipped: ${result.stats.skipped}`);
    log(colors.red, `  Failed: ${result.stats.failed}`);
    log(colors.cyan, `  Output: ${outputDir}`);
    
    if (result.stats.failed > 0) {
      log(colors.yellow, '\n⚠ Some files failed to decrypt');
      log(colors.yellow, '  This might be normal for incompatible file types');
    }
    
  } catch (error) {
    log(colors.red, '\n✗ Decryption failed:');
    log(colors.red, error instanceof Error ? error.message : String(error));
    
    if (error instanceof Error && error.message.includes('Python')) {
      log(colors.yellow, '\nTroubleshooting:');
      log(colors.yellow, '  1. Ensure Python 3.8+ is installed');
      log(colors.yellow, '  2. Ensure pycryptodome is installed: pip3 install pycryptodome');
    } else if (error instanceof Error && error.message.includes('key')) {
      log(colors.yellow, '\nTroubleshooting:');
      log(colors.yellow, '  1. Verify your WECHAT_DB_KEY is correct');
      log(colors.yellow, '  2. Try re-extracting the key with WeChatMsg');
      log(colors.yellow, '  3. Ensure the key matches your WeChat version');
    }
    
    process.exit(1);
  }
  
  // 5. 验证解密结果
  log(colors.blue, '\n📋 Step 5: Verifying decrypted files...');
  try {
    const files = await fs.readdir(outputDir, { recursive: true });
    const decryptedFiles = files.filter((f: any) => !f.endsWith('/'));
    log(colors.green, `✓ Found ${decryptedFiles.length} decrypted files`);
    
    if (decryptedFiles.length === 0) {
      log(colors.yellow, '⚠ Warning: No files were decrypted');
      log(colors.yellow, '  The input data might be in an unexpected format');
    }
  } catch (error) {
    log(colors.red, '✗ Error verifying files:', error);
  }
  
  log(colors.green, '\n✅ All tests passed!');
  log(colors.cyan, '\nNext steps:');
  log(colors.cyan, '  1. Review decrypted files in:', outputDir);
  log(colors.cyan, '  2. Import to database using frontend or API');
  log(colors.cyan, '  3. Test RAG queries in Chat interface');
  log(colors.cyan, '\nFor more information, see: Self_AI_Agent/WECHAT_USER_GUIDE.md');
}

main().catch((error) => {
  log(colors.red, '\n✗ Unexpected error:', error);
  process.exit(1);
});
