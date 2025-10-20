"""
人格特征提取器
从用户对话和行为数据中提取多维度人格特征
"""

import json
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import numpy as np

# 第三方库（需要安装）
try:
    import spacy
    from textblob import TextBlob
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
except ImportError:
    print("Warning: Some NLP libraries not installed. Install with:")
    print("pip install spacy textblob nltk")
    print("python -m spacy download en_core_web_sm")


class PersonalityFeatureExtractor:
    """人格特征提取器主类"""
    
    def __init__(self):
        """初始化 NLP 模型和工具"""
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("Warning: spaCy model not loaded")
            self.nlp = None
        
        try:
            nltk.download('vader_lexicon', quiet=True)
            self.sentiment_analyzer = SentimentIntensityAnalyzer()
        except:
            print("Warning: NLTK VADER not loaded")
            self.sentiment_analyzer = None
    
    def extract_all_features(
        self, 
        conversations: List[Dict[str, Any]],
        user_id: str
    ) -> Dict[str, Any]:
        """
        提取所有人格特征
        
        Args:
            conversations: 对话列表，每个对话包含 message, sender, timestamp 等
            user_id: 用户ID
            
        Returns:
            完整的人格特征字典
        """
        # 过滤出用户自己发送的消息
        user_messages = [
            conv for conv in conversations 
            if conv.get('sender') == user_id or conv.get('is_user_message', False)
        ]
        
        if len(user_messages) < 10:
            raise ValueError(f"Insufficient data: only {len(user_messages)} messages found")
        
        features = {
            'linguistic': self.extract_linguistic_features(user_messages),
            'emotional': self.extract_emotional_features(user_messages),
            'cognitive': self.infer_cognitive_style(user_messages),
            'social': self.extract_social_patterns(conversations, user_id),
            'behavioral': self.extract_behavioral_patterns(user_messages),
            'values': self.infer_value_system(user_messages),
            'metadata': {
                'total_messages_analyzed': len(user_messages),
                'date_range': {
                    'start': min(m.get('timestamp', datetime.now()) for m in user_messages).isoformat(),
                    'end': max(m.get('timestamp', datetime.now()) for m in user_messages).isoformat()
                },
                'extraction_timestamp': datetime.now().isoformat()
            }
        }
        
        return features
    
    def extract_linguistic_features(self, messages: List[Dict]) -> Dict[str, Any]:
        """提取语言风格特征"""
        texts = [m.get('content', '') for m in messages if m.get('content')]
        
        if not texts:
            return self._default_linguistic_features()
        
        # 基础统计
        word_counts = [len(text.split()) for text in texts]
        char_counts = [len(text) for text in texts]
        
        # 词汇复杂度（平均词长）
        all_words = ' '.join(texts).split()
        avg_word_length = np.mean([len(w) for w in all_words]) if all_words else 5.0
        vocab_complexity = min(avg_word_length / 10.0, 1.0)  # 归一化到 [0, 1]
        
        # 句长偏好
        avg_sentence_length = np.mean(word_counts) if word_counts else 10.0
        
        # 正式程度（基于标点、缩写、大写等）
        formality_level = self._compute_formality(texts)
        
        # 表情符号使用率
        emoji_pattern = re.compile(
            "["
            "\U0001F600-\U0001F64F"  # 表情符号
            "\U0001F300-\U0001F5FF"  # 符号和图标
            "\U0001F680-\U0001F6FF"  # 交通和地图
            "\U0001F700-\U0001F77F"  # 炼金术符号
            "\U0001F780-\U0001F7FF"  # 几何形状
            "\U0001F800-\U0001F8FF"  # 箭头
            "\U0001F900-\U0001F9FF"  # 补充符号
            "\U0001FA00-\U0001FA6F"  # 扩展A
            "\U0001FA70-\U0001FAFF"  # 扩展B
            "\U00002702-\U000027B0"
            "\U000024C2-\U0001F251"
            "]+"
        )
        emoji_count = sum(len(emoji_pattern.findall(text)) for text in texts)
        total_chars = sum(char_counts)
        emoji_usage_rate = emoji_count / max(len(texts), 1) if total_chars > 0 else 0.0
        
        # 口头禅检测（高频短语）
        catchphrases = self._detect_catchphrases(texts)
        
        # 标点使用习惯
        punctuation_style = self._analyze_punctuation(texts)
        
        # 幽默频率（基于关键词和表情）
        humor_frequency = self._estimate_humor_frequency(texts)
        
        return {
            'vocabulary_complexity': float(vocab_complexity),
            'sentence_length_preference': float(avg_sentence_length),
            'formality_level': float(formality_level),
            'humor_frequency': float(humor_frequency),
            'emoji_usage_rate': float(emoji_usage_rate),
            'catchphrases': catchphrases[:10],  # 前10个
            'punctuation_style': punctuation_style,
            'common_words': self._get_common_words(all_words)[:20]
        }
    
    def extract_emotional_features(self, messages: List[Dict]) -> Dict[str, Any]:
        """提取情感模式特征"""
        texts = [m.get('content', '') for m in messages if m.get('content')]
        
        if not texts or not self.sentiment_analyzer:
            return self._default_emotional_features()
        
        # 情感分析
        sentiments = []
        for text in texts:
            scores = self.sentiment_analyzer.polarity_scores(text)
            sentiments.append(scores['compound'])  # -1 to 1
        
        # 基线情绪
        baseline_sentiment = float(np.mean(sentiments)) if sentiments else 0.0
        
        # 情绪波动性（标准差）
        emotional_volatility = float(np.std(sentiments)) if len(sentiments) > 1 else 0.3
        
        # 情绪分布
        emotion_counts = Counter()
        for score in sentiments:
            if score > 0.5:
                emotion_counts['joy'] += 1
            elif score < -0.5:
                emotion_counts['sadness'] += 1
            elif -0.1 <= score <= 0.1:
                emotion_counts['neutral'] += 1
        
        total = len(sentiments)
        emotion_distribution = {
            emotion: count / total if total > 0 else 0.0
            for emotion, count in emotion_counts.items()
        }
        
        # 填充缺失的情绪
        for emotion in ['joy', 'sadness', 'anger', 'fear', 'surprise', 'neutral']:
            if emotion not in emotion_distribution:
                emotion_distribution[emotion] = 0.0
        
        # 乐观度（正面情绪占比）
        optimism_score = emotion_distribution.get('joy', 0.0) + 0.5 * emotion_distribution.get('neutral', 0.0)
        
        # 共情能力（基于关键词和表达方式）
        empathy_level = self._estimate_empathy(texts)
        
        return {
            'baseline_sentiment': baseline_sentiment,
            'emotional_volatility': min(emotional_volatility, 1.0),
            'empathy_level': empathy_level,
            'optimism_score': optimism_score,
            'anxiety_tendency': 0.3,  # TODO: 基于关键词检测
            'anger_threshold': 0.7,
            'emotion_expression_style': 'mixed',
            'emotion_distribution': emotion_distribution
        }
    
    def infer_cognitive_style(self, messages: List[Dict]) -> Dict[str, Any]:
        """推断认知风格"""
        texts = [m.get('content', '') for m in messages if m.get('content')]
        
        if not texts:
            return self._default_cognitive_features()
        
        # 分析型 vs 直觉型（基于逻辑词汇）
        analytical_keywords = [
            'because', 'therefore', 'thus', 'hence', 'consequently',
            'analysis', 'logic', 'reason', 'evidence', 'data', 'fact'
        ]
        intuitive_keywords = [
            'feel', 'sense', 'intuition', 'seems', 'guess',
            'maybe', 'perhaps', 'probably', 'might'
        ]
        
        text_lower = ' '.join(texts).lower()
        analytical_count = sum(text_lower.count(kw) for kw in analytical_keywords)
        intuitive_count = sum(text_lower.count(kw) for kw in intuitive_keywords)
        
        total_cognitive = analytical_count + intuitive_count
        analytical_vs_intuitive = (
            (analytical_count - intuitive_count) / total_cognitive
            if total_cognitive > 0 else 0.0
        )
        
        # 细节导向（短句、具体描述的比例）
        detail_oriented = self._estimate_detail_orientation(texts)
        
        # 决策速度（基于响应时间，如果有时间戳）
        decision_speed = self._estimate_decision_speed(messages)
        
        return {
            'analytical_vs_intuitive': float(np.clip(analytical_vs_intuitive, -1, 1)),
            'detail_oriented': detail_oriented,
            'abstract_thinking': 0.5,  # TODO: 更复杂的分析
            'decision_speed': decision_speed,
            'risk_tolerance': 0.5,
            'open_mindedness': 0.7,
            'creativity_level': 0.5,
            'logical_reasoning': max(0.0, analytical_vs_intuitive)
        }
    
    def extract_social_patterns(
        self, 
        all_conversations: List[Dict],
        user_id: str
    ) -> Dict[str, Any]:
        """提取社交模式"""
        user_messages = [c for c in all_conversations if c.get('sender') == user_id]
        
        if not user_messages:
            return self._default_social_features()
        
        # 构建关系图谱
        relationship_map = self._build_relationship_map(all_conversations, user_id)
        
        # 响应时间模式
        response_time_pattern = self._analyze_response_times(all_conversations, user_id)
        
        # 话题偏好
        topic_preferences = self._extract_topic_preferences(user_messages)
        
        # 外向性评分（主动发起对话的频率）
        extraversion_score = self._estimate_extraversion(all_conversations, user_id)
        
        return {
            'extraversion_score': extraversion_score,
            'relationship_map': relationship_map,
            'response_time_pattern': response_time_pattern,
            'topic_preferences': topic_preferences,
            'conflict_resolution_style': 'compromise',  # TODO: 基于冲突对话分析
            'communication_initiative_score': extraversion_score
        }
    
    def extract_behavioral_patterns(self, messages: List[Dict]) -> Dict[str, Any]:
        """提取行为习惯"""
        timestamps = [m.get('timestamp') for m in messages if m.get('timestamp')]
        
        if not timestamps:
            return self._default_behavioral_features()
        
        # 活跃时间分析
        hours = [ts.hour for ts in timestamps if isinstance(ts, datetime)]
        
        daily_routine = {}
        if hours:
            hour_dist = Counter(hours)
            most_active_hours = [h for h, _ in hour_dist.most_common(3)]
            
            # 推测作息时间
            if any(h in range(6, 9) for h in most_active_hours):
                daily_routine['wake_up_time'] = '06:00-09:00'
            if any(h in range(22, 24) for h in most_active_hours):
                daily_routine['sleep_time'] = '22:00-00:00'
        
        return {
            'daily_routine': daily_routine,
            'hobby_interests': [],  # TODO: 从对话内容中提取
            'consumption_preferences': {
                'brands': [],
                'categories': [],
                'price_range': 'medium'
            }
        }
    
    def infer_value_system(self, messages: List[Dict]) -> Dict[str, Any]:
        """推断价值观系统"""
        texts = [m.get('content', '') for m in messages if m.get('content')]
        
        if not texts:
            return self._default_value_system()
        
        text_combined = ' '.join(texts).lower()
        
        # 价值关键词检测
        value_keywords = {
            'family': ['family', 'parents', 'children', 'home', 'relatives'],
            'career': ['work', 'job', 'career', 'professional', 'business'],
            'health': ['health', 'fitness', 'exercise', 'wellness'],
            'relationships': ['friend', 'love', 'relationship', 'social'],
            'knowledge': ['learn', 'study', 'knowledge', 'education', 'book'],
            'freedom': ['freedom', 'independence', 'liberty', 'choice'],
            'security': ['safe', 'security', 'stable', 'protect'],
            'creativity': ['creative', 'art', 'design', 'imagine', 'innovate']
        }
        
        priorities = {}
        for value, keywords in value_keywords.items():
            count = sum(text_combined.count(kw) for kw in keywords)
            priorities[value] = count
        
        # 归一化
        total = sum(priorities.values())
        if total > 0:
            priorities = {k: v / total for k, v in priorities.items()}
        
        return {
            'priorities': priorities,
            'moral_framework': {
                'fairness': 0.7,
                'loyalty': 0.6,
                'authority': 0.5,
                'purity': 0.5,
                'care': 0.7
            },
            'life_philosophy': ['pragmatic', 'optimistic'],
            'political_leaning': 0.0,
            'religious_spiritual': 0.3,
            'environmental_concern': 0.5,
            'social_responsibility': 0.6
        }
    
    # ==========================================
    # 辅助方法
    # ==========================================
    
    def _compute_formality(self, texts: List[str]) -> float:
        """计算正式程度"""
        indicators = {
            'informal': [r"'ll", r"'re", r"'ve", r"wanna", r"gonna", r"gotta", r"yeah", r"nah"],
            'formal': [r"therefore", r"furthermore", r"consequently", r"shall", r"hereby"]
        }
        
        text_combined = ' '.join(texts).lower()
        informal_count = sum(len(re.findall(pattern, text_combined)) for pattern in indicators['informal'])
        formal_count = sum(len(re.findall(pattern, text_combined)) for pattern in indicators['formal'])
        
        total = informal_count + formal_count
        if total == 0:
            return 0.5
        
        return formal_count / total
    
    def _detect_catchphrases(self, texts: List[str], min_count: int = 3) -> List[str]:
        """检测口头禅"""
        # 简单实现：检测高频2-3词组合
        from itertools import chain
        
        words_lists = [text.lower().split() for text in texts]
        
        # 2-gram
        bigrams = []
        for words in words_lists:
            bigrams.extend([' '.join(words[i:i+2]) for i in range(len(words)-1)])
        
        bigram_counts = Counter(bigrams)
        catchphrases = [phrase for phrase, count in bigram_counts.most_common(10) if count >= min_count]
        
        return catchphrases
    
    def _analyze_punctuation(self, texts: List[str]) -> Dict[str, float]:
        """分析标点使用习惯"""
        text_combined = ' '.join(texts)
        total_chars = len(text_combined)
        
        if total_chars == 0:
            return {'exclamation': 0.0, 'question': 0.0, 'ellipsis': 0.0, 'comma': 0.0}
        
        return {
            'exclamation': text_combined.count('!') / total_chars,
            'question': text_combined.count('?') / total_chars,
            'ellipsis': text_combined.count('...') / len(texts),
            'comma': text_combined.count(',') / total_chars
        }
    
    def _estimate_humor_frequency(self, texts: List[str]) -> float:
        """估算幽默频率"""
        humor_indicators = ['lol', 'lmao', 'haha', 'hehe', '😂', '🤣', 'funny', 'joke']
        
        text_combined = ' '.join(texts).lower()
        humor_count = sum(text_combined.count(ind) for ind in humor_indicators)
        
        return min(humor_count / len(texts), 1.0) if texts else 0.0
    
    def _get_common_words(self, words: List[str], top_n: int = 20) -> List[Dict[str, Any]]:
        """获取高频词"""
        # 过滤停用词
        stopwords = set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'of', 'for'])
        filtered_words = [w.lower() for w in words if w.lower() not in stopwords and len(w) > 2]
        
        word_counts = Counter(filtered_words)
        total = len(filtered_words)
        
        return [
            {'word': word, 'frequency': count / total}
            for word, count in word_counts.most_common(top_n)
        ]
    
    def _estimate_empathy(self, texts: List[str]) -> float:
        """估算共情能力"""
        empathy_keywords = [
            'understand', 'feel', 'sorry', 'sympathy', 'care', 'concern',
            'support', 'help', 'comfort', 'empathy', 'compassion'
        ]
        
        text_combined = ' '.join(texts).lower()
        empathy_count = sum(text_combined.count(kw) for kw in empathy_keywords)
        
        return min(empathy_count / len(texts), 1.0) if texts else 0.5
    
    def _estimate_detail_orientation(self, texts: List[str]) -> float:
        """估算细节导向"""
        # 具体数字、时间、地点的使用频率
        detail_pattern = r'\b\d+\b|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december'
        
        text_combined = ' '.join(texts).lower()
        detail_matches = len(re.findall(detail_pattern, text_combined))
        
        return min(detail_matches / len(texts), 1.0) if texts else 0.5
    
    def _estimate_decision_speed(self, messages: List[Dict]) -> float:
        """估算决策速度（基于响应时间）"""
        # TODO: 需要对话历史中包含时间戳
        return 0.5  # 默认中等速度
    
    def _build_relationship_map(
        self, 
        conversations: List[Dict],
        user_id: str
    ) -> Dict[str, Dict[str, Any]]:
        """构建关系图谱"""
        relationship_map = defaultdict(lambda: {
            'interaction_count': 0,
            'total_messages': 0,
            'topics': [],
            'first_interaction': None,
            'last_interaction': None,
            'sentiment_sum': 0.0
        })
        
        for conv in conversations:
            sender = conv.get('sender')
            receiver = conv.get('receiver')
            timestamp = conv.get('timestamp')
            
            # 确定对话对象
            other_person = receiver if sender == user_id else sender
            if not other_person or other_person == user_id:
                continue
            
            rel = relationship_map[other_person]
            rel['interaction_count'] += 1
            rel['total_messages'] += 1
            
            if timestamp:
                if not rel['first_interaction']:
                    rel['first_interaction'] = timestamp
                rel['last_interaction'] = timestamp
        
        # 转换为普通字典并计算亲密度
        result = {}
        for person, data in relationship_map.items():
            intimacy = min(data['interaction_count'] / 100.0, 1.0)
            result[person] = {
                'intimacy_level': intimacy,
                'interaction_frequency': data['interaction_count'],
                'emotional_tone': 0.0,
                'total_interactions': data['total_messages']
            }
        
        return result
    
    def _analyze_response_times(
        self,
        conversations: List[Dict],
        user_id: str
    ) -> Dict[str, Any]:
        """分析响应时间模式"""
        timestamps = [c.get('timestamp') for c in conversations if c.get('timestamp') and c.get('sender') == user_id]
        
        if not timestamps:
            return {'average_delay_minutes': 30, 'time_of_day_preferences': [0] * 24, 'weekday_preferences': [0] * 7}
        
        # 时段偏好
        hour_counts = Counter([ts.hour for ts in timestamps if isinstance(ts, datetime)])
        time_of_day_prefs = [hour_counts.get(h, 0) for h in range(24)]
        
        # 星期偏好
        weekday_counts = Counter([ts.weekday() for ts in timestamps if isinstance(ts, datetime)])
        weekday_prefs = [weekday_counts.get(d, 0) for d in range(7)]
        
        return {
            'average_delay_minutes': 30,  # TODO: 计算实际响应延迟
            'time_of_day_preferences': time_of_day_prefs,
            'weekday_preferences': weekday_prefs
        }
    
    def _extract_topic_preferences(self, messages: List[Dict]) -> Dict[str, float]:
        """提取话题偏好"""
        # TODO: 使用主题模型（LDA/BERTopic）
        # 这里使用简单的关键词统计
        topics = {
            'technology': ['tech', 'computer', 'software', 'app', 'code'],
            'sports': ['sport', 'game', 'play', 'team', 'match'],
            'entertainment': ['movie', 'music', 'show', 'watch', 'listen'],
            'food': ['food', 'eat', 'restaurant', 'cook', 'meal'],
            'travel': ['travel', 'trip', 'visit', 'vacation', 'tour']
        }
        
        texts = [m.get('content', '').lower() for m in messages]
        text_combined = ' '.join(texts)
        
        topic_scores = {}
        for topic, keywords in topics.items():
            score = sum(text_combined.count(kw) for kw in keywords)
            topic_scores[topic] = score
        
        # 归一化
        total = sum(topic_scores.values())
        if total > 0:
            topic_scores = {k: v / total for k, v in topic_scores.items()}
        
        return topic_scores
    
    def _estimate_extraversion(
        self,
        conversations: List[Dict],
        user_id: str
    ) -> float:
        """估算外向性"""
        user_initiated = sum(1 for c in conversations if c.get('sender') == user_id and c.get('is_conversation_start', False))
        total_convs = len(set(c.get('conversation_id') for c in conversations if c.get('conversation_id')))
        
        if total_convs == 0:
            return 0.5
        
        return min(user_initiated / total_convs, 1.0)
    
    # ==========================================
    # 默认值
    # ==========================================
    
    def _default_linguistic_features(self) -> Dict:
        return {
            'vocabulary_complexity': 0.5,
            'sentence_length_preference': 10.0,
            'formality_level': 0.5,
            'humor_frequency': 0.3,
            'emoji_usage_rate': 0.3,
            'catchphrases': [],
            'punctuation_style': {'exclamation': 0.01, 'question': 0.01, 'ellipsis': 0.0, 'comma': 0.02},
            'common_words': []
        }
    
    def _default_emotional_features(self) -> Dict:
        return {
            'baseline_sentiment': 0.0,
            'emotional_volatility': 0.3,
            'empathy_level': 0.5,
            'optimism_score': 0.5,
            'anxiety_tendency': 0.3,
            'anger_threshold': 0.7,
            'emotion_expression_style': 'mixed',
            'emotion_distribution': {
                'joy': 0.2, 'sadness': 0.1, 'anger': 0.05,
                'fear': 0.05, 'surprise': 0.1, 'neutral': 0.5
            }
        }
    
    def _default_cognitive_features(self) -> Dict:
        return {
            'analytical_vs_intuitive': 0.0,
            'detail_oriented': 0.5,
            'abstract_thinking': 0.5,
            'decision_speed': 0.5,
            'risk_tolerance': 0.5,
            'open_mindedness': 0.7,
            'creativity_level': 0.5,
            'logical_reasoning': 0.5
        }
    
    def _default_social_features(self) -> Dict:
        return {
            'extraversion_score': 0.5,
            'relationship_map': {},
            'response_time_pattern': {
                'average_delay_minutes': 30,
                'time_of_day_preferences': [0] * 24,
                'weekday_preferences': [0] * 7
            },
            'topic_preferences': {},
            'conflict_resolution_style': 'compromise',
            'communication_initiative_score': 0.5
        }
    
    def _default_behavioral_features(self) -> Dict:
        return {
            'daily_routine': {},
            'hobby_interests': [],
            'consumption_preferences': {'brands': [], 'categories': [], 'price_range': 'medium'}
        }
    
    def _default_value_system(self) -> Dict:
        return {
            'priorities': {},
            'moral_framework': {
                'fairness': 0.5, 'loyalty': 0.5, 'authority': 0.5,
                'purity': 0.5, 'care': 0.5
            },
            'life_philosophy': [],
            'political_leaning': 0.0,
            'religious_spiritual': 0.3,
            'environmental_concern': 0.5,
            'social_responsibility': 0.5
        }


# ==========================================
# 使用示例
# ==========================================

if __name__ == '__main__':
    # 示例数据
    sample_conversations = [
        {
            'sender': 'user_123',
            'content': 'Hey! How are you doing today? 😊',
            'timestamp': datetime.now(),
            'is_user_message': True
        },
        {
            'sender': 'friend_1',
            'content': 'I\'m good, thanks! How about you?',
            'timestamp': datetime.now(),
            'is_user_message': False
        },
        # ... 更多对话
    ]
    
    extractor = PersonalityFeatureExtractor()
    features = extractor.extract_all_features(sample_conversations, 'user_123')
    
    print(json.dumps(features, indent=2, default=str))
