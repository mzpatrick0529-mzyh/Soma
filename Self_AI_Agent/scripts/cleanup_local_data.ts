#!/usr/bin/env tsx
/**
 * Cleanup local SQLite data and temporary upload artifacts
 * 用于清理本地生成的 self_agent.db 以及 uploads 下的临时提取目录/文件
 */
import fs from 'fs';
import path from 'path';

function rmIfExists(p: string) {
  try {
    if (fs.existsSync(p)) {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        fs.rmSync(p, { recursive: true, force: true });
        console.log(`Removed directory: ${p}`);
      } else {
        fs.unlinkSync(p);
        console.log(`Removed file: ${p}`);
      }
    }
  } catch (e) {
    console.warn(`Failed to remove ${p}:`, (e as Error).message);
  }
}

async function main() {
  const cwd = process.cwd();
  // 1) 删除本地 SQLite 数据库文件
  const dbPath = path.join(cwd, 'self_agent.db');
  rmIfExists(dbPath);

  // 2) 清空 uploads 下历史解压与上传产物
  const uploadsDir = path.join(cwd, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    const entries = fs.readdirSync(uploadsDir);
    for (const name of entries) {
      const full = path.join(uploadsDir, name);
      rmIfExists(full);
    }
  }

  console.log('✅ Local data cleanup finished.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
