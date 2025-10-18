/**
 * 📥 Unified Data Import Modal
 * 统一数据导入模态框 - 支持 Google/WeChat/Instagram 等多数据源
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
  MessageSquare,
  Instagram,
  X,
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
import { googleDataImportService, type ImportProgress, type GoogleImportStats } from "@/services/googleDataImport";
import { trainSelfAgent, getTrainingStatus, type TrainingProgress, type TrainingJob } from "@/services/selfAgent";

interface UnifiedDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onComplete?: () => void;
}

type DataSourceType = "google" | "wechat" | "instagram" | "unknown";

interface FileWithSource {
  file: File;
  detectedSource?: DataSourceType;
  importId?: string;
  progress?: ImportProgress;
}

const dataSourceIcons: Record<DataSourceType, React.ComponentType<{ className?: string }>> = {
  google: Mail,
  wechat: MessageSquare,
  instagram: Instagram,
  unknown: FileText,
};

const dataSourceLabels: Record<DataSourceType, string> = {
  google: "Google Takeout",
  wechat: "WeChat (微信)",
  instagram: "Instagram",
  unknown: "Unknown",
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

const mapJobToProgress = (job: TrainingJob): TrainingProgress => {
  switch (job.status) {
    case 'queued':
      return { stage: 'preparing', progress: 10, message: '训练任务排队中...' };
    case 'running':
      return { stage: 'training', progress: 65, message: '训练进行中，请稍候...' };
    case 'succeeded':
      return { stage: 'completed', progress: 100, message: '训练完成' };
    case 'failed':
    default:
      return { stage: 'failed', progress: 100, message: '训练失败', error: job.error ?? '训练失败，请稍后重试' };
  }
};

export const UnifiedDataImportModal = ({
  isOpen,
  onClose,
  userId,
  onComplete,
}: UnifiedDataImportModalProps) => {
  const [stage, setStage] = useState<'select' | 'importing' | 'training' | 'completed'>('select');
  const [selectedFiles, setSelectedFiles] = useState<FileWithSource[]>([]);
  const [importingFiles, setImportingFiles] = useState<FileWithSource[]>([]);
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
    if (!isOpen) return;

    let cancelled = false;
    googleDataImportService
      .getImportStats(userId)
      .then((stats) => {
        if (!cancelled) setLatestStats(stats);
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

    return () => { cancelled = true; };
  }, [isOpen, userId]);

  useEffect(() => clearPollTimer, []);
  useEffect(() => { if (!isOpen) clearPollTimer(); }, [isOpen]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const filesWithSource = files.map(file => ({
        file,
        detectedSource: detectSourceFromFilename(file.name),
      }));
      setSelectedFiles(prev => [...prev, ...filesWithSource]);
      setError(null);
    }
  };

  const detectSourceFromFilename = (filename: string): DataSourceType => {
    const lower = filename.toLowerCase();
    if (lower.includes('takeout') || lower.includes('google')) return 'google';
    if (lower.includes('wechat') || lower.includes('weixin') || lower.includes('微信')) return 'wechat';
    if (lower.includes('instagram') || lower.includes('ig')) return 'instagram';
    return 'unknown';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      setError('请先选择文件');
      return;
    }

    setStage('importing');
    setError(null);
    setImportingFiles(selectedFiles.map(f => ({ ...f, progress: {
      stage: 'uploading' as const,
      percentage: 0,
      processedFiles: 0,
      totalFiles: 0,
      currentFile: f.file.name,
    }})));
    trainingStartedRef.current = false;

    try {
      // 使用多文件上传 API
      const formData = new FormData();
      selectedFiles.forEach(({ file }) => formData.append('files', file));
      formData.append('userId', userId);

      const response = await fetch('/api/google-import/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '上传失败');
      }

      const { importIds } = await response.json();
      toast.info(`${importIds.length} 个文件上传成功，正在解析数据`);

      // 更新 importId
      setImportingFiles(prev => prev.map((f, i) => ({
        ...f,
        importId: importIds[i],
      })));

      // 轮询所有导入进度
      startImportPolling(importIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
      toast.error(err instanceof Error ? err.message : '数据导入失败');
      setStage('select');
      setImportingFiles([]);
      trainingStartedRef.current = false;
    }
  };

  const startImportPolling = (importIds: string[]) => {
    const pollInterval = setInterval(async () => {
      try {
        const progressPromises = importIds.map(id =>
          fetch(`/api/google-import/progress/${id}`).then(r => r.json())
        );
        const progresses = await Promise.all(progressPromises);

        setImportingFiles(prev => prev.map((f, i) => ({
          ...f,
          progress: progresses[i],
        })));

        // 检查是否全部完成
        const allCompleted = progresses.every(p => p.stage === 'completed');
        const anyError = progresses.some(p => p.stage === 'error');

        if (anyError) {
          clearInterval(pollInterval);
          const firstError = progresses.find(p => p.stage === 'error');
          setError(firstError?.error || '某些文件导入失败');
          toast.error('部分文件导入失败');
        }

        if (allCompleted && !trainingStartedRef.current) {
          clearInterval(pollInterval);
          trainingStartedRef.current = true;
          toast.success('数据导入完成，准备训练 AI');
          await googleDataImportService.getImportStats(userId).then(setLatestStats);
          setTimeout(() => startTraining(), 800);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1000);

    // 设置超时清理
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000); // 5分钟超时
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
              setError(progress.error ?? '训练失败');
              toast.error('训练失败');
              trainingStartedRef.current = false;
            }
          }
        } catch (e: any) {
          console.error('Training poll error:', e);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '训练失败');
      toast.error(err instanceof Error ? err.message : '无法启动训练');
      setStage('select');
      setTrainingProgress(null);
      trainingStartedRef.current = false;
    }
  };

  const handleClose = () => {
    if (stage === 'importing' || stage === 'training') {
      if (!confirm('导入/训练正在进行中，确定要关闭吗？')) {
        return;
      }
    }
    clearPollTimer();
    setStage('select');
    setSelectedFiles([]);
    setImportingFiles([]);
    setTrainingProgress(null);
    setError(null);
    trainingStartedRef.current = false;
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>导入个人数据</DialogTitle>
          <DialogDescription>
            支持导入 Google Takeout、微信、Instagram 等数据源
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 文件选择阶段 */}
          {stage === 'select' && (
            <>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                    选择文件
                  </span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".zip,.tgz,.tar.gz"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground mt-2">
                  支持 .zip, .tgz, .tar.gz 格式，可同时选择多个文件
                </p>
              </div>

              {/* 已选文件列表 */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">已选择 {selectedFiles.length} 个文件：</h4>
                  {selectedFiles.map((fileWithSource, index) => {
                    const Icon = dataSourceIcons[fileWithSource.detectedSource || 'unknown'];
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <div>
                            <p className="text-sm font-medium">{fileWithSource.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {dataSourceLabels[fileWithSource.detectedSource || 'unknown']} · {' '}
                              {(fileWithSource.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={selectedFiles.length === 0}
                  className="flex-1"
                >
                  开始导入并训练
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  取消
                </Button>
              </div>

              {/* 历史统计 */}
              {latestStats && (
                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-medium">当前统计</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">总文档数</p>
                      <p className="font-semibold">{latestStats.totals.documents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">总记忆块数</p>
                      <p className="font-semibold">{latestStats.totals.chunks}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 导入阶段 */}
          {stage === 'importing' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">正在导入数据...</h3>
              {importingFiles.map((fileWithProgress, index) => {
                const Icon = dataSourceIcons[fileWithProgress.detectedSource || 'unknown'];
                const progress = fileWithProgress.progress;
                return (
                  <div key={index} className="space-y-2 p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{fileWithProgress.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {progress ? stageLabels[progress.stage] : '等待中...'}
                        </p>
                      </div>
                      {progress?.stage === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {progress?.stage === 'error' && (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    {progress && (
                      <Progress value={progress.percentage} className="h-2" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 训练阶段 */}
          {stage === 'training' && trainingProgress && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary animate-pulse" />
                <div>
                  <h3 className="text-lg font-semibold">训练 Self AI Agent</h3>
                  <p className="text-sm text-muted-foreground">
                    {trainingProgress.message || stageLabels[trainingProgress.stage]}
                  </p>
                </div>
              </div>
              <Progress value={trainingProgress.progress} />
              <p className="text-sm text-center text-muted-foreground">
                {trainingProgress.progress}% 完成
              </p>
            </div>
          )}

          {/* 完成阶段 */}
          {stage === 'completed' && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">训练完成！</h3>
                <p className="text-sm text-muted-foreground">
                  Self AI Agent 已成功学习您的个人数据
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                开始使用
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
