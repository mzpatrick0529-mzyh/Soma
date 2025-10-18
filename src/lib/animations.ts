/**
 * 🎬 Soma Animation System
 * 统一的动画语言，流畅的过渡效果，独特的视觉体验
 */
import type { Variants, Transition } from "framer-motion";
import { designTokens } from "./design-system";

// ===== Soma 核心过渡效果 =====

// Soma Spring - 主要的弹性动画
export const somaSpring: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};

// Soma Bounce - 回弹效果
export const somaBounce: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 20,
  mass: 0.5,
};

// Soma Smooth - 平滑过渡
export const somaSmooth: Transition = {
  type: "tween",
  duration: 0.25,
  ease: [0.45, 0, 0.15, 1],
};

// Soma Fast - 快速响应
export const somaFast: Transition = {
  type: "tween",
  duration: 0.15,
  ease: [0.4, 0, 0.2, 1],
};

// ===== 页面级别动画 =====

// 页面滑入 - 用于所有页面切换
export const pageSlideIn: Variants = {
  hidden: { 
    y: "100%", 
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: somaSpring,
  },
  exit: {
    y: "-10%",
    opacity: 0,
    scale: 0.98,
    transition: somaFast,
  },
};

// 页面渐显 - 用于顶层页面
export const pageFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ===== 卡片动画 =====

// 卡片悬停 - 统一的悬停效果
export const cardHover: Variants = {
  initial: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: somaSpring,
  },
  tap: {
    scale: 0.98,
    transition: somaFast,
  },
};

// 卡片出现 - 统一的入场动画
export const cardAppear: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: somaSpring,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: somaFast,
  },
};

// ===== 列表动画 =====

// 列表项 - 错落入场
export const listItem: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      ...somaSpring,
    },
  }),
};

// 列表容器 - 统一的错落效果
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// ===== 模态框/底部抽屉动画 =====

// 遮罩层 - 统一的渐显
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, delay: 0.1 },
  },
};

// 底部滑入 - 主要的模态框动画（如 ChatConversation）
export const modalSlideUp: Variants = {
  hidden: { 
    y: "100%", 
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 300,
    },
  },
  exit: {
    y: "100%",
    opacity: 0,
    scale: 0.95,
    transition: somaFast,
  },
};

// 中心缩放 - 对话框等元素
export const modalScale: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: somaSpring,
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: somaFast,
  },
};

// ===== 消息气泡动画 =====

// 消息气泡弹出
export const messageBubble: Variants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: somaBounce,
  },
};

// 输入中指示器
export const typingIndicator: Variants = {
  initial: { opacity: 0, y: 5 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};

// ===== 按钮/图标动画 =====

// 按钮按压
export const buttonPress: Variants = {
  initial: { scale: 1 },
  tap: {
    scale: 0.95,
    transition: somaFast,
  },
  hover: {
    scale: 1.05,
    transition: somaSpring,
  },
};

// 图标旋转
export const iconRotate: Variants = {
  initial: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      duration: 0.6,
      ease: "linear",
      repeat: Infinity,
    },
  },
};

// 图标弹跳
export const iconBounce: Variants = {
  initial: { y: 0 },
  animate: {
    y: [-2, 2, -2],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ===== Notification/Toast Animations =====
export const notificationSlideIn: Variants = {
  hidden: { x: 400, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ===== Page Transitions =====
export const pageSlide: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    x: "-100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

export const pageFade: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// ===== Skeleton Loading =====
export const skeletonPulse: Variants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ===== Floating Action Button =====
export const fabScale: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 90,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.9,
    transition: { duration: 0.1 },
  },
};

// ===== Media Preview Animations =====
export const imageZoom: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.3 },
  },
};

export const videoOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
};

// ===== Swipe Gestures =====
export const swipeToDelete: Variants = {
  initial: { x: 0 },
  swipeLeft: {
    x: -100,
    transition: { duration: 0.2 },
  },
  swipeRight: {
    x: 100,
    transition: { duration: 0.2 },
  },
};

// ===== Like/Heart Animation (Instagram-style) =====
export const heartBurst: Variants = {
  initial: { scale: 0 },
  animate: {
    scale: [0, 1.2, 1],
    transition: {
      duration: 0.4,
      times: [0, 0.6, 1],
      ease: "easeOut",
    },
  },
};
