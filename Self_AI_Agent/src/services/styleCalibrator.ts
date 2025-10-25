/**
 * Phase 3.5: Style Calibrator
 * 实时校准生成文本的风格特征,确保风格一致性
 */

export interface StyleFeatures {
  emojiCount: number;
  punctuationDensity: number;
  averageLength: number;
  slangCount: number;
  formalityScore: number;
}

export interface StyleCalibrationResult {
  isConsistent: boolean;
  deviations: string[];
  calibratedText?: string;
}

export class StyleCalibrator {
  /**
   * 校准生成的文本使其符合目标风格
   */
  calibrateStyle(
    generatedText: string,
    targetStyle: StyleFeatures
  ): StyleCalibrationResult {
    const currentStyle = this.extractStyleFeatures(generatedText);
    const deviations = this.detectDeviations(currentStyle, targetStyle);
    
    if (deviations.length === 0) {
      return { isConsistent: true, deviations: [] };
    }
    
    const calibratedText = this.applyCalibration(generatedText, currentStyle, targetStyle);
    
    return {
      isConsistent: false,
      deviations,
      calibratedText,
    };
  }

  /**
   * 从文本中提取风格特征
   */
  extractStyleFeatures(text: string): StyleFeatures {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojiCount = (text.match(emojiRegex) || []).length;
    
    const punctuationRegex = /[!?。!?]/g;
    const punctuationCount = (text.match(punctuationRegex) || []).length;
    const punctuationDensity = text.length > 0 ? punctuationCount / text.length : 0;
    
    const averageLength = text.length;
    
    const slangKeywords = ['lol', 'omg', 'btw', 'imo', 'tbh', '哈哈', '嘿嘿', '嗯嗯'];
    let slangCount = 0;
    const lowerText = text.toLowerCase();
    for (const slang of slangKeywords) {
      if (lowerText.includes(slang)) slangCount++;
    }
    
    const formalityScore = this.calculateFormality(text);
    
    return {
      emojiCount,
      punctuationDensity,
      averageLength,
      slangCount,
      formalityScore,
    };
  }

  /**
   * 检测风格偏差
   */
  private detectDeviations(
    current: StyleFeatures,
    target: StyleFeatures
  ): string[] {
    const deviations: string[] = [];
    const tolerance = 0.3;
    
    if (Math.abs(current.emojiCount - target.emojiCount) > 2) {
      deviations.push(`emoji数量偏差: 当前${current.emojiCount}, 目标${target.emojiCount}`);
    }
    
    if (Math.abs(current.punctuationDensity - target.punctuationDensity) > tolerance) {
      deviations.push(`标点密度偏差: 当前${current.punctuationDensity.toFixed(2)}, 目标${target.punctuationDensity.toFixed(2)}`);
    }
    
    if (Math.abs(current.averageLength - target.averageLength) / target.averageLength > tolerance) {
      deviations.push(`长度偏差: 当前${current.averageLength}, 目标${target.averageLength}`);
    }
    
    if (Math.abs(current.formalityScore - target.formalityScore) > tolerance) {
      deviations.push(`正式度偏差: 当前${current.formalityScore.toFixed(2)}, 目标${target.formalityScore.toFixed(2)}`);
    }
    
    return deviations;
  }

  /**
   * 应用校准调整
   */
  private applyCalibration(
    text: string,
    current: StyleFeatures,
    target: StyleFeatures
  ): string {
    let calibrated = text;
    
    // 调整emoji
    if (current.emojiCount < target.emojiCount - 1) {
      calibrated = this.addEmojis(calibrated, target.emojiCount - current.emojiCount);
    } else if (current.emojiCount > target.emojiCount + 1) {
      calibrated = this.removeEmojis(calibrated, current.emojiCount - target.emojiCount);
    }
    
    // 调整长度
    if (current.averageLength < target.averageLength * 0.7) {
      calibrated = this.expandText(calibrated);
    } else if (current.averageLength > target.averageLength * 1.3) {
      calibrated = this.condenseText(calibrated);
    }
    
    // 调整正式度
    if (current.formalityScore < target.formalityScore - 0.2) {
      calibrated = this.increaseFormality(calibrated);
    } else if (current.formalityScore > target.formalityScore + 0.2) {
      calibrated = this.decreaseFormality(calibrated);
    }
    
    return calibrated;
  }

  private calculateFormality(text: string): number {
    const formalIndicators = ['please', 'kindly', 'would', 'could', '请', '您', '感谢'];
    const casualIndicators = ['yeah', 'nope', 'gonna', 'wanna', '嗯', '哦', '啊'];
    
    const lowerText = text.toLowerCase();
    let formalCount = 0;
    let casualCount = 0;
    
    for (const indicator of formalIndicators) {
      if (lowerText.includes(indicator)) formalCount++;
    }
    
    for (const indicator of casualIndicators) {
      if (lowerText.includes(indicator)) casualCount++;
    }
    
    if (formalCount + casualCount === 0) return 0.5;
    return formalCount / (formalCount + casualCount);
  }

  private addEmojis(text: string, count: number): string {
    const commonEmojis = ['😊', '👍', '😄', '🙂', '✨'];
    let result = text;
    for (let i = 0; i < count && i < commonEmojis.length; i++) {
      result += ' ' + commonEmojis[i];
    }
    return result;
  }

  private removeEmojis(text: string, count: number): string {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojis = text.match(emojiRegex) || [];
    let result = text;
    for (let i = 0; i < count && i < emojis.length; i++) {
      result = result.replace(emojis[emojis.length - 1 - i], '');
    }
    return result.trim();
  }

  private expandText(text: string): string {
    return text + ' (more details would be helpful here)';
  }

  private condenseText(text: string): string {
    const sentences = text.split(/[.!?。!?]/);
    return sentences.slice(0, Math.ceil(sentences.length * 0.7)).join('. ') + '.';
  }

  private increaseFormality(text: string): string {
    return text
      .replace(/yeah/gi, 'yes')
      .replace(/nope/gi, 'no')
      .replace(/gonna/gi, 'going to')
      .replace(/wanna/gi, 'want to');
  }

  private decreaseFormality(text: string): string {
    return text
      .replace(/yes,/gi, 'yeah,')
      .replace(/no,/gi, 'nope,')
      .replace(/going to/gi, 'gonna')
      .replace(/want to/gi, 'wanna');
  }
}
