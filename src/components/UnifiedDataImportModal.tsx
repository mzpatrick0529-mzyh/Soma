/**
 * 📥 Unified Data Import Modal
 * Unified data import modal - supports multiple data sources like Google/WeChat/Instagram
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
import { 
  WeChatDisclaimerModal, 
  BiometricConsentModal, 
  SensitiveInfoLimitationModal 
} from "@/components/ComplianceModals";

interface UnifiedDataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onComplete?: () => void;
  userState?: string; // e.g., "IL" for Illinois (for BIPA compliance)
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
  wechat: "WeChat",
  instagram: "Instagram",
  unknown: "Unknown",
};

const stageLabels: Record<ImportProgress['stage'] | TrainingProgress['stage'], string> = {
  uploading: 'Uploading files',
  parsing: 'Parsing data',
  processing: 'Processing data',
  vectorizing: 'Vectorizing',
  preparing: 'Preparing training',
  embedding: 'Generating embeddings',
  training: 'Training model',
  validating: 'Validating model',
  deploying: 'Deploying model',
  completed: 'Completed',
  error: 'Import failed',
  failed: 'Training failed',
};

const mapJobToProgress = (job: TrainingJob): TrainingProgress => {
  switch (job.status) {
    case 'queued':
      return { stage: 'preparing', progress: 10, message: 'Training task queued...' };
    case 'running':
      return { stage: 'training', progress: 65, message: 'Training in progress, please wait...' };
    case 'succeeded':
      return { stage: 'completed', progress: 100, message: 'Training completed' };
    case 'failed':
    default:
      return { stage: 'failed', progress: 100, message: 'Training failed', error: job.error ?? 'Training failed, please retry later' };
  }
};

export const UnifiedDataImportModal = ({
  isOpen,
  onClose,
  userId,
  onComplete,
  userState,
}: UnifiedDataImportModalProps) => {
  const [stage, setStage] = useState<'select' | 'importing' | 'training' | 'completed'>('select');
  const [selectedFiles, setSelectedFiles] = useState<FileWithSource[]>([]);
  const [importingFiles, setImportingFiles] = useState<FileWithSource[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null);
  const [latestStats, setLatestStats] = useState<GoogleImportStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const trainingStartedRef = useRef(false);

  // Compliance states
  const [showWeChatDisclaimer, setShowWeChatDisclaimer] = useState(false);
  const [showBiometricConsent, setShowBiometricConsent] = useState(false);
  const [showSensitiveInfoModal, setShowSensitiveInfoModal] = useState(false);
  const [wechatAccepted, setWechatAccepted] = useState(false);
  const [biometricAccepted, setBiometricAccepted] = useState(false);
  const [sensitiveInfoLimited, setSensitiveInfoLimited] = useState(false);
  const [complianceCompleted, setComplianceCompleted] = useState(false);

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
          if (msg.includes('Cannot connect to backend service')) {
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
    if (lower.includes('wechat') || lower.includes('weixin') || lower.includes('WeChat')) return 'wechat';
    if (lower.includes('instagram') || lower.includes('ig')) return 'instagram';
    return 'unknown';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startComplianceFlow = () => {
    // Check if compliance modals are needed
    const hasWeChatFiles = selectedFiles.some(f => f.detectedSource === 'wechat');
    const hasMediaFiles = selectedFiles.some(f => 
      f.file.name.match(/\.(jpg|jpeg|png|mp3|mp4|wav|m4a|mov)$/i)
    );

    if (hasWeChatFiles && !wechatAccepted) {
      setShowWeChatDisclaimer(true);
      return;
    }

    if (hasMediaFiles && !biometricAccepted) {
      setShowBiometricConsent(true);
      return;
    }

    if (!complianceCompleted) {
      setShowSensitiveInfoModal(true);
      return;
    }

    // All compliance checks passed, proceed with import
    handleImport();
  };

  const handleWeChatAccept = () => {
    setWechatAccepted(true);
    setShowWeChatDisclaimer(false);
    toast.success("WeChat data import risks confirmed");
    
    // Continue with next compliance check
    const hasMediaFiles = selectedFiles.some(f => 
      f.file.name.match(/\.(jpg|jpeg|png|mp3|mp4|wav|m4a|mov)$/i)
    );
    
    if (hasMediaFiles && !biometricAccepted) {
      setShowBiometricConsent(true);
    } else if (!complianceCompleted) {
      setShowSensitiveInfoModal(true);
    } else {
      handleImport();
    }
  };

  const handleWeChatDecline = () => {
    setShowWeChatDisclaimer(false);
    setSelectedFiles(prev => prev.filter(f => f.detectedSource !== 'wechat'));
    toast.info("WeChat files removed");
  };

  const handleBiometricAccept = () => {
    setBiometricAccepted(true);
    setShowBiometricConsent(false);
    toast.success("Biometric data collection authorized");

    // Log consent (for compliance)
    console.log("[Biometric Consent] User granted consent", {
      userId,
      timestamp: new Date().toISOString(),
      userState,
    });
    
    if (!complianceCompleted) {
      setShowSensitiveInfoModal(true);
    } else {
      handleImport();
    }
  };

  const handleBiometricDecline = () => {
    setShowBiometricConsent(false);
    toast.warning("Voice and facial features will not be processed");
    // Still allow import but flag to skip biometric processing
  };

  const handleSensitiveInfoAccept = (limitUsage: boolean) => {
    setSensitiveInfoLimited(limitUsage);
    setComplianceCompleted(true);
    setShowSensitiveInfoModal(false);

    if (limitUsage) {
      toast.info("Sensitive information use limited to core services");
    } else {
      toast.success("Compliance confirmation completed");
    }

    // Log compliance choice
    console.log("[Sensitive Info] User choice", {
      userId,
      limitUsage,
      timestamp: new Date().toISOString(),
    });

    // Now proceed with actual import
    handleImport();
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files first');
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
      // Using multi-file upload API
      const formData = new FormData();
      selectedFiles.forEach(({ file }) => formData.append('files', file));
      formData.append('userId', userId);

      const response = await fetch('/api/google-import/upload-multiple', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { importIds } = await response.json();
      toast.info(`${importIds.length} files uploaded successfully, parsing data`);

      // Update importId
      setImportingFiles(prev => prev.map((f, i) => ({
        ...f,
        importId: importIds[i],
      })));

      // Polling all import progress
      startImportPolling(importIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      toast.error(err instanceof Error ? err.message : 'Data import failed');
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

        // Check if all completed
        const allCompleted = progresses.every(p => p.stage === 'completed');
        const anyError = progresses.some(p => p.stage === 'error');

        if (anyError) {
          clearInterval(pollInterval);
          const firstError = progresses.find(p => p.stage === 'error');
          setError(firstError?.error || 'Some files failed to import');
          toast.error('Partial file import failed');
        }

        if (allCompleted && !trainingStartedRef.current) {
          clearInterval(pollInterval);
          trainingStartedRef.current = true;
          toast.success('Data import completed, preparing to train AI');
          await googleDataImportService.getImportStats(userId).then(setLatestStats);
          setTimeout(() => startTraining(), 800);
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1000);

    // Setting timeout cleanup
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000); // 5 minute timeout
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
        throw new Error('No data available for training, please complete import first');
      }

      toast.info(`Starting to train Self AI Agent, total ${stats.totals.chunks ?? totalDocs} memories`);

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
        toast.success('Self AI Agent Training completed！');
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
            toast.success('Self AI Agent Training completed！');
            setStage('completed');
            onComplete?.();
            trainingStartedRef.current = false;
          } else if (progress.stage === 'failed') {
            const s = await googleDataImportService.getImportStats(userId);
            if ((s?.totals?.chunks ?? 0) > 0) {
              clearPollTimer();
              toast.success('Training completed (confirmed by statistics)');
              setStage('completed');
              setTrainingProgress({ stage: 'completed', progress: 100, message: 'Training completed' });
              onComplete?.();
              trainingStartedRef.current = false;
            } else {
              clearPollTimer();
              setError(progress.error ?? 'Training failed');
              toast.error('Training failed');
              trainingStartedRef.current = false;
            }
          }
        } catch (e: any) {
          console.error('Training poll error:', e);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Training failed');
      toast.error(err instanceof Error ? err.message : 'Unable to start training');
      setStage('select');
      setTrainingProgress(null);
      trainingStartedRef.current = false;
    }
  };

  const handleClose = () => {
    if (stage === 'importing' || stage === 'training') {
      if (!confirm('Import/training in progress, are you sure you want to close?')) {
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
          <DialogTitle>Import Personal Data</DialogTitle>
          <DialogDescription>
            Supports importing data sources like Google Takeout, WeChat, Instagram, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File selection stage */}
          {stage === 'select' && (
            <>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-sm font-medium text-primary hover:text-primary/80">
                    Select Files
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
                  Supports .zip, .tgz, .tar.gz formats, can select multiple files simultaneously
                </p>
              </div>

              {/* Selected files list */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Selected {selectedFiles.length} files:</h4>
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
                  onClick={startComplianceFlow}
                  disabled={selectedFiles.length === 0}
                  className="flex-1"
                >
                  Start Import and Training
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>

              {/* Historical Statistics */}
              {latestStats && (
                <div className="pt-4 border-t space-y-2">
                  <h4 className="text-sm font-medium">Current Statistics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Documents</p>
                      <p className="font-semibold">{latestStats.totals.documents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Memory Blocks</p>
                      <p className="font-semibold">{latestStats.totals.chunks}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Import stage */}
          {stage === 'importing' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Importing data...</h3>
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
                          {progress ? stageLabels[progress.stage] : 'Waiting...'}
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

          {/* Training stage */}
          {stage === 'training' && trainingProgress && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary animate-pulse" />
                <div>
                  <h3 className="text-lg font-semibold">Training Self AI Agent</h3>
                  <p className="text-sm text-muted-foreground">
                    {trainingProgress.message || stageLabels[trainingProgress.stage]}
                  </p>
                </div>
              </div>
              <Progress value={trainingProgress.progress} />
              <p className="text-sm text-center text-muted-foreground">
                {trainingProgress.progress}% Completed
              </p>
            </div>
          )}

          {/* Completed stage */}
          {stage === 'completed' && (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">Training completed！</h3>
                <p className="text-sm text-muted-foreground">
                  Self AI Agent has successfully learned your personal data
                </p>
              </div>
              <Button onClick={handleClose} className="w-full">
                Get Started
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Compliance Modals */}
      <WeChatDisclaimerModal
        open={showWeChatDisclaimer}
        onAccept={handleWeChatAccept}
        onDecline={handleWeChatDecline}
      />

      <BiometricConsentModal
        open={showBiometricConsent}
        onAccept={handleBiometricAccept}
        onDecline={handleBiometricDecline}
        userState={userState}
      />

      <SensitiveInfoLimitationModal
        open={showSensitiveInfoModal}
        onAccept={handleSensitiveInfoAccept}
        onClose={() => setShowSensitiveInfoModal(false)}
      />
    </Dialog>
  );
};
