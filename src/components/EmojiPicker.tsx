/**
 * Emoji Picker - Instagram/WhatsApp style
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { modalScale, buttonPress } from "@/lib/animations";

// Emoji categories
const emojiCategories = {
  "常用": ["😀", "😂", "🥰", "😍", "🤔", "😅", "😊", "🙏", "👍", "❤️", "🔥", "✨", "🎉", "💯", "👏"],
  "表情": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑"],
  "手势": ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌"],
  "活动": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣"],
  "物品": ["💼", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️"],
  "符号": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

export function EmojiPicker({ onSelect, trigger }: EmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filteredEmojis = Object.entries(emojiCategories).reduce((acc, [category, emojis]) => {
    if (!search) return { ...acc, [category]: emojis };
    const filtered = emojis.filter(e => e.includes(search));
    if (filtered.length > 0) acc[category] = filtered;
    return acc;
  }, {} as Record<string, string[]>);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Smile className="h-5 w-5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 border-0 shadow-xl" 
        align="end"
        side="top"
      >
        <motion.div
          variants={modalScale}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden"
        >
          {/* Search */}
          <div className="p-3 border-b dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索表情..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-9 bg-gray-50 dark:bg-gray-800 border-0"
              />
            </div>
          </div>

          {/* Emoji Grid */}
          <ScrollArea className="h-72">
            <div className="p-3 space-y-4">
              {Object.entries(filteredEmojis).map(([category, emojis]) => (
                <div key={category}>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">{category}</h4>
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map((emoji, idx) => (
                      <motion.button
                        key={`${emoji}-${idx}`}
                        variants={buttonPress}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => handleSelect(emoji)}
                        className="h-10 w-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}
