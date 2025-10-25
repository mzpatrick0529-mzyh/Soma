"""
Hierarchical Memory Manager for AI-Native Memory Architecture
实现 L0 → L1 → L2 三层记忆建模

Author: GitHub Copilot (AI Expert Agent)
Version: 2.0.0
Target: 95%+ Turing Test Pass Rate
"""

import json
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
import sqlite3
from dataclasses import dataclass, asdict
import logging

# ML/NLP依赖
try:
    from sklearn.cluster import HDBSCAN
    from umap import UMAP
    from sentence_transformers import SentenceTransformer
    import spacy
    from textblob import TextBlob
except ImportError as e:
    print(f"Warning: Missing dependencies: {e}")
    print("Install with: pip install scikit-learn umap-learn sentence-transformers spacy textblob")

logger = logging.getLogger(__name__)


# ============================================
# 数据模型
# ============================================

@dataclass
class L0Memory:
    """原始记忆"""
    id: str
    user_id: str
    content: str
    content_type: str
    source: str
    timestamp: datetime
    conversation_id: Optional[str] = None
    participants: Optional[List[str]] = None
    location: Optional[str] = None
    embedding_768: Optional[np.ndarray] = None
    sentiment_score: Optional[float] = None
    emotion_labels: Optional[Dict[str, float]] = None
    entities: Optional[List[Dict]] = None
    keywords: Optional[List[str]] = None
    metadata: Optional[Dict] = None


@dataclass
class L1Cluster:
    """主题聚类"""
    id: str
    user_id: str
    cluster_name: str
    cluster_center: np.ndarray
    memory_ids: List[str]
    memory_count: int
    keywords: List[Dict[str, float]]
    entities: List[Dict]
    time_range_start: datetime
    time_range_end: datetime
    emotional_tone: str
    avg_sentiment: float
    importance_score: float


@dataclass
class L2Biography:
    """个人传记"""
    id: str
    user_id: str
    identity_core: List[str]
    identity_summary: str
    narrative_first_person: str
    narrative_third_person: str
    core_values: List[Dict]
    relationship_map: List[Dict]
    linguistic_signature: Dict
    thinking_patterns: Dict
    communication_style: Dict
    emotional_baseline: Dict
    daily_routines: List[Dict]
    interests_hobbies: List[Dict]
    version: int
    quality_score: float


# ============================================
# Layer 0: 原始记忆管理器
# ============================================

