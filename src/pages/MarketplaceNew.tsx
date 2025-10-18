/**
 * 🛍️ Marketplace - Soma Style
 * App Store 风格的 AI 代理市场，精选推荐，分类浏览，高质量购买体验
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  TrendingUp,
  Star,
  Download,
  Heart,
  Search,
  Filter,
  ChevronRight,
  Zap,
  Brain,
  Palette,
  Code,
  MessageSquare,
  Music,
  Camera,
  Book,
  Briefcase,
  Play,
  Check,
  Crown,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Types
interface AIAgent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: string;
  rating: number;
  reviews: number;
  downloads: number;
  price: number;
  isPremium: boolean;
  isFeatured: boolean;
  isInstalled: boolean;
  publisher: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  screenshots?: string[];
  features?: string[];
}

// Mock Data
const categories = [
  { id: "all", name: "全部", icon: Sparkles },
  { id: "productivity", name: "效率工具", icon: Zap },
  { id: "creative", name: "创意设计", icon: Palette },
  { id: "coding", name: "编程助手", icon: Code },
  { id: "writing", name: "写作助理", icon: Book },
  { id: "business", name: "商务分析", icon: Briefcase },
  { id: "chat", name: "对话聊天", icon: MessageSquare },
  { id: "music", name: "音乐创作", icon: Music },
  { id: "photo", name: "图像处理", icon: Camera },
];

const mockAgents: AIAgent[] = [
  {
    id: "1",
    name: "CodeCraft AI",
    tagline: "你的智能编程伙伴",
    description: "CodeCraft AI 是一款革命性的编程助手，支持 50+ 编程语言，提供实时代码补全、bug 检测、代码优化建议。无论你是初学者还是资深开发者，都能从中获益。",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=code",
    category: "coding",
    rating: 4.8,
    reviews: 2341,
    downloads: 125000,
    price: 0,
    isPremium: false,
    isFeatured: true,
    isInstalled: false,
    publisher: {
      name: "DevTools Studio",
      verified: true,
    },
    features: [
      "50+ 编程语言支持",
      "实时代码补全",
      "智能 Bug 检测",
      "代码重构建议",
      "性能优化分析",
    ],
  },
  {
    id: "2",
    name: "DesignMuse",
    tagline: "AI 驱动的设计灵感",
    description: "DesignMuse 帮助设计师快速生成创意方案，从品牌 Logo 到 UI 界面，从配色方案到排版布局，一站式设计助手。",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=design",
    category: "creative",
    rating: 4.9,
    reviews: 1876,
    downloads: 89000,
    price: 29.99,
    isPremium: true,
    isFeatured: true,
    isInstalled: true,
    publisher: {
      name: "Creative AI Labs",
      verified: true,
    },
    features: [
      "智能配色生成",
      "Logo 设计助手",
      "UI 组件库",
      "品牌风格指南",
      "设计趋势分析",
    ],
  },
  {
    id: "3",
    name: "WriteFlow",
    tagline: "让写作变得简单",
    description: "WriteFlow 是专为作家、内容创作者打造的 AI 写作助手。支持多种文体，提供实时语法检查、风格优化、创意建议。",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=write",
    category: "writing",
    rating: 4.7,
    reviews: 3421,
    downloads: 156000,
    price: 0,
    isPremium: false,
    isFeatured: true,
    isInstalled: false,
    publisher: {
      name: "WordCraft Inc",
      verified: true,
    },
    features: [
      "多文体写作支持",
      "实时语法检查",
      "风格优化建议",
      "SEO 优化提示",
      "多语言翻译",
    ],
  },
  {
    id: "4",
    name: "DataViz Pro",
    tagline: "数据可视化大师",
    description: "轻松将复杂数据转化为精美图表，支持 20+ 图表类型，智能分析数据趋势，生成专业级可视化报告。",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=data",
    category: "business",
    rating: 4.6,
    reviews: 987,
    downloads: 45000,
    price: 49.99,
    isPremium: true,
    isFeatured: false,
    isInstalled: false,
    publisher: {
      name: "Analytics Hub",
      verified: false,
    },
  },
  {
    id: "5",
    name: "MusicAI Studio",
    tagline: "AI 音乐创作工作室",
    description: "创作专业级音乐，无需音乐理论基础。支持多种曲风，智能和弦进行，自动配器编曲。",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=music",
    category: "music",
    rating: 4.8,
    reviews: 1543,
    downloads: 67000,
    price: 39.99,
    isPremium: true,
    isFeatured: false,
    isInstalled: false,
    publisher: {
      name: "Harmony Labs",
      verified: true,
    },
  },
  {
    id: "6",
    name: "ChatGenius",
    tagline: "智能对话助手",
    description: "24/7 在线的智能助手，支持自然语言理解，情感识别，多轮对话。可用于客服、教学、陪伴等场景。",
    icon: "https://api.dicebear.com/7.x/shapes/svg?seed=chat",
    category: "chat",
    rating: 4.5,
    reviews: 5678,
    downloads: 234000,
    price: 0,
    isPremium: false,
    isFeatured: false,
    isInstalled: true,
    publisher: {
      name: "ConvoTech",
      verified: true,
    },
  },
];

const Marketplace = () => {
  const [agents] = useState<AIAgent[]>(mockAgents);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    const matchesCategory =
      selectedCategory === "all" || agent.category === selectedCategory;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredAgents = agents.filter((a) => a.isFeatured);
  const myAgents = agents.filter((a) => a.isInstalled);

  const handleTryAgent = (agent: AIAgent) => {
    toast.success(`正在启动 ${agent.name}...`);
  };

  const handleInstallAgent = (agent: AIAgent) => {
    if (agent.price > 0) {
      toast.info(`正在购买 ${agent.name}...`);
    } else {
      toast.success(`${agent.name} 安装成功！`);
    }
  };

  const handleViewDetail = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setShowDetail(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              Marketplace
            </h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <Input
              type="text"
              placeholder="搜索 AI 代理..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100/80 border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
            />
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-screen-xl mx-auto px-4 py-6">
        <Tabs defaultValue="discover" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="discover">探索</TabsTrigger>
            <TabsTrigger value="installed">我的代理</TabsTrigger>
            <TabsTrigger value="earnings">创作者中心</TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="space-y-8">
            {/* Featured Section */}
            {!searchQuery && (
              <section>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03, duration: 0.24 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <Sparkles className="text-indigo-600" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">精选推荐</h2>
                </motion.div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredAgents.map((agent, index) => (
                    <FeaturedAgentCard
                      key={agent.id}
                      agent={agent}
                      index={index * 0.015}
                      onTry={handleTryAgent}
                      onView={handleViewDetail}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Categories */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.045, duration: 0.24 }}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className={`cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      selectedCategory === category.id
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <Icon size={14} />
                    {category.name}
                  </Badge>
                );
              })}
            </motion.div>

            {/* All Agents Grid */}
            <section>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06, duration: 0.24 }}
                className="text-xl font-bold text-gray-900 mb-4"
              >
                {selectedCategory === "all"
                  ? "全部代理"
                  : categories.find((c) => c.id === selectedCategory)?.name}
              </motion.h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAgents.map((agent, index) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    index={index * 0.015}
                    onInstall={handleInstallAgent}
                    onView={handleViewDetail}
                  />
                ))}
              </div>

              {filteredAgents.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-20"
                >
                  <Sparkles size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">没有找到相关代理</p>
                  <p className="text-gray-400 text-sm mt-2">试试其他搜索词或分类</p>
                </motion.div>
              )}
            </section>
          </TabsContent>

          {/* My Agents Tab */}
          <TabsContent value="installed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {myAgents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={index * 0.015}
                  onInstall={handleInstallAgent}
                  onView={handleViewDetail}
                />
              ))}
            </div>
            {myAgents.length === 0 && (
              <div className="text-center py-20">
                <Download size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">还没有安装任何代理</p>
              </div>
            )}
          </TabsContent>

          {/* Creator Center Tab */}
          <TabsContent value="earnings">
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-8 text-center">
              <Crown size={48} className="mx-auto text-indigo-600 mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                创作者中心
              </h3>
              <p className="text-gray-600 mb-6">
                发布你的 AI 代理，赚取收益
              </p>
              <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700">
                开始创作
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Agent Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedAgent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    <img
                      src={selectedAgent.icon}
                      alt={selectedAgent.name}
                      className="w-16 h-16"
                    />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl mb-1">
                      {selectedAgent.name}
                    </DialogTitle>
                    <p className="text-gray-600 text-sm mb-2">
                      {selectedAgent.tagline}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{selectedAgent.rating}</span>
                        <span className="text-gray-500">
                          ({selectedAgent.reviews.toLocaleString()})
                        </span>
                      </div>
                      <div className="text-gray-500">
                        {(selectedAgent.downloads / 1000).toFixed(1)}K 下载
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <DialogDescription className="text-gray-700 leading-relaxed mb-6">
                {selectedAgent.description}
              </DialogDescription>

              {/* Features */}
              {selectedAgent.features && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">主要功能</h4>
                  <div className="space-y-2">
                    {selectedAgent.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check size={16} className="text-indigo-600" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Publisher */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl mb-6">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedAgent.publisher.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700">
                    {selectedAgent.publisher.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900">
                      {selectedAgent.publisher.name}
                    </p>
                    {selectedAgent.publisher.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Award size={12} className="mr-1" />
                        已认证
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">开发者</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedAgent.isInstalled ? (
                  <Button
                    onClick={() => handleTryAgent(selectedAgent)}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                  >
                    <Play size={16} className="mr-2" />
                    打开
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => handleTryAgent(selectedAgent)}
                      variant="outline"
                      className="flex-1"
                    >
                      免费试用
                    </Button>
                    <Button
                      onClick={() => handleInstallAgent(selectedAgent)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
                    >
                      {selectedAgent.price > 0
                        ? `¥${selectedAgent.price}`
                        : "免费获取"}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Featured Agent Card
interface FeaturedAgentCardProps {
  agent: AIAgent;
  index: number;
  onTry: (agent: AIAgent) => void;
  onView: (agent: AIAgent) => void;
}

const FeaturedAgentCard = ({
  agent,
  index,
  onTry,
  onView,
}: FeaturedAgentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index,
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={() => onView(agent)}
      className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white cursor-pointer shadow-lg hover:shadow-xl transition-shadow"
    >
      {agent.isPremium && (
        <Badge className="mb-3 bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
          <Crown size={12} className="mr-1" />
          Premium
        </Badge>
      )}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <img src={agent.icon} alt={agent.name} className="w-12 h-12" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold mb-1 truncate">{agent.name}</h3>
          <p className="text-white/80 text-sm line-clamp-2">{agent.tagline}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Star size={14} className="fill-white" />
            <span>{agent.rating}</span>
          </div>
          <div>{(agent.downloads / 1000).toFixed(0)}K</div>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={(e) => {
            e.stopPropagation();
            onTry(agent);
          }}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0"
        >
          {agent.isInstalled ? "打开" : "试用"}
        </Button>
      </div>
    </motion.div>
  );
};

// Regular Agent Card
interface AgentCardProps {
  agent: AIAgent;
  index: number;
  onInstall: (agent: AIAgent) => void;
  onView: (agent: AIAgent) => void;
}

const AgentCard = ({ agent, index, onInstall, onView }: AgentCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index,
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.15 } }}
      onClick={() => onView(agent)}
      className="bg-white rounded-2xl p-4 border border-gray-200 cursor-pointer hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
          <img src={agent.icon} alt={agent.name} className="w-10 h-10" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate mb-1">
            {agent.name}
          </h3>
          <p className="text-gray-600 text-xs line-clamp-2">{agent.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <Star size={12} className="fill-yellow-400 text-yellow-400" />
          <span className="font-semibold">{agent.rating}</span>
        </div>
        <span className="text-gray-400">·</span>
        <span className="text-gray-500">
          {(agent.downloads / 1000).toFixed(0)}K
        </span>
        {agent.isPremium && (
          <>
            <span className="text-gray-400">·</span>
            <Crown size={12} className="text-yellow-500" />
          </>
        )}
      </div>

      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onInstall(agent);
        }}
        className={`w-full ${
          agent.isInstalled
            ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
            : agent.price > 0
            ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        }`}
        variant={agent.isInstalled ? "secondary" : "default"}
      >
        {agent.isInstalled ? (
          <>
            <Check size={14} className="mr-1" />
            已安装
          </>
        ) : agent.price > 0 ? (
          `¥${agent.price}`
        ) : (
          "免费获取"
        )}
      </Button>
    </motion.div>
  );
};

export default Marketplace;
