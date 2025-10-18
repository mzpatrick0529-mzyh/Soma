/**
 * 🔧 AI Provider 诊断页面
 * 显示当前 Provider 状态、配置、配额等信息
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, Settings as SettingsIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getProviderInfo, testProviderConnection, type ProviderInfo } from "@/services/streamChat";
import { pageSlideIn, somaSpring } from "@/lib/animations";

export default function ProviderDiagnostics() {
  const [info, setInfo] = useState<ProviderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadProviderInfo = async () => {
    setLoading(true);
    try {
      const data = await getProviderInfo();
      setInfo(data);
    } catch (error: any) {
      toast.error("加载失败: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const result = await testProviderConnection();
      setTestResult(result);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error("测试失败: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    loadProviderInfo();
  }, []);

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 pb-20"
      variants={pageSlideIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <motion.h1
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={somaSpring}
            >
              AI Provider 诊断
            </motion.h1>
            <motion.p
              className="text-sm text-gray-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              查看当前 AI 提供商状态和配置信息
            </motion.p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadProviderInfo}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>

        {/* Provider Info Card */}
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-gray-500 mt-4">加载中...</p>
          </Card>
        ) : info ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Provider 配置
                  </CardTitle>
                  {info.geminiConfigured ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      已配置
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      未配置
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Provider</p>
                    <p className="font-semibold text-lg capitalize">{info.provider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Model</p>
                    <p className="font-semibold text-lg">{info.model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">流式输出</p>
                    <p className="font-semibold text-lg">
                      {info.provider === "gemini" ? "✅ 支持" : "⚠️ 模拟"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">RAG 上下文</p>
                    <p className="font-semibold text-lg">✅ 已启用</p>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">连接测试</h3>
                    <Button
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="gap-2"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          测试中...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          测试连接
                        </>
                      )}
                    </Button>
                  </div>

                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`p-3 rounded-lg border ${
                        testResult.success
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          testResult.success ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {testResult.message}
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Configuration Guide */}
                {!info.geminiConfigured && (
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-3">配置指南</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>1. 访问 Google AI Studio 获取 API Key：</p>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        https://makersuite.google.com/app/apikey
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p>2. 编辑后端配置文件 <code className="px-1 py-0.5 bg-gray-100 rounded">.env</code></p>
                      <p>3. 添加: <code className="px-1 py-0.5 bg-gray-100 rounded">GEMINI_API_KEY=your_key_here</code></p>
                      <p>4. 后端将自动重载（约2秒）</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="p-12 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">加载失败</h3>
            <p className="text-sm text-gray-500 mb-6">无法连接到后端服务</p>
            <Button onClick={loadProviderInfo}>重试</Button>
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>关于 Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Gemini 2.5 Flash Lite</h4>
              <p>Google 最新的轻量级大模型，速度快、成本低，免费配额充足。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">RAG（检索增强生成）</h4>
              <p>自动检索你的记忆数据，为 AI 提供个性化上下文，生成更精准的回复。</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">流式输出</h4>
              <p>使用 Server-Sent Events (SSE) 技术，实时传输 AI 生成的文本，提升响应速度。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
