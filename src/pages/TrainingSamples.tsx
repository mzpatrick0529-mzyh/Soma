import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiGenerateTrainingSamples, apiListTrainingSamples, apiDeleteTrainingSample } from '@/services/selfAgent';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Brain,
  Sparkles,
  Filter,
  TrendingUp,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Database,
  Target,
  Zap,
  MessageSquare,
  Hash,
} from 'lucide-react';

export default function TrainingSamplesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const userId = user?.email || 'default';

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  // filters
  const [style, setStyle] = useState<string>('');
  const [intent, setIntent] = useState<string>('');
  const [source, setSource] = useState<string>('');
  // shadcn/radix Select 不允许空字符串作为受控值，这里用 'all' 代表全部
  const [template, setTemplate] = useState<string>('all');
  const [order, setOrder] = useState<'created_at_desc' | 'quality_desc'>('created_at_desc');

  // generate params
  const [minQuality, setMinQuality] = useState<number>(0.3);
  const [maxSamples, setMaxSamples] = useState<number>(200);
  const [jaccard, setJaccard] = useState<number>(0.85);
  const [semantic, setSemantic] = useState<number>(0.95);
  const [genSource, setGenSource] = useState<'all' | 'google' | 'instagram' | 'wechat'>('all');

  const templateNum = useMemo(() => {
    if (template === 'all') return undefined; 
    return Number(template) as 0 | 1;
  }, [template]);

  const fetchList = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await apiListTrainingSamples({ userId, limit, offset, style, intent, source, template: templateNum, order });
      setItems(r.items || []);
      setTotal(r.total || 0);
    } catch (e: any) {
      toast.error('加载训练样本失败: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit, offset, style, intent, source, template, order]);

  const onGenerate = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await apiGenerateTrainingSamples({
        userId,
        source: genSource,
        minQuality,
        maxSamples,
        jaccardThreshold: jaccard,
        semanticThreshold: semantic,
      });
      toast.success(`已生成 ${r.samplesCreated} 条样本`);
      setOffset(0);
      fetchList();
    } catch (e: any) {
      toast.error('生成样本失败: ' + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await apiDeleteTrainingSample(id);
      toast.success('已删除样本');
      fetchList();
    } catch (e: any) {
      toast.error('删除失败: ' + (e?.message || e));
    }
  };

  const stats = {
    total,
    highQuality: items.filter(i => (i.quality_score ?? 0) > 0.7).length,
    hasNegative: items.filter(i => i.negative_response).length,
  };

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header - Matching Memories style */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            {/* Title with gradient - matching Chat */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                训练样本数据
              </motion.h1>
            </div>

            <div className="flex items-center gap-2">
              {/* Refresh Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Button
                  size="icon"
                  variant="outline"
                  onClick={fetchList}
                  disabled={loading}
                  className="rounded-full hover:bg-gray-100"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Button
                  variant="outline"
                  onClick={() => navigate('/admin')}
                  className="rounded-full"
                >
                  评测与看板
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Generate Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h2 className="text-sm font-semibold text-gray-900">生成新样本</h2>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={genSource} onValueChange={(v: any) => setGenSource(v)}>
                <SelectTrigger className="w-[140px] rounded-full bg-white/80 border-0">
                  <SelectValue placeholder="来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部来源</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="wechat">WeChat</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                step="0.05"
                min={0}
                max={1}
                value={minQuality}
                onChange={e => setMinQuality(Number(e.target.value))}
                placeholder="最小质量"
                className="w-28 rounded-full bg-white/80 border-0 text-sm"
              />
              <Input
                type="number"
                min={1}
                max={2000}
                value={maxSamples}
                onChange={e => setMaxSamples(Number(e.target.value))}
                placeholder="最大数量"
                className="w-28 rounded-full bg-white/80 border-0 text-sm"
              />
              <Input
                type="number"
                step="0.01"
                min={0.5}
                max={0.98}
                value={jaccard}
                onChange={e => setJaccard(Number(e.target.value))}
                placeholder="Jaccard"
                className="w-28 rounded-full bg-white/80 border-0 text-sm"
              />
              <Input
                type="number"
                step="0.01"
                min={0.6}
                max={0.995}
                value={semantic}
                onChange={e => setSemantic(Number(e.target.value))}
                placeholder="语义相似"
                className="w-28 rounded-full bg-white/80 border-0 text-sm"
              />
              <Button
                onClick={onGenerate}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:opacity-90 text-white rounded-full shadow-md"
              >
                <Zap className="h-4 w-4 mr-2" />
                生成样本
              </Button>
            </div>
          </motion.div>

          {/* Filter Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2"
          >
            <Input
              value={style}
              onChange={e => setStyle(e.target.value)}
              placeholder="风格过滤 (technical/casual...)"
              className="w-64 rounded-full bg-gray-100/80 border-0 text-sm"
            />
            <Input
              value={intent}
              onChange={e => setIntent(e.target.value)}
              placeholder="意图过滤 (question/work...)"
              className="w-64 rounded-full bg-gray-100/80 border-0 text-sm"
            />
            <Input
              value={source}
              onChange={e => setSource(e.target.value)}
              placeholder="来源过滤 (google/instagram/wechat)"
              className="w-72 rounded-full bg-gray-100/80 border-0 text-sm"
            />
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-[140px] rounded-full bg-gray-100/80 border-0">
                <SelectValue placeholder="模板过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="0">非模板</SelectItem>
                <SelectItem value="1">模板</SelectItem>
              </SelectContent>
            </Select>
            <Select value={order} onValueChange={(v: any) => setOrder(v)}>
              <SelectTrigger className="w-[160px] rounded-full bg-gray-100/80 border-0">
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">最近创建</SelectItem>
                <SelectItem value="quality_desc">质量最高</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>
        </div>
      </motion.header>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-screen-xl mx-auto px-4 py-3"
      >
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Badge className="gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border-blue-200">
              <Database className="w-3 h-3" />
              <span className="text-xs font-medium">总计</span>
              <span className="font-bold">{stats.total}</span>
            </Badge>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
          >
            <Badge className="gap-2 px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-50 text-green-700 border-green-200">
              <Target className="w-3 h-3" />
              <span className="text-xs font-medium">高质量</span>
              <span className="font-bold">{stats.highQuality}</span>
            </Badge>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Badge className="gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border-purple-200">
              <MessageSquare className="w-3 h-3" />
              <span className="text-xs font-medium">负样本</span>
              <span className="font-bold">{stats.hasNegative}</span>
            </Badge>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-6">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
              <Brain className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无训练样本</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              点击上方"生成样本"按钮，从您的记忆中自动生成高质量训练数据
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ y: -2 }}
              >
                <Card className="p-4 hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-start gap-4">
                    {/* Quality Indicator */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        (item.quality_score ?? 0) > 0.7
                          ? 'bg-gradient-to-br from-green-100 to-green-50 text-green-700'
                          : (item.quality_score ?? 0) > 0.5
                          ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700'
                          : 'bg-gradient-to-br from-gray-100 to-gray-50 text-gray-700'
                      }`}>
                        {(item.quality_score ?? 0).toFixed(2)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 line-clamp-2 mb-2">
                            {item.user_response}
                          </p>
                          {item.negative_response && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                              <div className="flex items-center gap-1 mb-1">
                                <Hash className="w-3 h-3 text-red-600" />
                                <span className="text-xs font-medium text-red-700">负样本: {item.negative_type}</span>
                              </div>
                              <p className="text-xs text-red-600 line-clamp-1">{item.negative_response}</p>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Tags & Meta */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {safeJoin(item.style_tags) && (
                          <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                            风格: {safeJoin(item.style_tags)}
                          </Badge>
                        )}
                        {safeJoin(item.intent_tags) && (
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            意图: {safeJoin(item.intent_tags)}
                          </Badge>
                        )}
                        {item.source && (
                          <Badge variant="outline" className="text-[10px] bg-gray-50 text-gray-700 border-gray-200">
                            {item.source}
                          </Badge>
                        )}
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{fmtTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200"
          >
            <div className="text-sm text-gray-500">
              第 {Math.floor(offset / limit) + 1} / {Math.max(1, Math.ceil(total / limit))} 页
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset <= 0}
                className="rounded-full"
              >
                上一页
              </Button>
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="rounded-full"
              >
                下一页
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function safeJoin(tags: any): string {
  try {
    if (!tags) return '';
    const arr = typeof tags === 'string' ? JSON.parse(tags) : tags;
    return Array.isArray(arr) ? arr.join(', ') : String(tags);
  } catch {
    return String(tags || '');
  }
}

function fmtTime(ts: any) {
  if (!ts) return '-';
  const t = typeof ts === 'number' ? ts : Date.parse(ts);
  const d = new Date(t);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
