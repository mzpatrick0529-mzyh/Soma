/**
 * 🌉 ML Bridge - Python ↔ TypeScript 通信桥接
 * 
 * 职责:
 * 1. 调用 Python ML 模块 (子进程方式)
 * 2. 数据序列化/反序列化 (JSON)
 * 3. 错误处理andRetry逻辑
 */

import { spawn } from 'child_process';
import path from 'path';

/**
 * 调用 Python ML 脚本
 * 
 * @param scriptName Python 脚本名称 (不含 .py 后缀)
 * @param args 传递给 Python 的参数 (会被 JSON 序列化)
 * @returns Python 脚本的输出 (JSON 解析后)
 * 
 * @example
 * const bigFive = await callPythonML('personality_extractor', {
 *   user_id: 'user123',
 *   method: 'extract_big_five',
 *   conversations: [...]
 * });
 */
export async function callPythonML(
  scriptName: string,
  args: Record<string, any>
): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(process.cwd(), 'src', 'ml', `${scriptName}.py`);
    const argsJson = JSON.stringify(args);

    console.log(`[MLBridge] Calling Python: ${scriptName} with args:`, args);

    const python = spawn('python3', [scriptPath, argsJson]);

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[MLBridge] Python stderr: ${data}`);
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(
          `Python script '${scriptName}' failed with exit code ${code}\n` +
          `stderr: ${stderr}\n` +
          `stdout: ${stdout}`
        ));
        return;
      }

      try {
        // 尝试解析 JSON 输出
        const result = JSON.parse(stdout.trim());
        console.log(`[MLBridge] ✓ ${scriptName} completed successfully`);
        resolve(result);
      } catch (error: any) {
        reject(new Error(
          `Failed to parse Python output as JSON from ${scriptName}\n` +
          `stdout: ${stdout}\n` +
          `error: ${error.message}`
        ));
      }
    });

    python.on('error', (error) => {
      reject(new Error(
        `Failed to spawn Python process for ${scriptName}: ${error.message}\n` +
        `Make sure Python 3 is installed and accessible via 'python3' command.`
      ));
    });
  });
}

/**
 * 批量调用 Python ML 任务 (并行执行)
 * 
 * @param tasks 任务列表 { scriptName, args }[]
 * @returns 所有任务的结果数组
 */
export async function callPythonMLBatch(
  tasks: Array<{ scriptName: string; args: Record<string, any> }>
): Promise<any[]> {
  console.log(`[MLBridge] Running ${tasks.length} Python tasks in parallel...`);
  
  const promises = tasks.map(task => callPythonML(task.scriptName, task.args));
  return Promise.all(promises);
}

/**
 * 带Retry的 Python ML 调用
 * 
 * @param scriptName Python 脚本名称
 * @param args 参数
 * @param maxRetries 最大Retry次数
 * @param retryDelay Retry延迟 (毫秒)
 */
export async function callPythonMLWithRetry(
  scriptName: string,
  args: Record<string, any>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callPythonML(scriptName, args);
    } catch (error: any) {
      lastError = error;
      console.warn(`[MLBridge] Attempt ${attempt}/${maxRetries} failed for ${scriptName}: ${error.message}`);
      
      if (attempt < maxRetries) {
        console.log(`[MLBridge] Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw new Error(
    `Python ML call failed after ${maxRetries} attempts: ${lastError?.message}`
  );
}

/**
 * 检查 Python 环境是否可用
 */
export async function checkPythonEnvironment(): Promise<{
  available: boolean;
  version?: string;
  missingPackages?: string[];
}> {
  try {
    const python = spawn('python3', ['--version']);
    
    let versionOutput = '';
    python.stdout.on('data', (data) => {
      versionOutput += data.toString();
    });

    await new Promise((resolve, reject) => {
      python.on('close', (code) => {
        if (code === 0) resolve(true);
        else reject(new Error('Python not found'));
      });
      python.on('error', reject);
    });

    // TODO: 检查必需的 Python 包
    const requiredPackages = [
      'spacy',
      'nltk',
      'textblob',
      'scikit-learn',
      'networkx',
      'sentence-transformers'
    ];

    return {
      available: true,
      version: versionOutput.trim(),
      missingPackages: [], // TODO: 实际检查
    };
  } catch (error: any) {
    return {
      available: false,
      missingPackages: [],
    };
  }
}
