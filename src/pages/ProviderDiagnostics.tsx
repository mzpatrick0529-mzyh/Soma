/**
 * 🔧 AI Provider Diagnostics页面
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
      toast.error("Failed to load: " + error.message);
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
              AI Provider Diagnostics
            </motion.h1>
            <motion.p
              className="text-sm text-gray-500 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              View current AI provider status and configuration
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
            Refresh
          </Button>
        </div>

        {/* Provider Info Card */}
        {loading ? (
          <Card className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-gray-500 mt-4">Loading...</p>
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
                    Provider Configuration
                  </CardTitle>
                  {info.geminiConfigured ? (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Configured
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
                    <p className="text-sm text-gray-500 mb-1">Streaming Output</p>
                    <p className="font-semibold text-lg">
                      {info.provider === "gemini" ? "✅ Supported" : "⚠️ Simulated"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">RAG Context</p>
                    <p className="font-semibold text-lg">✅ Enabled</p>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Connection Test</h3>
                    <Button
                      size="sm"
                      onClick={handleTestConnection}
                      disabled={testing}
                      className="gap-2"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Test Connection
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
                    <h3 className="font-semibold mb-3">Configuration Guide</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>1. Visit Google AI Studio to get API Key:</p>
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        https://makersuite.google.com/app/apikey
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <p>2. Edit backend configuration file <code className="px-1 py-0.5 bg-gray-100 rounded">.env</code></p>
                      <p>3. Add: <code className="px-1 py-0.5 bg-gray-100 rounded">GEMINI_API_KEY=your_key_here</code></p>
                      <p>4. Backend will auto-reload (about 2 seconds)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="p-12 text-center">
            <XCircle className="w-16 h-16 mx-auto text-red-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to load</h3>
            <p className="text-sm text-gray-500 mb-6">Cannot connect to backend service</p>
            <Button onClick={loadProviderInfo}>Retry</Button>
          </Card>
        )}

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>About Provider</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Gemini 2.5 Flash Lite</h4>
              <p>Google's latest lightweight large model, fast speed, low cost, with ample free quota.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">RAG (Retrieval Augmented Generation)</h4>
              <p>Automatically retrieve your memory data, provide AI with personalized context, and generate more accurate responses.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Streaming Output</h4>
              <p>Using Server-Sent Events (SSE) technology, real-time transmission of AI-generated text improves response speed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
