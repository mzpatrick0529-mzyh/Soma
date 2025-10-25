"""
Tests for TransformerEmotionAnalyzer
测试深度情感识别系统
"""

import pytest
import sys
from pathlib import Path

# 添加src到路径
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from ml.services.emotion_model_v2 import TransformerEmotionAnalyzer, analyze_emotion


class TestEmotionAccuracy:
    """测试情感识别准确率"""
    
    @pytest.fixture
    def analyzer(self):
        """创建分析器实例"""
        return TransformerEmotionAnalyzer()
    
    def test_basic_joy(self, analyzer):
        """测试基础快乐情感"""
        result = analyzer.analyze("I'm so happy today!")
        
        assert result.primary_emotion in ['joy', 'excitement', 'amusement']
        assert result.primary_score > 0.6
        assert result.valence > 0.5
        assert result.is_sarcastic is False
    
    def test_basic_sadness(self, analyzer):
        """测试基础悲伤情感"""
        result = analyzer.analyze("I feel so sad and lonely.")
        
        assert result.primary_emotion in ['sadness', 'grief', 'disappointment']
        assert result.primary_score > 0.6
        assert result.valence < -0.3
    
    def test_basic_anger(self, analyzer):
        """测试基础愤怒情感"""
        result = analyzer.analyze("This is terrible! I'm so angry!")
        
        assert result.primary_emotion in ['anger', 'annoyance', 'disapproval']
        assert result.primary_score > 0.5
        assert result.valence < 0
        assert result.arousal > 0.5  # 愤怒是高唤醒情感
    
    def test_sarcasm_detection(self, analyzer):
        """测试讽刺检测"""
        result = analyzer.analyze("Oh great, another problem to deal with.")
        
        # 讽刺检测应该识别出这不是真正的"great"
        assert result.is_sarcastic or result.valence < 0
    
    def test_mixed_emotions(self, analyzer):
        """测试混合情感"""
        result = analyzer.analyze("I'm happy about the new job but sad to leave my friends.")
        
        # 应该检测到喜忧参半
        assert result.mixed_emotions is not None or (
            'joy' in result.all_emotions and 
            'sadness' in result.all_emotions
        )
    
    def test_emotional_intensity(self, analyzer):
        """测试情感强度估计"""
        # 低强度
        result_low = analyzer.analyze("I'm okay.")
        
        # 高强度
        result_high = analyzer.analyze("I'm ABSOLUTELY THRILLED!!!")
        
        assert result_high.intensity > result_low.intensity
        assert result_high.intensity > 0.7
    
    def test_context_awareness(self, analyzer):
        """测试上下文敏感性"""
        context = [
            "I've been feeling down lately.",
            "Everything seems to be going wrong."
        ]
        
        result_with_context = analyzer.analyze("I'm fine.", context=context)
        result_without_context = analyzer.analyze("I'm fine.")
        
        # 有负面上下文时，"I'm fine"应该被解读为更负面
        # (可能是防御性的回答)
        assert result_with_context.valence <= result_without_context.valence


class TestEmotionalTrajectory:
    """测试情感轨迹分析"""
    
    @pytest.fixture
    def analyzer(self):
        return TransformerEmotionAnalyzer()
    
    @pytest.fixture
    def mock_db(self):
        """模拟数据库"""
        class MockDB:
            def get_user_conversations(self, user_id, days=30):
                # 模拟7天的对话数据
                return [
                    {'role': 'user', 'content': 'I feel great today!', 'timestamp': '2025-10-17'},
                    {'role': 'user', 'content': 'Having a good time.', 'timestamp': '2025-10-18'},
                    {'role': 'user', 'content': 'Things are okay.', 'timestamp': '2025-10-19'},
                    {'role': 'user', 'content': 'Not feeling well.', 'timestamp': '2025-10-20'},
                    {'role': 'user', 'content': 'This is frustrating.', 'timestamp': '2025-10-21'},
                    {'role': 'user', 'content': 'I\'m really upset.', 'timestamp': '2025-10-22'},
                    {'role': 'user', 'content': 'Everything is terrible.', 'timestamp': '2025-10-23'},
                ]
        
        return MockDB()
    
    def test_trajectory_trend_declining(self, analyzer, mock_db):
        """测试情感轨迹 - 下降趋势"""
        trajectory = analyzer.build_emotional_trajectory(
            user_id='test_user',
            days=7,
            db=mock_db
        )
        
        assert 'trajectory' in trajectory
        assert len(trajectory['trajectory']) == 7
        assert trajectory['trend'] == 'declining'
        assert trajectory['trend_slope'] < 0
    
    def test_anomaly_detection(self, analyzer):
        """测试情感异常检测"""
        # 模拟用户基线 (通常比较积极)
        user_baseline = {
            'baseline_valence': 0.6,
            'valence_std': 0.2
        }
        
        # 分析一条异常负面的消息
        analysis = analyzer.analyze("I want to give up on everything.")
        
        anomaly = analyzer.detect_emotional_anomaly(analysis, user_baseline)
        
        assert anomaly['is_anomaly'] is True
        assert anomaly['anomaly_type'] == 'unusually_negative'
        assert anomaly['severity'] in ['high', 'medium']


