/**
 * 🔄 File Upload & Progress Routes
 * 处理多数据源文件上传and进度追踪 (Google/WeChat/Instagram)
 */
import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";
import { importUnifiedData, detectDataSource, type DataSource } from "../importers/index";
import { getUserStats } from "../db";
import { extract } from "tar";
import { createGunzip } from "zlib";
import { createReadStream } from "fs";
import { pipeline } from "stream/promises";
import yauzl from "yauzl";
import { generateTrainingSamples, getTrainingSampleStats } from "../services/trainingSampleGenerator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// 允许通过环境变量配置最大上传大小（GB），默认 10GB
const MAX_UPLOAD_SIZE_GB = Number(process.env.MAX_UPLOAD_SIZE_GB || process.env.UPLOAD_MAX_GB || 16);
const MAX_UPLOAD_SIZE_BYTES = Math.max(1, Math.min(100, MAX_UPLOAD_SIZE_GB)) * 1024 * 1024 * 1024; // 1GB ~ 100GB Security范围

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".zip", ".tgz", ".tar.gz"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || file.originalname.endsWith(".tar.gz")) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip, .tgz, .tar.gz files are allowed"));
    }
  },
});

// 支持多文件上传
const uploadMultiple = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_BYTES }, // per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".zip", ".tgz", ".tar.gz"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext) || file.originalname.endsWith(".tar.gz")) {
      cb(null, true);
    } else {
      cb(new Error("Only .zip, .tgz, .tar.gz files are allowed"));
    }
  },
});

// 进度追踪存储
export const importProgress = new Map<
  string,
  {
    userId: string;
    stage: "uploading" | "parsing" | "processing" | "vectorizing" | "generating_samples" | "training" | "completed" | "error";
    totalFiles: number;
    processedFiles: number;
    currentFile: string;
    percentage: number;
    stats?: any;
    error?: string;
    extractedDir?: string;
    fileName?: string;
    fileSize?: number;
    startedAt: number;
    completedAt?: number;
    dataSource?: DataSource; // 识别出的数据源
  }
>();

