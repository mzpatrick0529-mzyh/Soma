import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Copy, Check } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

interface MemoryDetailModalProps {
  chunkId?: string;
  docId?: string;
  userId: string;
  onClose: () => void;
}

interface ChunkDetail {
  id: string;
  docId: string;
  idx: number;
  text: string;
  metadata: any;
  createdAt: number;
  document: {
    source: string;
    type: string;
    title: string;
  };
  siblings: Array<{
    id: string;
    idx: number;
    preview: string;
  }>;
}

interface DocumentDetail {
  id: string;
  source: string;
  type: string;
  title: string;
  content: string;
  metadata: any;
  createdAt: number;
}

export function MemoryDetailModal({ chunkId, docId, userId, onClose }: MemoryDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [chunkData, setChunkData] = useState<ChunkDetail | null>(null);
  const [docData, setDocData] = useState<DocumentDetail | null>(null);
  const [currentChunkIdx, setCurrentChunkIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, [chunkId, docId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (chunkId) {
        const response = await api.get(`/self-agent/memories/chunk/${chunkId}?userId=${userId}`) as ChunkDetail;
        setChunkData(response);
        setCurrentChunkIdx(response.idx);
      } else if (docId) {
        const response = await api.get(`/self-agent/memories/document/${docId}?userId=${userId}`) as DocumentDetail;
        setDocData(response);
      }
    } catch (error: any) {
      toast.error("加载失败", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = chunkData?.text || docData?.content || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("复制失败");
    }
  };

  const navigateToSibling = async (direction: "prev" | "next") => {
    if (!chunkData?.siblings) return;
    const currentIdx = chunkData.siblings.findIndex(s => s.id === chunkData.id);
    const targetIdx = direction === "prev" ? currentIdx - 1 : currentIdx + 1;
    if (targetIdx < 0 || targetIdx >= chunkData.siblings.length) return;

    const targetChunk = chunkData.siblings[targetIdx];
    setLoading(true);
    try {
      const response = await api.get(`/self-agent/memories/chunk/${targetChunk.id}?userId=${userId}`) as ChunkDetail;
      setChunkData(response);
      setCurrentChunkIdx(response.idx);
    } catch (error: any) {
      toast.error("加载失败", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentSiblingIdx = chunkData?.siblings.findIndex(s => s.id === chunkData.id) ?? -1;
  const hasPrev = currentSiblingIdx > 0;
  const hasNext = currentSiblingIdx >= 0 && currentSiblingIdx < (chunkData?.siblings.length ?? 0) - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
              {chunkData?.document.title || docData?.title || "内容详情"}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                {chunkData?.document.source || docData?.source}
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                {chunkData?.document.type || docData?.type}
              </span>
              <span>
                {formatDate(chunkData?.createdAt || docData?.createdAt || Date.now())}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            title="关闭"
            aria-label="关闭详情"
            className="ml-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Chunk navigation */}
              {chunkData && (
                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    片段 {currentChunkIdx + 1} / {chunkData.siblings.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigateToSibling("prev")}
                      disabled={!hasPrev}
                      title="上一个片段"
                      aria-label="上一个片段"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigateToSibling("next")}
                      disabled={!hasNext}
                      title="下一个片段"
                      aria-label="下一个片段"
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Main text */}
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                  {chunkData?.text || docData?.content}
                </pre>
              </div>

              {/* Metadata */}
              {(chunkData?.metadata || docData?.metadata) && (
                <details className="mt-6">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    元数据
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(chunkData?.metadata || docData?.metadata, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ID: {chunkId || docId}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "已复制" : "复制内容"}
          </button>
        </div>
      </div>
    </div>
  );
}
