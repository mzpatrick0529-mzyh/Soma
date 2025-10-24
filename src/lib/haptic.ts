/**
 * Haptic feedback utility class
 * Supports different intensities and types of tactile feedback
 */

export type HapticType = 
  | "light"      // Light feedback - button click
  | "medium"     // Medium feedback - notification alert  
  | "heavy"      // Heavy feedback - error warning
  | "success"    // Success feedback - operation completed
  | "warning"    // 警告反馈 - 注意事项
  | "error"      // 错误反馈 - 操作失败
  | "selection"  // 选择反馈 - 选项切换
  | "impact";    // 冲击反馈 - 重要操作

class HapticManager {
  private isSupported: boolean = false;
  private isEnabled: boolean = true;

  constructor() {
    this.checkSupport();
    this.loadSettings();
  }

  /**
   * 检测设备是否支持触感反馈
   */
  private checkSupport(): void {
    const hasWindow = typeof window !== 'undefined';
    const hasNavigator = typeof navigator !== 'undefined';

    this.isSupported = 
      (hasNavigator && 'vibrate' in navigator) || 
      (hasWindow && 'navigator' in window && hasNavigator && 'vibrate' in navigator) ||
      (hasWindow && 'hapticFeedback' in (window as any)) ||
      (hasNavigator && /iPhone|iPad|iPod/.test(navigator.userAgent));
  }

  /**
   * 从本地存储加载用户设置
   */
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('haptic-enabled');
      this.isEnabled = saved !== null ? JSON.parse(saved) : true;
    } catch {
      this.isEnabled = true;
    }
  }

  /**
   * Save用户设置到本地存储
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('haptic-enabled', JSON.stringify(enabled));
    } catch {
      // 忽略存储错误
    }
  }

  /**
   * 获取当前启用状态
   */
  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * 检查是否支持触感反馈
   */
  public getSupported(): boolean {
    return this.isSupported;
  }

  /**
   * 触发触感反馈
   */
  public trigger(type: HapticType = "light"): void {
    if (!this.isSupported || !this.isEnabled) return;

    try {
      // iOS Safari 支持
      if ('webkitTapHighlightColor' in document.documentElement.style) {
        this.triggerIOSHaptic(type);
        return;
      }

      // Android Chrome 支持
      if ('vibrate' in navigator) {
        this.triggerVibration(type);
        return;
      }

      // Web Vibration API 后备
      this.triggerWebVibration(type);
    } catch (error) {
      // 静默处理错误
      console.debug('Haptic feedback failed:', error);
    }
  }

  /**
   * iOS 设备触感反馈
   */
  private triggerIOSHaptic(type: HapticType): void {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 50, 10],
      warning: [15, 100, 15],
      error: [20, 150, 20, 150, 20],
      selection: [5],
      impact: [25, 100, 25],
    };

    const pattern = patterns[type];
    if (pattern && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Android 设备触感反馈
   */
  private triggerVibration(type: HapticType): void {
    const patterns = {
      light: [5],
      medium: [10],
      heavy: [15],
      success: [5, 30, 5],
      warning: [10, 50, 10],
      error: [15, 100, 15, 100, 15],
      selection: [3],
      impact: [20, 80, 20],
    };

    const pattern = patterns[type];
    if (pattern && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Web Vibration API 触感反馈
   */
  private triggerWebVibration(type: HapticType): void {
    const durations = {
      light: 10,
      medium: 20,
      heavy: 30,
      success: 15,
      warning: 25,
      error: 40,
      selection: 5,
      impact: 35,
    };

    const duration = durations[type];
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  /**
   * 快捷方法：轻度反馈
   */
  public light(): void {
    this.trigger("light");
  }

  /**
   * 快捷方法：中度反馈
   */
  public medium(): void {
    this.trigger("medium");
  }

  /**
   * 快捷方法：重度反馈
   */
  public heavy(): void {
    this.trigger("heavy");
  }

  /**
   * 快捷方法：成功反馈
   */
  public success(): void {
    this.trigger("success");
  }

  /**
   * 快捷方法：错误反馈
   */
  public error(): void {
    this.trigger("error");
  }

  /**
   * 快捷方法：选择反馈
   */
  public selection(): void {
    this.trigger("selection");
  }
}

// 创建全局单例
export const haptic = new HapticManager();

// 导出类型and工具函数
export { HapticManager };

/**
 * React Hook for haptic feedback
 */
export const useHaptic = () => {
  return {
    trigger: haptic.trigger.bind(haptic),
    light: haptic.light.bind(haptic),
    medium: haptic.medium.bind(haptic),
    heavy: haptic.heavy.bind(haptic),
    success: haptic.success.bind(haptic),
    error: haptic.error.bind(haptic),
    selection: haptic.selection.bind(haptic),
    isSupported: haptic.getSupported(),
    isEnabled: haptic.getEnabled(),
    setEnabled: haptic.setEnabled.bind(haptic),
  };
};