class L0MemoryManager:
    """管理原始记忆的存储、检索和嵌入"""
    
    def __init__(self, db_path: str, embedding_model: str = "all-MiniLM-L6-v2"):
        self.db_path = db_path
        self.embedding_model = SentenceTransformer(embedding_model)
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Run: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    def store_memory(self, memory: L0Memory) -> str:
        """
        存储原始记忆
        
        Pipeline:
            1. 生成嵌入向量
            2. 提取实体和关键词
            3. 情感分析
            4. 存入数据库
        """
        # 1. 生成嵌入
        if memory.embedding_768 is None:
            memory.embedding_768 = self._generate_embedding(memory.content)
        
        # 2. 提取实体和关键词
        if memory.entities is None or memory.keywords is None:
            memory.entities, memory.keywords = self._extract_entities_keywords(memory.content)
        
        # 3. 情感分析
        if memory.sentiment_score is None:
            memory.sentiment_score, memory.emotion_labels = self._analyze_sentiment(memory.content)
        
        # 4. 存入数据库
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO l0_raw_memories (
                id, user_id, content, content_type, source, timestamp,
                conversation_id, participants, location,
                embedding_768, sentiment_score, sentiment_label,
                emotion_labels, entities, keywords, metadata, processed
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        """, (
            memory.id,
            memory.user_id,
            memory.content,
            memory.content_type,
            memory.source,
            memory.timestamp.isoformat(),
            memory.conversation_id,
            json.dumps(memory.participants) if memory.participants else None,
            memory.location,
            memory.embedding_768.tobytes() if memory.embedding_768 is not None else None,
            memory.sentiment_score,
            self._sentiment_label(memory.sentiment_score),
            json.dumps(memory.emotion_labels) if memory.emotion_labels else None,
            json.dumps(memory.entities) if memory.entities else None,
            json.dumps(memory.keywords) if memory.keywords else None,
            json.dumps(memory.metadata) if memory.metadata else None
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored L0 memory: {memory.id[:8]}... ({memory.content[:50]}...)")
        return memory.id
    
    def _generate_embedding(self, text: str) -> np.ndarray:
        """生成文本嵌入向量"""
        return self.embedding_model.encode(text, convert_to_numpy=True)
    
    def _extract_entities_keywords(self, text: str) -> Tuple[List[Dict], List[str]]:
        """提取实体和关键词"""
        entities = []
        keywords = []
        
        if self.nlp:
            doc = self.nlp(text)
            
            # 提取命名实体
            for ent in doc.ents:
                entities.append({
                    "text": ent.text,
                    "type": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char
                })
            
            # 提取关键词 (名词和动词)
            keywords = [
                token.text.lower() 
                for token in doc 
                if token.pos_ in ["NOUN", "VERB", "ADJ"] and not token.is_stop
            ]
        
        return entities, keywords[:20]  # 限制关键词数量
    
    def _analyze_sentiment(self, text: str) -> Tuple[float, Dict[str, float]]:
        """情感分析"""
        try:
            blob = TextBlob(text)
            sentiment_score = blob.sentiment.polarity  # [-1, 1]
            
            # 简化版情绪标签 (可以用更复杂的模型替换)
            emotion_labels = {
                "joy": max(0, sentiment_score),
                "sadness": max(0, -sentiment_score),
                "neutral": 1 - abs(sentiment_score)
            }
            
            return sentiment_score, emotion_labels
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return 0.0, {"neutral": 1.0}
    
    def _sentiment_label(self, score: float) -> str:
        """转换情感得分为标签"""
        if score > 0.1:
            return "positive"
        elif score < -0.1:
            return "negative"
        else:
            return "neutral"
    
    def retrieve_memories(
        self, 
        user_id: str, 
        query: Optional[str] = None,
        limit: int = 100,
        time_range: Optional[Tuple[datetime, datetime]] = None
    ) -> List[L0Memory]:
        """
        检索原始记忆
        
        支持:
            - 语义搜索 (query)
            - 时间范围过滤
            - 分页
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if query:
            # 语义搜索
            query_embedding = self._generate_embedding(query)
            # TODO: 实现向量相似度搜索 (需要 sqlite-vss 或外部向量数据库)
            # 现在先用全文搜索代替
            cursor.execute("""
                SELECT id, user_id, content, content_type, source, timestamp,
                       conversation_id, participants, location,
                       embedding_768, sentiment_score, emotion_labels,
                       entities, keywords, metadata
                FROM l0_raw_memories
                WHERE user_id = ? AND processed = 1
                AND content LIKE ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (user_id, f"%{query}%", limit))
        else:
            # 时间范围查询
            if time_range:
                start, end = time_range
                cursor.execute("""
                    SELECT id, user_id, content, content_type, source, timestamp,
                           conversation_id, participants, location,
                           embedding_768, sentiment_score, emotion_labels,
                           entities, keywords, metadata
                    FROM l0_raw_memories
                    WHERE user_id = ? AND processed = 1
                    AND timestamp BETWEEN ? AND ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (user_id, start.isoformat(), end.isoformat(), limit))
            else:
                cursor.execute("""
                    SELECT id, user_id, content, content_type, source, timestamp,
                           conversation_id, participants, location,
                           embedding_768, sentiment_score, emotion_labels,
                           entities, keywords, metadata
                    FROM l0_raw_memories
                    WHERE user_id = ? AND processed = 1
                    ORDER BY timestamp DESC
                    LIMIT ?
                """, (user_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        memories = []
        for row in rows:
            memory = L0Memory(
                id=row[0],
                user_id=row[1],
                content=row[2],
                content_type=row[3],
                source=row[4],
                timestamp=datetime.fromisoformat(row[5]),
                conversation_id=row[6],
                participants=json.loads(row[7]) if row[7] else None,
                location=row[8],
                embedding_768=np.frombuffer(row[9], dtype=np.float32) if row[9] else None,
                sentiment_score=row[10],
                emotion_labels=json.loads(row[11]) if row[11] else None,
                entities=json.loads(row[12]) if row[12] else None,
                keywords=json.loads(row[13]) if row[13] else None,
                metadata=json.loads(row[14]) if row[14] else None
            )
            memories.append(memory)
        
        return memories


# ============================================
# Layer 1: 主题聚类管理器
# ============================================

class L1ClusterManager:
    """管理主题聚类"""
    
    def __init__(self, db_path: str, l0_manager: L0MemoryManager):
        self.db_path = db_path
        self.l0_manager = l0_manager
    
    def cluster_memories(
        self, 
        user_id: str, 
        min_cluster_size: int = 10,
        force_recluster: bool = False
    ) -> List[L1Cluster]:
        """
        对用户记忆进行聚类
        
        Pipeline:
            1. 获取所有 L0 记忆的嵌入向量
            2. UMAP 降维
            3. HDBSCAN 聚类
            4. 为每个聚类生成主题名称和特征
            5. 存入 L1 表
        """
        logger.info(f"Starting clustering for user {user_id}")
        
        # 1. 获取所有记忆
        memories = self.l0_manager.retrieve_memories(user_id, limit=100000)
        
        if len(memories) < min_cluster_size:
            logger.warning(f"Not enough memories to cluster: {len(memories)} < {min_cluster_size}")
            return []
        
        # 2. 提取嵌入向量
        embeddings = np.array([m.embedding_768 for m in memories if m.embedding_768 is not None])
        valid_memories = [m for m in memories if m.embedding_768 is not None]
        
        if len(embeddings) < min_cluster_size:
            logger.warning(f"Not enough valid embeddings: {len(embeddings)}")
            return []
        
        logger.info(f"Clustering {len(embeddings)} memories...")
        
        # 3. UMAP 降维
        reducer = UMAP(
            n_components=50,
            metric='cosine',
            random_state=42,
            n_neighbors=15,
            min_dist=0.1
        )
        reduced = reducer.fit_transform(embeddings)
        
        # 4. HDBSCAN 聚类
        clusterer = HDBSCAN(
            min_cluster_size=min_cluster_size,
            min_samples=3,
            metric='euclidean',
            cluster_selection_method='eom'
        )
        cluster_labels = clusterer.fit_predict(reduced)
        
        # 5. 处理每个聚类
        unique_labels = set(cluster_labels)
        unique_labels.discard(-1)  # 移除噪声点
        
        logger.info(f"Found {len(unique_labels)} clusters (excluding noise)")
        
        clusters = []
        for label in unique_labels:
            cluster_memories = [
                valid_memories[i] 
                for i, lbl in enumerate(cluster_labels) 
                if lbl == label
            ]
            
            if len(cluster_memories) < min_cluster_size:
                continue
            
            # 生成聚类特征
            cluster = self._create_cluster(user_id, label, cluster_memories, embeddings)
            clusters.append(cluster)
            
            # 存入数据库
            self._store_cluster(cluster, cluster_memories)
        
        logger.info(f"Created {len(clusters)} clusters")
        return clusters
    
    def _create_cluster(
        self, 
        user_id: str, 
        label: int, 
        memories: List[L0Memory],
        all_embeddings: np.ndarray
    ) -> L1Cluster:
        """创建聚类对象"""
        import uuid
        
        # 计算聚类中心
        cluster_embeddings = np.array([m.embedding_768 for m in memories])
        cluster_center = np.mean(cluster_embeddings, axis=0)
        
        # 提取关键词 (TF-IDF风格)
        all_keywords = []
        for m in memories:
            if m.keywords:
                all_keywords.extend(m.keywords)
        
        keyword_counts = {}
        for kw in all_keywords:
            keyword_counts[kw] = keyword_counts.get(kw, 0) + 1
        
        # 排序并取前20
        top_keywords = sorted(
            keyword_counts.items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:20]
        keywords = [{"word": kw, "weight": count/len(memories)} for kw, count in top_keywords]
        
        # 提取实体
        all_entities = []
        for m in memories:
            if m.entities:
                all_entities.extend(m.entities)
        
        entity_counts = {}
        for ent in all_entities:
            key = (ent["text"], ent["type"])
            entity_counts[key] = entity_counts.get(key, 0) + 1
        
        entities = [
            {"name": name, "type": typ, "count": count}
            for (name, typ), count in sorted(
                entity_counts.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:20]
        ]
        
        # 情感分析
        sentiments = [m.sentiment_score for m in memories if m.sentiment_score is not None]
        avg_sentiment = np.mean(sentiments) if sentiments else 0.0
        
        if avg_sentiment > 0.1:
            emotional_tone = "positive"
        elif avg_sentiment < -0.1:
            emotional_tone = "negative"
        else:
            emotional_tone = "neutral"
        
        # 时间范围
        timestamps = [m.timestamp for m in memories]
        time_range_start = min(timestamps)
        time_range_end = max(timestamps)
        
        # 重要性评分 (基于记忆数量和时间跨度)
        importance_score = min(1.0, len(memories) / 100.0)
        
        cluster = L1Cluster(
            id=str(uuid.uuid4()),
            user_id=user_id,
            cluster_name=f"Cluster_{label}",  # 将在后续步骤中用LLM命名
            cluster_center=cluster_center,
            memory_ids=[m.id for m in memories],
            memory_count=len(memories),
            keywords=keywords,
            entities=entities,
            time_range_start=time_range_start,
            time_range_end=time_range_end,
            emotional_tone=emotional_tone,
            avg_sentiment=float(avg_sentiment),
            importance_score=importance_score
        )
        
        return cluster
    
    def _store_cluster(self, cluster: L1Cluster, memories: List[L0Memory]):
        """存储聚类到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO l1_memory_clusters (
                id, user_id, cluster_name, cluster_center, memory_ids, memory_count,
                keywords, entities, time_range_start, time_range_end,
                emotional_tone, avg_sentiment, importance_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            cluster.id,
            cluster.user_id,
            cluster.cluster_name,
            cluster.cluster_center.tobytes(),
            json.dumps(cluster.memory_ids),
            cluster.memory_count,
            json.dumps(cluster.keywords),
            json.dumps(cluster.entities),
            cluster.time_range_start.isoformat(),
            cluster.time_range_end.isoformat(),
            cluster.emotional_tone,
            cluster.avg_sentiment,
            cluster.importance_score
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored L1 cluster: {cluster.id[:8]}... ({cluster.memory_count} memories)")
    
    def get_clusters(self, user_id: str, limit: int = 100) -> List[L1Cluster]:
        """获取用户的所有聚类"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, user_id, cluster_name, cluster_center, memory_ids, memory_count,
                   keywords, entities, time_range_start, time_range_end,
                   emotional_tone, avg_sentiment, importance_score
            FROM l1_memory_clusters
            WHERE user_id = ?
            ORDER BY importance_score DESC, memory_count DESC
            LIMIT ?
        """, (user_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        clusters = []
        for row in rows:
            cluster = L1Cluster(
                id=row[0],
                user_id=row[1],
                cluster_name=row[2],
                cluster_center=np.frombuffer(row[3], dtype=np.float32),
                memory_ids=json.loads(row[4]),
                memory_count=row[5],
                keywords=json.loads(row[6]),
                entities=json.loads(row[7]),
                time_range_start=datetime.fromisoformat(row[8]),
                time_range_end=datetime.fromisoformat(row[9]),
                emotional_tone=row[10],
                avg_sentiment=row[11],
                importance_score=row[12]
            )
            clusters.append(cluster)
        
        return clusters


# ============================================
# Layer 2: 传记生成管理器
# ============================================

class L2BiographyManager:
    """管理个人传记生成"""
    
    def __init__(self, db_path: str, l1_manager: L1ClusterManager):
        self.db_path = db_path
        self.l1_manager = l1_manager
    
    def generate_biography(self, user_id: str, llm_generate_fn) -> L2Biography:
        """
        生成个人传记
        
        Args:
            user_id: 用户ID
            llm_generate_fn: LLM生成函数 (prompt -> text)
        
        Returns:
            L2Biography对象
        """
        logger.info(f"Generating biography for user {user_id}")
        
        # 1. 获取所有聚类
        clusters = self.l1_manager.get_clusters(user_id, limit=100)
        
        if not clusters:
            logger.warning(f"No clusters found for user {user_id}")
            return None
        
        # 2. 提取核心身份
        identity_core = self._extract_identity(clusters)
        
        # 3. 生成叙事
        narrative = self._generate_narrative(clusters, llm_generate_fn)
        
        # 4. 推断价值观
        core_values = self._infer_values(clusters)
        
        # 5. 构建关系网络
        relationship_map = self._build_relationship_map(clusters)
        
        # 6. 量化特征
        linguistic_signature = self._extract_linguistic_signature(clusters)
        thinking_patterns = self._extract_thinking_patterns(clusters)
        communication_style = self._extract_communication_style(clusters)
        
        # 7. 其他特征
        emotional_baseline = self._extract_emotional_baseline(clusters)
        daily_routines = self._extract_daily_routines(clusters)
        interests_hobbies = self._extract_interests(clusters)
        
        # 8. 创建传记对象
        import uuid
        biography = L2Biography(
            id=str(uuid.uuid4()),
            user_id=user_id,
            identity_core=identity_core,
            identity_summary=narrative.get("identity_summary", ""),
            narrative_first_person=narrative.get("first_person", ""),
            narrative_third_person=narrative.get("third_person", ""),
            core_values=core_values,
            relationship_map=relationship_map,
            linguistic_signature=linguistic_signature,
            thinking_patterns=thinking_patterns,
            communication_style=communication_style,
            emotional_baseline=emotional_baseline,
            daily_routines=daily_routines,
            interests_hobbies=interests_hobbies,
            version=1,
            quality_score=0.8  # TODO: 实际计算
        )
        
        # 9. 存储
        self._store_biography(biography)
        
        logger.info(f"Generated biography: {biography.id[:8]}...")
        return biography
    
    def _extract_identity(self, clusters: List[L1Cluster]) -> List[str]:
        """从聚类中提取核心身份标签"""
        # 简化版: 从top关键词中提取
        all_keywords = []
        for cluster in clusters[:10]:  # 只看最重要的10个聚类
            all_keywords.extend([kw["word"] for kw in cluster.keywords[:5]])
        
        # 去重并返回
        identity_tags = list(set(all_keywords))[:10]
        return identity_tags
    
    def _generate_narrative(self, clusters: List[L1Cluster], llm_fn) -> Dict[str, str]:
        """使用LLM生成叙事"""
        # 构建Prompt
        cluster_summaries = []
        for i, cluster in enumerate(clusters[:10], 1):
            summary = f"{i}. {cluster.cluster_name} ({cluster.memory_count}条记忆, {cluster.emotional_tone}情感)"
            cluster_summaries.append(summary)
        
        prompt = f"""
根据以下主题聚类，撰写一篇个人传记：

# 主要主题
{chr(10).join(cluster_summaries)}

# 任务
1. 第一人称视角: 以"我"的口吻，简要描述自己
2. 身份摘要: 一句话总结 (20-30字)

要求:
- 自然流畅
- 体现个性
- 长度: 200-300字

# 第一人称叙事:
"""
        
        try:
            response = llm_fn(prompt)
            # 简单解析 (实际应该更健壮)
            return {
                "first_person": response,
                "third_person": "",  # TODO
                "identity_summary": "热爱生活的个体"  # TODO: 从response提取
            }
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return {
                "first_person": "待生成",
                "third_person": "待生成",
                "identity_summary": "用户"
            }
    
    def _infer_values(self, clusters: List[L1Cluster]) -> List[Dict]:
        """推断价值观"""
        # 简化版: 基于情感和主题
        value_scores = {
            "家庭": 0.5,
            "事业": 0.5,
            "健康": 0.5,
            "友谊": 0.5,
            "学习": 0.5
        }
        
        # 根据聚类调整 (TODO: 更复杂的推断)
        for cluster in clusters:
            if "家" in cluster.cluster_name or "family" in cluster.cluster_name.lower():
                value_scores["家庭"] += 0.1
            if "工作" in cluster.cluster_name or "work" in cluster.cluster_name.lower():
                value_scores["事业"] += 0.1
        
        # 归一化
        max_score = max(value_scores.values())
        if max_score > 1.0:
            value_scores = {k: v/max_score for k, v in value_scores.items()}
        
        return [
            {"value": k, "score": v, "evidence": []}
            for k, v in sorted(value_scores.items(), key=lambda x: x[1], reverse=True)
        ]
    
    def _build_relationship_map(self, clusters: List[L1Cluster]) -> List[Dict]:
        """构建关系网络"""
        # 从实体中提取人名
        person_interactions = {}
        
        for cluster in clusters:
            for entity in cluster.entities:
                if entity["type"] == "PERSON":
                    name = entity["name"]
                    count = entity["count"]
                    person_interactions[name] = person_interactions.get(name, 0) + count
        
        # 转换为关系列表
        relationships = []
        for person, count in sorted(person_interactions.items(), key=lambda x: x[1], reverse=True)[:20]:
            relationships.append({
                "person": person,
                "role": "未知",  # TODO: 推断角色
                "intimacy": min(1.0, count / 50.0),  # 简化的亲密度计算
                "interaction_count": count
            })
        
        return relationships
    
    def _extract_linguistic_signature(self, clusters: List[L1Cluster]) -> Dict:
        """提取语言指纹"""
        # TODO: 更复杂的分析
        return {
            "vocab_complexity": 0.5,
            "formality_level": 0.3,
            "emoji_usage_rate": 0.2,
            "avg_sentence_length": 15.0
        }
    
    def _extract_thinking_patterns(self, clusters: List[L1Cluster]) -> Dict:
        """提取思维模式"""
        return {
            "analytical": 0.6,
            "creative": 0.4,
            "detail_oriented": 0.5
        }
    
    def _extract_communication_style(self, clusters: List[L1Cluster]) -> Dict:
        """提取沟通风格"""
        return {
            "formality": 0.3,
            "directness": 0.7,
            "warmth": 0.6
        }
    
    def _extract_emotional_baseline(self, clusters: List[L1Cluster]) -> Dict:
        """提取情感基线"""
        sentiments = [c.avg_sentiment for c in clusters]
        return {
            "default_mood": np.mean(sentiments) if sentiments else 0.0,
            "typical_range": [np.min(sentiments), np.max(sentiments)] if sentiments else [0, 0]
        }
    
    def _extract_daily_routines(self, clusters: List[L1Cluster]) -> List[Dict]:
        """提取日常习惯"""
        # TODO: 从时间戳分析
        return []
    
    def _extract_interests(self, clusters: List[L1Cluster]) -> List[Dict]:
        """提取兴趣爱好"""
        # 从聚类关键词推断
        interests = []
        for cluster in clusters[:20]:
            if cluster.importance_score > 0.3:
                interests.append({
                    "hobby": cluster.cluster_name,
                    "frequency": "frequent" if cluster.memory_count > 20 else "occasional",
                    "proficiency": 0.5
                })
        return interests[:10]
    
    def _store_biography(self, biography: L2Biography):
        """存储传记到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO l2_biography (
                id, user_id, identity_core, identity_summary,
                narrative_first_person, narrative_third_person,
                core_values, relationship_map, linguistic_signature,
                thinking_patterns, communication_style, emotional_baseline,
                daily_routines, interests_hobbies, version, quality_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            biography.id,
            biography.user_id,
            json.dumps(biography.identity_core),
            biography.identity_summary,
            biography.narrative_first_person,
            biography.narrative_third_person,
            json.dumps(biography.core_values),
            json.dumps(biography.relationship_map),
            json.dumps(biography.linguistic_signature),
            json.dumps(biography.thinking_patterns),
            json.dumps(biography.communication_style),
            json.dumps(biography.emotional_baseline),
            json.dumps(biography.daily_routines),
            json.dumps(biography.interests_hobbies),
            biography.version,
            biography.quality_score
        ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Stored L2 biography: {biography.id[:8]}...")


# ============================================
# 主类: 分层记忆管理器
# ============================================

class HierarchicalMemoryManager:
    """统一管理 L0/L1/L2 三层记忆"""
    
    def __init__(self, db_path: str):
        self.l0_manager = L0MemoryManager(db_path)
        self.l1_manager = L1ClusterManager(db_path, self.l0_manager)
        self.l2_manager = L2BiographyManager(db_path, self.l1_manager)
    
    def import_conversation(self, user_id: str, conversation: Dict) -> str:
        """
        导入单条对话记忆
        
        Args:
            user_id: 用户ID
            conversation: {
                "content": "对话内容",
                "timestamp": "2025-10-20T10:00:00",
                "source": "wechat",
                "conversation_id": "conv_123",
                "participants": ["user", "friend_a"],
                ...
            }
        
        Returns:
            memory_id
        """
        import uuid
        memory = L0Memory(
            id=str(uuid.uuid4()),
            user_id=user_id,
            content=conversation["content"],
            content_type="text",
            source=conversation.get("source", "manual"),
            timestamp=datetime.fromisoformat(conversation["timestamp"]),
            conversation_id=conversation.get("conversation_id"),
            participants=conversation.get("participants"),
            location=conversation.get("location"),
            metadata=conversation.get("metadata")
        )
        
        return self.l0_manager.store_memory(memory)
    
    def build_memory_hierarchy(self, user_id: str, llm_generate_fn):
        """
        构建完整的记忆层次
        
        Pipeline:
            L0 (已存在) → L1 聚类 → L2 传记
        """
        logger.info(f"Building memory hierarchy for user {user_id}")
        
        # Step 1: 聚类
        clusters = self.l1_manager.cluster_memories(user_id, min_cluster_size=10)
        logger.info(f"Created {len(clusters)} clusters")
        
        # Step 2: 生成传记
        biography = self.l2_manager.generate_biography(user_id, llm_generate_fn)
        logger.info(f"Generated biography")
        
        return {
            "clusters_count": len(clusters),
            "biography_quality": biography.quality_score if biography else 0.0
        }


# ============================================
# CLI工具
# ============================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Hierarchical Memory Manager CLI")
    parser.add_argument("--db-path", required=True, help="Database path")
    parser.add_argument("--user-id", required=True, help="User ID")
    parser.add_argument("--action", required=True, choices=["cluster", "biography", "full"])
    
    args = parser.parse_args()
    
    manager = HierarchicalMemoryManager(args.db_path)
    
    # Mock LLM function
    def mock_llm_generate(prompt):
        return "我是一个热爱生活、积极向上的人。"
    
    if args.action == "cluster":
        clusters = manager.l1_manager.cluster_memories(args.user_id)
        print(f"✓ Created {len(clusters)} clusters")
    
    elif args.action == "biography":
        biography = manager.l2_manager.generate_biography(args.user_id, mock_llm_generate)
        print(f"✓ Generated biography (quality: {biography.quality_score:.2f})")
    
    elif args.action == "full":
        result = manager.build_memory_hierarchy(args.user_id, mock_llm_generate)
        print(f"✓ Built full hierarchy:")
        print(f"  - Clusters: {result['clusters_count']}")
        print(f"  - Biography quality: {result['biography_quality']:.2f}")
