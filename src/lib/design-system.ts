/**
 * 🎨 Soma Design System
 * A unified, elegant design language with distinctive aesthetics
 * 统一的视觉风格，流畅的动画体验，独特的品牌审美
 */

export const designTokens = {
  // Soma Brand Identity - 优雅的紫蓝渐变品牌色
  colors: {
    // 主品牌色系
    brand: {
      primary: '#6366F1',      // Indigo 500 - 主色调
      secondary: '#8B5CF6',    // Violet 500 - 辅助色
      accent: '#EC4899',       // Pink 500 - 强调色
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
      gradientReverse: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 50%, #6366F1 100%)',
      gradientSubtle: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
    },
    
    // 功能语义色
    semantic: {
      success: '#10B981',      // Emerald 500
      warning: '#F59E0B',      // Amber 500
      error: '#EF4444',        // Red 500
      info: '#3B82F6',         // Blue 500
    },
    
    // 专业渐变色板
    gradients: {
      primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
      secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      success: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
      sunset: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
      ocean: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
      aurora: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
    },
    
    // 精心调校的中性色板
    neutral: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0A0A0A',
    },
    
    // 深色模式 - 高对比度设计
    dark: {
      bg: '#0A0A0A',           // 深黑背景
      surface: '#1C1C1E',      // 卡片表面
      surfaceElevated: '#2C2C2E', // 悬浮元素
      text: '#FFFFFF',         // 主文字
      textSecondary: '#A1A1AA', // 次要文字
      textTertiary: '#71717A', // 三级文字
      border: '#27272A',       // 边框
      borderSubtle: '#18181B', // 细边框
    },
    
    // 浅色模式
    light: {
      bg: '#FFFFFF',
      surface: '#F9FAFB',
      surfaceElevated: '#FFFFFF',
      text: '#18181B',
      textSecondary: '#52525B',
      textTertiary: '#A1A1AA',
      border: '#E4E4E7',
      borderSubtle: '#F4F4F5',
    },
  },
  
  // 8pt Grid Spacing System - 统一的间距系统
  spacing: {
    0: '0px',
    1: '4px',    // 0.25rem
    2: '8px',    // 0.5rem
    3: '12px',   // 0.75rem
    4: '16px',   // 1rem
    5: '20px',   // 1.25rem
    6: '24px',   // 1.5rem
    8: '32px',   // 2rem
    10: '40px',  // 2.5rem
    12: '48px',  // 3rem
    16: '64px',  // 4rem
    20: '80px',  // 5rem
    24: '96px',  // 6rem
  },
  
  // Typography System - 优雅的字体系统
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: '"SF Mono", "JetBrains Mono", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2,
    },
  },
  
  // Border Radius - 统一的圆角系统
  radius: {
    none: '0',
    sm: '0.375rem',   // 6px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },
  
  // Shadow System - 精心调校的阴影
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: '0 0 20px rgba(99, 102, 241, 0.4)',
    glowStrong: '0 0 30px rgba(99, 102, 241, 0.6)',
  },
  
  // Z-index Layers - 清晰的层级系统
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },
  
  // Animation Durations - 流畅的时间系统
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
    slowest: '750ms',
  },
  
  // Animation Easing - 专业的缓动曲线
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    // Soma 独特缓动曲线
    somaSpring: 'cubic-bezier(0.16, 1, 0.3, 1)',     // 弹性出场
    somaBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // 回弹效果
    somaSmooth: 'cubic-bezier(0.45, 0, 0.15, 1)',    // 平滑过渡
  },
  
  // Breakpoints - 响应式断点
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// 工具函数
export const getColorWithOpacity = (color: string, opacity: number) => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

export const getGradientStyle = (gradientKey: keyof typeof designTokens.colors.gradients) => {
  return { background: designTokens.colors.gradients[gradientKey] };
};

// 导出类型定义
export type DesignTokens = typeof designTokens;