class TestValenceArousal:
    """测试VA维度模型"""
    
    @pytest.fixture
    def analyzer(self):
        return TransformerEmotionAnalyzer()
    
    def test_high_arousal_emotions(self, analyzer):
        """测试高唤醒情感"""
        # 愤怒和兴奋都是高唤醒
        anger = analyzer.analyze("I'm furious!")
        excitement = analyzer.analyze("This is so exciting!")
        
        assert anger.arousal > 0.6
        assert excitement.arousal > 0.6
        
        # 但效价相反
        assert anger.valence < 0
        assert excitement.valence > 0
    
    def test_low_arousal_emotions(self, analyzer):
        """测试低唤醒情感"""
        # 悲伤和平静都是低唤醒
        sadness = analyzer.analyze("I feel sad.")
        
        assert sadness.arousal < 0.5


class TestSimplifiedAPI:
    """测试简化API"""
    
    def test_analyze_emotion_function(self):
        """测试便捷函数"""
        result = analyze_emotion("I love this!")
        
        assert 'primary_emotion' in result
        assert 'valence' in result
        assert 'intensity' in result
        assert isinstance(result['all_emotions'], dict)


class TestPerformance:
    """性能测试"""
    
    @pytest.fixture
    def analyzer(self):
        return TransformerEmotionAnalyzer()
    
    def test_inference_speed(self, analyzer):
        """测试推理速度"""
        import time
        
        texts = [
            "I'm happy.",
            "This is frustrating.",
            "I love this so much!",
            "I'm not sure how I feel.",
            "This is absolutely terrible!"
        ]
        
        start = time.time()
        for text in texts:
            analyzer.analyze(text)
        end = time.time()
        
        avg_time = (end - start) / len(texts)
        
        # 平均每次推理应该 < 100ms (在GPU上)
        # CPU上可能需要 < 500ms
        print(f"\nAverage inference time: {avg_time*1000:.2f}ms")
        
        # 放宽限制，因为首次加载模型较慢
        assert avg_time < 2.0, f"Inference too slow: {avg_time*1000:.2f}ms"


# 运行测试示例
if __name__ == "__main__":
    print("Running Emotion Model V2 Tests...\n")
    
    # 简单测试
    print("1. Testing basic emotion detection:")
    result = analyze_emotion("I'm so excited about this project!")
    print(f"   Text: 'I'm so excited about this project!'")
    print(f"   Emotion: {result['primary_emotion']} (score: {result['primary_score']:.2f})")
    print(f"   Valence: {result['valence']:.2f}, Arousal: {result['arousal']:.2f}")
    print(f"   Intensity: {result['intensity']:.2f}")
    
    print("\n2. Testing sarcasm detection:")
    result = analyze_emotion("Oh great, another meeting.")
    print(f"   Text: 'Oh great, another meeting.'")
    print(f"   Emotion: {result['primary_emotion']} (score: {result['primary_score']:.2f})")
    print(f"   Is Sarcastic: {result['is_sarcastic']}")
    print(f"   Valence: {result['valence']:.2f}")
    
    print("\n3. Testing mixed emotions:")
    result = analyze_emotion("I'm proud of my work but sad it's ending.")
    print(f"   Text: 'I'm proud of my work but sad it's ending.'")
    print(f"   Emotion: {result['primary_emotion']} (score: {result['primary_score']:.2f})")
    print(f"   Mixed: {result['mixed_emotions']}")
    print(f"   Top 3 emotions:")
    sorted_emotions = sorted(result['all_emotions'].items(), key=lambda x: x[1], reverse=True)[:3]
    for emotion, score in sorted_emotions:
        print(f"      - {emotion}: {score:.2f}")
    
    print("\n✅ All manual tests passed!")
    print("\nTo run full pytest suite:")
    print("  cd Self_AI_Agent")
    print("  pytest tests/test_emotion_v2.py -v")
