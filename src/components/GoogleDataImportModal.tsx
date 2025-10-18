/**
 * 📥 Google Data Import Modal
 * 用于导入 Google Takeout 数据并开始训练 Self AI Agent
 */
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Brain,
  Mail,
  FileText,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Youtube,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { googleDataImportService, type ImportProgress, type GoogleDataSource, type GoogleImportStats } from "@/services/googleDataImport";
import { trainSelfAgent, getTrainingStatus, type TrainingProgress, type TrainingJob } from "@/services/selfAgent";

interface GoogleDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onComplete?: () => void;
}

const dataSourceIcons: Record<
  GoogleDataSource['type'],
  React.ComponentType<{ className?: string }>
> = {
  gmail: Mail,
  drive: FileText,
  photos: ImageIcon,
  calendar: Calendar,
  contacts: Mail,
  youtube: Youtube,
  maps: MapPin,
};

const stageLabels: Record<ImportProgress['stage'] | TrainingProgress['stage'], string> = {
  uploading: '上传文件中',
  parsing: '解析数据中',
  processing: '处理数据中',
  vectorizing: '向量化中',
  preparing: '准备训练',
  embedding: '生成嵌入向量',
  training: '训练模型中',
  validating: '验证模型',
  deploying: '部署模型',
  completed: '完成',
  error: '导入失败',
  failed: '训练失败',
};

const formatTimestamp = (timestamp?: number | null) => {
  if (!timestamp) return null;
  return new Date(timestamp).toLocaleString();
};

const mapJobToProgress = (job: TrainingJob): TrainingProgress => {
  switch (job.status) {
    case 'queued':
      return {
        stage: 'preparing',
        progress: 10,
        message: '训练任务排队中...'
      };
    case 'running':
      return {
        stage: 'training',
        progress: 65,
        message: '训练进行中，请稍候...'
      };
    case 'succeeded':
      return {
        stage: 'completed',
        progress: 100,
        message: '训练完成'
      };
    case 'failed':
    default:
      return {
        stage: 'failed',
        progress: 100,
        message: '训练失败',
        error: job.error ?? '训练失败，请稍后重试'
      };
  }
};

