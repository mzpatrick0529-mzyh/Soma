import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { importWeChatData } from '../src/importers/wechat.ts';
import { generateTrainingSamples, getTrainingSampleStats } from '../src/services/trainingSampleGenerator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const userId = process.argv[2] || 'default';
  const uploadsDir = path.resolve(__dirname, '../uploads');

  if (!fs.existsSync(uploadsDir)) {
    console.error(`[import-wechat] uploads directory not found: ${uploadsDir}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(uploadsDir, { withFileTypes: true });
  const candidates = entries
    .filter(e => e.isDirectory() && e.name.startsWith('extracted_import_'))
    .map(e => path.join(uploadsDir, e.name));

  if (!candidates.length) {
    console.error(`[import-wechat] No extracted_import_* directories found in ${uploadsDir}`);
    process.exit(1);
  }

  console.log(`Found ${candidates.length} candidate directories:`);
  for (const dir of candidates) console.log(' -', dir);

  let totalFiles = 0, totalDocs = 0, totalChunks = 0;

  for (const dir of candidates) {
    console.log(`\n[import-wechat] Importing ${dir} for user ${userId} ...`);
    const stats = await importWeChatData(userId, dir);
    totalFiles += stats.files;
    totalDocs += stats.docs;
    totalChunks += stats.chunks;
  }

  console.log(`\n[import-wechat] Import done. files=${totalFiles}, docs=${totalDocs}, chunks=${totalChunks}`);

  console.log(`\n[import-wechat] Generating training samples (source=wechat)...`);
  const created = await generateTrainingSamples(userId, 'wechat', { minQuality: 0.15 });
  const trainingStats = getTrainingSampleStats(userId);
  console.log(`[import-wechat] Samples created: ${created}`);
  console.log(`[import-wechat] Training stats:`, trainingStats);

  // 追加：对所有来源放宽质量阈值，进一步充实样本
  console.log(`\n[import-wechat] Generating additional training samples (source=all, minQuality=0.10)...`);
  const more = await generateTrainingSamples(userId, 'all', { minQuality: 0.10, maxSamples: 300 });
  const trainingStats2 = getTrainingSampleStats(userId);
  console.log(`[import-wechat] Additional samples created: ${more}`);
  console.log(`[import-wechat] Updated training stats:`, trainingStats2);
}

main().catch(err => {
  console.error('[import-wechat] Failed:', err);
  process.exit(1);
});
