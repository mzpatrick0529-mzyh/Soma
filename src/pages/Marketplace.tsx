import { useRef, useState } from "react";
import { Plus, Upload, TrendingUp, Wallet, Star, Download, DollarSign, Lock, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionPopup } from "@/components/ActionPopup";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const mockAvatars = [
  {
    id: 1,
    name: "Creative Writer AI",
    creator: "Sarah Chen",
    description: "Expert in creative writing, storytelling, and content generation",
    price: "Free",
    rating: 4.8,
    users: "12.5K",
    featured: true,
  },
  {
    id: 2,
    name: "Tech Support Pro",
    creator: "Mike Johnson",
    description: "Technical support and troubleshooting specialist",
    price: "$2.99",
    rating: 4.9,
    users: "8.3K",
  },
  {
    id: 3,
    name: "Health & Wellness Coach",
    creator: "Emma Wilson",
    description: "Personalized health advice and wellness guidance",
    price: "$4.99",
    rating: 4.7,
    users: "15.2K",
    featured: true,
  },
  {
    id: 4,
    name: "Language Tutor",
    creator: "David Kim",
    description: "Multi-language learning and practice assistant",
    price: "Free",
    rating: 4.6,
    users: "20.1K",
  },
  {
    id: 5,
    name: "Productivity Coach",
    creator: "Lisa Brown",
    description: "Time management and productivity optimization",
    price: "$1.99",
    rating: 4.8,
    users: "9.7K",
  },
  {
    id: 6,
    name: "Finance Advisor",
    creator: "James Lee",
    description: "Personal finance and investment guidance",
    price: "$5.99",
    rating: 4.9,
    users: "11.4K",
  },
];

const Marketplace = () => {
  const [showPopup, setShowPopup] = useState(false);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  const popupOptions = [
    {
      icon: <Upload className="h-5 w-5" />,
      label: "Publish AI Avatar",
      onClick: () => toast.info("Publishing coming soon"),
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: "My Spending",
      onClick: () => toast.info("Spending stats coming soon"),
    },
    {
      icon: <Wallet className="h-5 w-5" />,
      label: "My Earnings",
      onClick: () => toast.info("Earnings stats coming soon"),
    },
  ];

  return (
    <div className="pb-20 min-h-screen bg-gray-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-gray-200/50"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
            <Button
              ref={plusBtnRef}
              size="icon"
              variant="ghost"
              onClick={() => setShowPopup(true)}
              className="hover:bg-gray-100/80 transition-all duration-200"
            >
              <Plus className="h-6 w-6 text-gray-700" />
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-screen-xl mx-auto px-4 py-4"
      >
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Popular', 'Free', 'Premium', 'New'].map((category, index) => (
            <motion.button
              key={category}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 ${
                category === 'All'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <main className="max-w-screen-xl mx-auto px-4 pb-4">
        <div className="grid grid-cols-1 gap-4">
          {mockAvatars.map((avatar, index) => (
            <motion.div
              key={avatar.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="bg-white/80 backdrop-blur-sm border-0 hover:shadow-lg cursor-pointer transition-all duration-300 hover:bg-white overflow-hidden"
                onClick={() => toast.info("AI details coming soon")}
              >
                {/* Avatar Header */}
                <div className="p-4 flex items-start gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                  >
                    {avatar.name.charAt(0)}
                  </motion.div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-lg">{avatar.name}</h3>
                      <Globe size={16} className="text-green-600 flex-shrink-0" />
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">by {avatar.creator}</p>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-yellow-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-medium text-gray-700">{avatar.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Download size={14} />
                        <span className="text-sm">{avatar.users}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{avatar.description}</p>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {avatar.price === "Free" ? (
                      <span className="font-bold text-green-600">Free</span>
                    ) : (
                      <>
                        <DollarSign size={18} className="text-green-600" />
                        <span className="font-bold text-gray-900">{avatar.price.replace('$', '')}</span>
                      </>
                    )}
                  </div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors"
                  >
                    {avatar.price === "Free" ? 'Add' : 'Purchase'}
                  </motion.button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      <ActionPopup 
        isOpen={showPopup} 
        onClose={() => setShowPopup(false)} 
        options={popupOptions}
        anchorRef={plusBtnRef}
        placement="bottom-end"
        offset={{ y: 8 }}
        title="Marketplace Options"
      />
    </div>
  );
};

export default Marketplace;