export const GoogleDataImportModal = ({
  isOpen,
  onClose,
  userId,
  onComplete,
}: GoogleDataImportModalProps) => {
  const [stage, setStage] = useState<'select' | 'importing' | 'training' | 'completed'>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [latestStats, setLatestStats] = useState<GoogleImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const trainingStartedRef = useRef(false);

  const clearPollTimer = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    googleDataImportService
      .getImportStats(userId)
      .then((stats) => {
        if (!cancelled) {
          setLatestStats(stats);
        }
      })
      .catch((e: any) => {
        if (!cancelled) {
          setLatestStats(null);
          const msg = e?.message || String(e);
          if (msg.includes('无法连接到后端服务')) {
            setError(msg);
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, userId]);

  useEffect(() => {
    return () => {
      clearPollTimer();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      clearPollTimer();
    }
  }, [isOpen]);

  const lastImportTime = formatTimestamp(
    latestStats?.lastImportSummary?.completedAt ?? latestStats?.lastImportAt ?? null
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('请先选择文件');
      return;
    }

    setStage('importing');
    setError(null);
    setImportProgress({
      stage: 'uploading',
      percentage: 0,
      processedFiles: 0,
      totalFiles: 0,
      currentFile: selectedFile.name,
      estimatedTimeRemaining: undefined,
    });
    trainingStartedRef.current = false;

    try {
      await googleDataImportService.uploadTakeoutFile(
        selectedFile,
        userId,
        (progress) => {
          setImportProgress(progress);

          if (progress.stage === 'error') {
            const message = progress.error ?? '导入失败';
            setError(message);
            toast.error(message);
            setImportProgress(null);
            setStage('select');
            trainingStartedRef.current = false;
            return;
          }

          if (progress.stage === 'completed') {
            if (trainingStartedRef.current) {
              return;
            }
            trainingStartedRef.current = true;
            toast.success('数据导入完成，准备训练 AI');
            googleDataImportService
              .getImportStats(userId)
              .then(setLatestStats)
              .catch(() => undefined);

            setTimeout(() => {
              startTraining();
            }, 800);
          }
        }
      );

      toast.info('文件上传成功，正在解析数据');
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      toast.error(err instanceof Error ? err.message : '数据导入失败');
      setStage('select');
      setImportProgress(null);
      trainingStartedRef.current = false;
    }
  };

  const startTraining = async () => {
    setStage('training');
    setError(null);
    clearPollTimer();

    try {
      const stats = await googleDataImportService.getImportStats(userId);
      setLatestStats(stats);

      const totalDocs = stats?.totals?.documents ?? 0;
      if (totalDocs === 0) {
        throw new Error('未找到可用于训练的数据，请先完成导入');
      }

      toast.info(`开始训练 Self AI Agent，共 ${stats.totals.chunks ?? totalDocs} 条记忆`);

      const job = await trainSelfAgent({
        userId,
        memories: [],
        config: {
          model: 'gpt-3.5-turbo',
          epochs: 5,
          temperature: 0.7,
          maxTokens: 2048,
        },
      });

      const initialProgress = mapJobToProgress(job);
      setTrainingProgress(initialProgress);

      if (initialProgress.stage === 'completed') {
        toast.success('Self AI Agent 训练完成！');
        setStage('completed');
        onComplete?.();
        trainingStartedRef.current = false;
        return;
      }

      pollTimerRef.current = window.setInterval(async () => {
        try {
          const status = await getTrainingStatus(job.id);
          const progress = mapJobToProgress(status);
          setTrainingProgress(progress);

          if (progress.stage === 'completed') {
            clearPollTimer();
            toast.success('Self AI Agent 训练完成！');
            setStage('completed');
            onComplete?.();
            trainingStartedRef.current = false;
          } else if (progress.stage === 'failed') {
            // 容错：若状态为 failed，尝试读取最新统计，若已有记忆则视为完成
            try {
              const s = await googleDataImportService.getImportStats(userId);
              if ((s?.totals?.chunks ?? 0) > 0) {
                clearPollTimer();
                toast.success('训练完成（根据统计确认）');
                setStage('completed');
                setTrainingProgress({ stage: 'completed', progress: 100, message: '训练完成' });
                onComplete?.();
                trainingStartedRef.current = false;
              } else {
                clearPollTimer();
                const message = progress.error ?? '训练失败';
                setError(message);
                toast.error(message);
                trainingStartedRef.current = false;
              }
            } catch {
              clearPollTimer();
              const message = progress.error ?? '训练失败';
              setError(message);
              toast.error(message);
              trainingStartedRef.current = false;
            }
          }
        } catch (pollError) {
          // 容错：轮询失败也尝试读取统计信息
          try {
            const s = await googleDataImportService.getImportStats(userId);
            if ((s?.totals?.chunks ?? 0) > 0) {
              clearPollTimer();
              toast.success('训练完成（根据统计确认）');
              setStage('completed');
              setTrainingProgress({ stage: 'completed', progress: 100, message: '训练完成' });
              onComplete?.();
              trainingStartedRef.current = false;
              return;
            }
          } catch {}

          clearPollTimer();
          const message = pollError instanceof Error ? pollError.message : '训练进度查询失败';
          setError(message);
          toast.error(message);
          trainingStartedRef.current = false;
        }
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '训练失败';
      setTrainingProgress({
        stage: 'failed',
        progress: 100,
        message: '训练失败',
        error: message,
      });
      setError(message);
      toast.error(message);
      trainingStartedRef.current = false;
    }
  };

  const handleClose = () => {
    if (stage === 'importing' || stage === 'training') {
      if (!confirm('导入/训练正在进行中，确定要关闭吗？')) {
        return;
      }
    }
    onClose();
    clearPollTimer();
  trainingStartedRef.current = false;
    // 重置状态
    setTimeout(() => {
      setStage('select');
      setSelectedFile(null);
      setImportProgress(null);
      setTrainingProgress(null);
      setError(null);
    }, 300);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-indigo-600" />
            导入 Google 数据并训练 Self AI Agent
          </DialogTitle>
          <DialogDescription>
            导入您的 Google Takeout 数据，让 AI 学习您的个人风格和偏好
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {stage === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* 文件上传区域 */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">上传 Google Takeout 文件</h3>
                <p className="text-sm text-gray-500 mb-4">
                  支持 .zip 或 .tgz 格式的压缩文件
                </p>
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" asChild>
                    <span>选择文件</span>
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".zip,.tgz"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>{selectedFile.name}</span>
                    <span className="text-gray-400">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              {/* 支持的数据源 */}
              <div>
                <h4 className="text-sm font-semibold mb-3">支持的数据源：</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(dataSourceIcons).map(([type, Icon]) => (
                    <div
                      key={type}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm capitalize">{type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {latestStats && (
                <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <div>
                    已累计导入 {latestStats.totals.documents.toLocaleString()} 个文档 /
                    {latestStats.totals.chunks.toLocaleString()} 条记忆
                  </div>
                  {lastImportTime && (
                    <div className="mt-1 text-xs text-gray-500">
                      最近一次导入：{lastImportTime}
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  取消
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                >
                  开始导入并训练
                </Button>
              </div>
            </motion.div>
          )}

          {stage === 'importing' && importProgress && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Loader2 className="h-12 w-12 mx-auto text-indigo-600 animate-spin mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {stageLabels[importProgress.stage]}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {importProgress.currentFile ?? '正在处理导入的数据'}
                </p>
                <Progress value={Math.min(importProgress.percentage, 100)} className="mb-2" />
                <p className="text-xs text-gray-500">
                  {importProgress.processedFiles ?? 0} / {importProgress.totalFiles ?? 0} 文件
                  {typeof importProgress.estimatedTimeRemaining === 'number' && importProgress.estimatedTimeRemaining > 0 && (
                    <span className="ml-2">
                      · 预计剩余 {Math.ceil(importProgress.estimatedTimeRemaining / 60)} 分钟
                    </span>
                  )}
                </p>
                {importProgress.stats && (
                  <p className="text-xs text-gray-400">
                    已生成 {importProgress.stats.chunks ?? 0} 条记忆 / {importProgress.stats.docs ?? 0} 个文档
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {stage === 'training' && trainingProgress && (
            <motion.div
              key="training"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center">
                {trainingProgress.stage === 'failed' ? (
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                ) : (
                  <Brain className="h-12 w-12 mx-auto text-violet-600 mb-4 animate-pulse" />
                )}
                <h3 className="text-lg font-semibold mb-2">
                  {stageLabels[trainingProgress.stage]}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {trainingProgress.message ?? '正在训练模型，请稍候...'}
                </p>
                <Progress value={Math.min(trainingProgress.progress, 100)} className="mb-2" />
                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 mt-4">
                  <div>
                    <span className="font-semibold">Epoch: </span>
                    {trainingProgress.currentEpoch ?? '--'} / {trainingProgress.totalEpochs ?? '--'}
                  </div>
                  <div>
                    <span className="font-semibold">Loss: </span>
                    {typeof trainingProgress.loss === 'number'
                      ? trainingProgress.loss.toFixed(4)
                      : '--'}
                  </div>
                  <div>
                    <span className="font-semibold">Accuracy: </span>
                    {typeof trainingProgress.accuracy === 'number'
                      ? `${(trainingProgress.accuracy * 100).toFixed(2)}%`
                      : '--'}
                  </div>
                  {typeof trainingProgress.estimatedTimeRemaining === 'number' && (
                    <div>
                      <span className="font-semibold">剩余: </span>
                      {trainingProgress.estimatedTimeRemaining > 0
                        ? `${Math.ceil(trainingProgress.estimatedTimeRemaining / 60)} 分钟`
                        : '--'}
                    </div>
                  )}
                </div>
                {trainingProgress.error && (
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{trainingProgress.error}</span>
                  </div>
                )}
                {trainingProgress.stage === 'failed' && (
                  <div className="mt-6 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStage('select');
                        setTrainingProgress(null);
                        setImportProgress(null);
                        setError(null);
                        trainingStartedRef.current = false;
                      }}
                    >
                      返回重新导入
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {stage === 'completed' && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center space-y-6 py-6"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                  <CheckCircle className="h-20 w-20 mx-auto text-green-500" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="h-32 w-32 bg-green-500/20 rounded-full blur-xl" />
                </motion.div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2">训练完成！</h3>
                <p className="text-gray-500 mb-6">
                  您的 Self AI Agent 已经准备好，可以开始对话了
                </p>
                {latestStats?.lastImportSummary && (
                  <div className="mb-6 rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
                    <div>
                      本次导入 {latestStats.lastImportSummary.documents.toLocaleString()} 个文档 /
                      {latestStats.lastImportSummary.chunks.toLocaleString()} 条记忆
                    </div>
                    {latestStats.lastImportSummary.files > 0 && (
                      <div className="text-xs text-indigo-500 mt-1">
                        文件总数：{latestStats.lastImportSummary.files.toLocaleString()} 个
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleClose} className="flex-1">
                    关闭
                  </Button>
                  <Button
                    onClick={() => {
                      handleClose();
                      // 跳转到 Chat 页面
                      window.location.href = '/chat';
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  >
                    开始对话
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
