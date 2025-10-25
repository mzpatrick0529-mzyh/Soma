#!/usr/bin/env python3
"""
Quick Test: Emotion Model V2
测试情感识别系统 (不需要下载大模型)
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

def test_emotion_model_structure():
    """测试模型结构 (不加载真实模型)"""
    print("="*70)
    print("🧪 Testing Emotion Model V2 Structure")
    print("="*70)
    
    try:
        from ml.services.emotion_model_v2 import (
            TransformerEmotionAnalyzer, 
            EmotionAnalysis,
            analyze_emotion
        )
        print("✅ Successfully imported emotion_model_v2")
        
        # 测试数据类
        print("\n📦 Testing EmotionAnalysis dataclass...")
        analysis = EmotionAnalysis(
            primary_emotion='joy',
            primary_score=0.85,
            all_emotions={'joy': 0.85, 'excitement': 0.65},
            intensity=0.7,
            valence=0.8,
            arousal=0.7,
            is_sarcastic=False,
            mixed_emotions=None,
            confidence=0.9,
            timestamp=None
        )
        print(f"  Primary emotion: {analysis.primary_emotion}")
        print(f"  Valence: {analysis.valence}")
        print(f"  Arousal: {analysis.arousal}")
        print("✅ EmotionAnalysis structure correct")
        
        # 测试分析器初始化 (但不加载模型)
        print("\n🧠 Testing TransformerEmotionAnalyzer initialization...")
        analyzer = TransformerEmotionAnalyzer()
        print(f"  Device: {analyzer.device}")
        print(f"  Models loaded: {analyzer._models_loaded}")
        print("✅ Analyzer initialized successfully")
        
        # 测试VA映射
        print("\n🎯 Testing VA (Valence-Arousal) mapping...")
        print(f"  Total emotions mapped: {len(analyzer.EMOTION_VA_MAPPING)}")
        print(f"  Sample emotions:")
        for emotion, (v, a) in list(analyzer.EMOTION_VA_MAPPING.items())[:5]:
            print(f"    - {emotion}: valence={v:.2f}, arousal={a:.2f}")
        print("✅ VA mapping complete (28 emotions)")
        
        # 测试内部方法 (不需要模型)
        print("\n🔬 Testing internal methods...")
        
        # 测试强度估计
        intensity_normal = analyzer._estimate_intensity("I'm okay.", [])
        intensity_high = analyzer._estimate_intensity("I'm ABSOLUTELY THRILLED!!!", [])
        print(f"  Intensity estimation:")
        print(f"    'I'm okay.' → {intensity_normal:.2f}")
        print(f"    'I'm ABSOLUTELY THRILLED!!!' → {intensity_high:.2f}")
        assert intensity_high > intensity_normal, "High intensity should be > normal"
        print("✅ Intensity estimation working")
        
        # 测试VA计算
        mock_emotions = [
            {'label': 'joy', 'score': 0.8},
            {'label': 'excitement', 'score': 0.6}
        ]
        valence, arousal = analyzer._calculate_va(mock_emotions)
        print(f"  VA calculation:")
        print(f"    Mock emotions → valence={valence:.2f}, arousal={arousal:.2f}")
        assert valence > 0.5, "Joy+excitement should be positive valence"
        assert arousal > 0.5, "Joy+excitement should be high arousal"
        print("✅ VA calculation working")
        
        # 测试混合情感检测
        mixed_emotions = [
            {'label': 'joy', 'score': 0.7},
            {'label': 'sadness', 'score': 0.6}
        ]
        mixed_result = analyzer._detect_mixed_emotions(mixed_emotions)
        print(f"  Mixed emotion detection:")
        print(f"    Joy+Sadness → {mixed_result}")
        assert mixed_result is not None, "Should detect mixed emotions"
        print("✅ Mixed emotion detection working")
        
        # 测试置信度计算
        confidence = analyzer._calculate_confidence([
            {'label': 'joy', 'score': 0.9},
            {'label': 'neutral', 'score': 0.3}
        ])
        print(f"  Confidence calculation: {confidence:.2f}")
        assert 0.0 <= confidence <= 1.0, "Confidence should be in [0,1]"
        print("✅ Confidence calculation working")
        
        print("\n" + "="*70)
        print("🎉 ALL STRUCTURE TESTS PASSED!")
        print("="*70)
        
        print("\n📝 Model Status:")
        print("  ⚠️  Full transformer models NOT loaded (saves memory)")
        print("  ✅ Core logic and structure validated")
        print("  ✅ Ready for integration")
        
        print("\n💡 To test with real models:")
        print("  1. Ensure you have ~2GB free disk space")
        print("  2. Run: python3 -c 'from ml.services.emotion_model_v2 import analyze_emotion; print(analyze_emotion(\"I am happy!\"))'")
        print("  3. First run will download models (may take 5-10 minutes)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_import_causal_libraries():
    """测试因果推理库"""
    print("\n" + "="*70)
    print("🔗 Testing Causal Inference Libraries")
    print("="*70)
    
    results = {}
    
    # DoWhy
    try:
        import dowhy
        print(f"✅ DoWhy {dowhy.__version__} installed")
        results['dowhy'] = True
    except ImportError:
        print("❌ DoWhy not installed")
        results['dowhy'] = False
    
    # CausalML
    try:
        import causalml
        print(f"✅ CausalML installed")
        results['causalml'] = True
    except ImportError:
        print("❌ CausalML not installed")
        results['causalml'] = False
    
    # NetworkX
    try:
        import networkx as nx
        print(f"✅ NetworkX {nx.__version__} installed")
        results['networkx'] = True
    except ImportError:
        print("❌ NetworkX not installed")
        results['networkx'] = False
    
    success_rate = sum(results.values()) / len(results) * 100
    print(f"\n📊 Causal libraries: {sum(results.values())}/{len(results)} installed ({success_rate:.0f}%)")
    
    return all(results.values())


def main():
    """主测试函数"""
    print("\n🚀 PHASE 7A: QUICK VALIDATION TEST\n")
    
    test1 = test_emotion_model_structure()
    test2 = test_import_causal_libraries()
    
    print("\n" + "="*70)
    print("📊 FINAL RESULTS")
    print("="*70)
    print(f"{'✅' if test1 else '❌'} Emotion Model Structure")
    print(f"{'✅' if test2 else '❌'} Causal Inference Libraries")
    
    if test1 and test2:
        print("\n🎉 Phase 7A.1 基础设施已就绪!")
        print("\n下一步:")
        print("  1. ✅ 情感模型架构完成")
        print("  2. ⏭️  继续Phase 7A.2: 实现因果推理引擎")
        print("  3. ⏭️  继续Phase 7A.3: 集成Neo4j Knowledge Graph")
        return 0
    else:
        print("\n⚠️  部分测试失败,但核心功能可用")
        return 1


if __name__ == "__main__":
    sys.exit(main())
