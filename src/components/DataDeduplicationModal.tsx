import React, { useState } from "react";
import { Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";

interface DeduplicationStats {
  documents: {
    duplicateGroups: number;
    totalDuplicates: number;
    examples: Array<{
      hash: string;
      count: number;
      ids: string[];
      content: string;
    }>;
  };
  chunks: {
    duplicateGroups: number;
    totalDuplicates: number;
    examples: Array<{
      hash: string;
      count: number;
      ids: string[];
      text: string;
    }>;
  };
}

interface DataDeduplicationModalProps {
  userId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function DataDeduplicationModal({ userId, onClose, onComplete }: DataDeduplicationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DeduplicationStats | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [executing, setExecuting] = useState(false);

  // 加载去重统计
  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8787/api/self-agent/deduplication/stats?userId=${encodeURIComponent(userId)}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to load deduplication stats");
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error: any) {
      toast({
        title: "Failed to load",
        description: error.message || "无法加载重复数据统计",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 执行去重
  const handleDeduplicate = async () => {
    if (!stats) return;

    const totalDuplicates = stats.documents.totalDuplicates + stats.chunks.totalDuplicates;
    
    if (totalDuplicates === 0) {
      toast({
        title: "无需清理",
        description: "未发现重复数据",
      });
      return;
    }

    const confirmed = window.confirm(
      `确定要删除 ${totalDuplicates} 条重复数据吗？\n\n` +
      `文档重复：${stats.documents.totalDuplicates} 条\n` +
      `记忆块重复：${stats.chunks.totalDuplicates} 条\n\n` +
      `此操作不可撤销！`
    );

    if (!confirmed) return;

    setExecuting(true);
    try {
      const response = await fetch(
        "http://localhost:8787/api/self-agent/deduplication/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            dryRun: false,
            includeDocs: true,
            includeChunks: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Deduplication failed");
      }

      const data = await response.json();
      const result = data.result;

      toast({
        title: "清理Completed",
        description: `成功删除 ${result.documents.removed + result.chunks.removed} 条重复数据`,
      });

      onComplete();
      onClose();
    } catch (error: any) {
      toast({
        title: "清理失败",
        description: error.message || "数据清理过程中出现错误",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  };

  // 初始化时加载统计
  React.useEffect(() => {
    loadStats();
  }, []);

  const totalDuplicates = stats
    ? stats.documents.totalDuplicates + stats.chunks.totalDuplicates
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            数据清理
          </CardTitle>
          <CardDescription>
            检测并删除重复的记忆数据，释放存储空间
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                正在扫描重复数据...
              </span>
            </div>
          )}

          {!loading && stats && (
            <>
              {/* 统计概览 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      重复文档
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.documents.totalDuplicates}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.documents.duplicateGroups} 个重复组
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      重复记忆块
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.chunks.totalDuplicates}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.chunks.duplicateGroups} 个重复组
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* 提示信息 */}
              {totalDuplicates > 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    发现 {totalDuplicates} 条重复数据。清理后将保留每组数据的第一条记录，删除其余重复项。
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    太棒了！您的数据库中没有重复数据。
                  </AlertDescription>
                </Alert>
              )}

              {/* 预览示例 */}
              {totalDuplicates > 0 && stats.documents.examples.length > 0 && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? "隐藏" : "查看"}重复示例
                  </Button>

                  {showPreview && (
                    <div className="space-y-2 max-h-64 overflow-y-auto rounded-md border p-3">
                      {stats.documents.examples.slice(0, 3).map((example, idx) => (
                        <div key={idx} className="rounded-md bg-muted p-3 text-sm">
                          <div className="font-medium text-foreground mb-1">
                            重复 {example.count} 次
                          </div>
                          <div className="text-muted-foreground line-clamp-2">
                            {example.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={executing}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleDeduplicate}
                  disabled={totalDuplicates === 0 || executing}
                >
                  {executing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {executing ? "清理中..." : "执行清理"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