/**
 * POST /api/google-import/upload
 * 上传 Google Takeout 文件
 */
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const uploadedFilePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    // 初始化进度
    importProgress.set(importId, {
      userId,
      stage: "uploading",
      totalFiles: 0,
      processedFiles: 0,
      currentFile: req.file.originalname,
      percentage: 0,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      startedAt: Date.now(),
    });

    // 异步处理文件
    processUploadedFile(importId, userId, uploadedFilePath, ext).catch((error) => {
      const progress = importProgress.get(importId);
      if (progress) {
        progress.stage = "error";
        progress.error = error.message;
        progress.percentage = 100;
      }
    });

    res.json({
      importId,
      message: "File uploaded successfully, processing started",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google-import/upload-multiple
 * 上传多个数据文件（支持 Google/WeChat/Instagram）
 */
router.post("/upload-multiple", uploadMultiple.array("files", 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 为每个文件创建独立的导入任务
    const importIds: string[] = [];
    
    for (const file of files) {
      const importId = `import_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const uploadedFilePath = file.path;
      const ext = path.extname(file.originalname).toLowerCase();

      // 初始化进度
      importProgress.set(importId, {
        userId,
        stage: "uploading",
        totalFiles: 0,
        processedFiles: 0,
        currentFile: file.originalname,
        percentage: 0,
        fileName: file.originalname,
        fileSize: file.size,
        startedAt: Date.now(),
      });

      // 异步处理文件
      processUploadedFile(importId, userId, uploadedFilePath, ext).catch((error) => {
        const progress = importProgress.get(importId);
        if (progress) {
          progress.stage = "error";
          progress.error = error.message;
          progress.percentage = 100;
        }
      });

      importIds.push(importId);
    }

    res.json({
      importIds,
      count: files.length,
      message: `${files.length} file(s) uploaded successfully, processing started`,
    });
  } catch (error: any) {
    console.error("Upload multiple error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 统一处理 Multer 错误，返回 JSON，避免 HTML 错误页面导致前端解析失败（"<!DOCTYPE"）
router.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (!err) return next();
  const isMulter = err?.name === "MulterError" || typeof err?.code === "string";
  if (isMulter) {
    // 常见：LIMIT_FILE_SIZE
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        error: "File too large",
        code: err.code,
        maxBytes: MAX_UPLOAD_SIZE_BYTES,
        message: `Max per-file size is ${MAX_UPLOAD_SIZE_GB}GB. You can set MAX_UPLOAD_SIZE_GB env to override.`,
      });
    }
    return res.status(400).json({ error: err.message, code: err.code || err.name });
  }
  // 其他错误
  return res.status(500).json({ error: err?.message || String(err) });
});

/**
 * GET /api/google-import/progress/:importId
 * 查询导入进度
 */
router.get("/progress/:importId", (req: Request, res: Response) => {
  const { importId } = req.params;
  const progress = importProgress.get(importId);

  if (!progress) {
    return res.status(404).json({ error: "Import not found" });
  }

  res.json(progress);
});

/**
 * GET /api/google-import/stats
 * 获取用户的导入统计
 */
router.get("/stats", (req: Request, res: Response) => {
  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  // local verify function duplicated would require import; keep lightweight by decoding in server.ts.
  // Here we can't access verifyToken easily, so just prefer query; server-wide endpoints already covered.
  const { userId: userIdQuery } = req.query;
  if (!userIdQuery) {
    return res.status(400).json({ error: "userId is required" });
  }
  const userId = Array.isArray(userIdQuery) ? String(userIdQuery[0]) : String(userIdQuery);
  const summary = getUserStats(userId);

  const latestImport = Array.from(importProgress.values())
    .filter((item) => item.userId === userId && item.stage === "completed")
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))[0];

  res.json({
    totals: {
      documents: summary.totalDocuments,
      chunks: summary.totalChunks,
    },
    sources: summary.bySource,
    lastImportAt: summary.lastImportAt,
    lastImportSummary: latestImport?.stats
      ? {
          files: latestImport.stats.files,
          documents: latestImport.stats.docs,
          chunks: latestImport.stats.chunks,
          completedAt: latestImport.completedAt,
          dataSource: latestImport.dataSource || latestImport.stats.source || "unknown",
        }
      : null,
  });
});

/**
 * DELETE /api/google-import/:importId
 * 删除导入数据
 */
router.delete("/:importId", (req: Request, res: Response) => {
  const { importId } = req.params;

  if (importProgress.has(importId)) {
    const progress = importProgress.get(importId);
    // 清理提取的目录
    if (progress?.extractedDir && fs.existsSync(progress.extractedDir)) {
      fs.rmSync(progress.extractedDir, { recursive: true, force: true });
    }
    importProgress.delete(importId);
  }

  res.json({ message: "Import deleted successfully" });
});

/**
 * 处理上传的文件
 */
async function processUploadedFile(
  importId: string,
  userId: string,
  filePath: string,
  ext: string
): Promise<void> {
  const progress = importProgress.get(importId);
  if (!progress) return;

  try {
  // 1. 解压文件
    progress.stage = "parsing";
    progress.currentFile = "Extracting archive...";

    const extractDir = path.join(path.dirname(filePath), `extracted_${importId}`);
    fs.mkdirSync(extractDir, { recursive: true });
    progress.extractedDir = extractDir;

    if (ext === ".zip") {
      await extractZip(filePath, extractDir, (current, total) => {
        progress.totalFiles = total;
        progress.processedFiles = current;
        progress.percentage = Math.round((current / total) * 30); // 解压占30%
      });
    } else if (ext === ".tgz" || ext === ".gz") {
      await extractTarGz(filePath, extractDir);
    }

    // 2. Auto检测数据源
    progress.currentFile = "Detecting data source...";
    const dataSource = detectDataSource(extractDir);
    progress.dataSource = dataSource;
    console.log(`[upload] Detected data source: ${dataSource} for import ${importId}`);

    // 3. 导入数据
    progress.stage = "processing";
    progress.currentFile = `Importing ${dataSource} data...`;
    progress.percentage = 30;

    const stats = await importUnifiedData(userId, extractDir, dataSource);

    // 4. 更新进度
    progress.stage = "vectorizing";
    progress.percentage = 80;
    progress.stats = stats;

    // 模拟向量化过程
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 5. 生成训练样本（根据后端存储切换）
    progress.stage = "generating_samples";
    progress.percentage = 85;
    progress.currentFile = "Generating training samples...";
    
    try {
      const backend = (process.env.STORAGE_BACKEND || '').toLowerCase();
      let samplesCreated = 0;
      let trainingStats: any = {};
      if (backend === 'pg') {
        const { generateTrainingSamplesPg, getTrainingSampleStatsPg } = await import('../services/trainingSampleGeneratorPg');
        samplesCreated = await generateTrainingSamplesPg(userId, dataSource as any);
        trainingStats = await getTrainingSampleStatsPg(userId);
      } else {
        // 旧路径（SQLite）
        samplesCreated = await generateTrainingSamples(userId, dataSource as any);
        trainingStats = getTrainingSampleStats(userId);
      }
      
      console.log(`[upload] Generated ${samplesCreated} training samples for ${userId}`);
      console.log(`[upload] Training stats: ${JSON.stringify(trainingStats)}`);
      
      // 如果有足够的样本，可以提示用户开始训练
      if ((trainingStats.unused || 0) >= 50) {
        console.log(`[upload] ✅ User ${userId} has ${trainingStats.unused} samples ready for training`);
      }
    } catch (sampleError: any) {
      console.error(`[upload] Failed to generate training samples:`, sampleError);
      // 不中断主流程，样本生成失败不影响数据导入
    }

    // 6. Completed
    progress.stage = "completed";
    progress.percentage = 100;
    progress.currentFile = "Import completed";
    progress.completedAt = Date.now();

    // 清理临时文件
    setTimeout(() => {
      fs.unlinkSync(filePath);
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
    }, 60000); // 1分钟后清理
  } catch (error: any) {
    progress.stage = "error";
    progress.error = error.message;
    throw error;
  }
}

/**
 * 解压 ZIP 文件
 */
function extractZip(
  zipPath: string,
  extractDir: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        return reject(err || new Error("Failed to open zip file"));
      }

      const totalEntries = zipfile.entryCount;
      let processedEntries = 0;

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // 目录
          const dirPath = path.join(extractDir, entry.fileName);
          fs.mkdirSync(dirPath, { recursive: true });
          zipfile.readEntry();
        } else {
          // 文件
          zipfile.openReadStream(entry, (err, readStream) => {
            if (err) {
              reject(err);
              return;
            }

            const filePath = path.join(extractDir, entry.fileName);
            const fileDir = path.dirname(filePath);
            fs.mkdirSync(fileDir, { recursive: true });

            const writeStream = fs.createWriteStream(filePath);
            readStream.pipe(writeStream);

            writeStream.on("close", () => {
              processedEntries++;
              if (onProgress) {
                onProgress(processedEntries, totalEntries);
              }
              zipfile.readEntry();
            });

            writeStream.on("error", reject);
          });
        }
      });

      zipfile.on("end", () => {
        resolve();
      });

      zipfile.on("error", (err) => {
        reject(err);
      });
    });
  });
}

/**
 * 解压 tar.gz 文件
 */
async function extractTarGz(tarGzPath: string, extractDir: string): Promise<void> {
  const readStream = createReadStream(tarGzPath);
  const gunzip = createGunzip();

  await pipeline(
    readStream,
    gunzip,
    extract({
      cwd: extractDir,
      strip: 1,
    })
  );
}

export default router;
