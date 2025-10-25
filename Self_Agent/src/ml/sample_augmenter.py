"""
高级训练样本增强器
支持风格迁移、场景泛化、关系对比、困难负样本挖掘
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from datetime import datetime
import hashlib

@dataclass
class EnhancedSample:
    """增强后的训练样本"""
    id: str
    user_id: str
    original_sample_id: Optional[str]  # 原始样本ID (如果是增强生成的)
    
    # 核心内容
    conversation_context: str
    user_response: str
    target_person: Optional[str]
    
    # 增强标记
    augmentation_type: str  # 'original', 'style_transfer', 'scenario', 'relationship', 'hard_negative'
    augmentation_metadata: Dict[str, Any]
    
    # 质量与标签
    quality_score: float
    style_tags: str
    intent_tags: str
    emotional_context: Optional[str]
    
    # 元信息
    created_at: int


class TrainingSampleAugmenter:
    """训练样本增强器"""
    
    def __init__(self, db_path: str = './self_agent.db'):
        self.db_path = db_path
        self.conn = sqlite3.connect(db_path)
        self.conn.row_factory = sqlite3.Row
        
    def augment_all(
        self,
        user_id: str,
        enable_style_transfer: bool = True,
        enable_scenario_variants: bool = True,
        enable_relationship_variants: bool = True,
        enable_hard_negatives: bool = True,
        target_multiplier: float = 3.0  # 目标是原始样本数的3倍
    ) -> List[EnhancedSample]:
        """
        全面增强训练样本
        
        Args:
            user_id: 用户ID
            enable_*: 各种增强策略开关
            target_multiplier: 目标样本倍数
            
        Returns:
            增强后的样本列表
        """
        print(f"\n🔄 [Augmentation] Starting comprehensive sample augmentation for user: {user_id}")
        
        # 1. 获取原始样本
        original_samples = self._load_original_samples(user_id)
        print(f"   📊 Loaded {len(original_samples)} original samples")
        
        enhanced_samples = []
        
        # 2. 保留所有原始样本
        for sample in original_samples:
            enhanced = self._sample_to_enhanced(sample, 'original')
            enhanced_samples.append(enhanced)
        
        # 计算需要生成的增强样本数
        current_count = len(original_samples)
        target_count = int(current_count * target_multiplier)
        needed_augmented = target_count - current_count
        
        print(f"   🎯 Target: {target_count} samples (need {needed_augmented} augmented)")
        
        # 3. 风格迁移增强
        if enable_style_transfer and needed_augmented > 0:
            style_samples = self._generate_style_variants(
                user_id,
                original_samples,
                count=min(needed_augmented // 3, len(original_samples))
            )
            enhanced_samples.extend(style_samples)
            print(f"   ✓ Generated {len(style_samples)} style-transferred samples")
        
        # 4. 场景泛化增强
        if enable_scenario_variants and needed_augmented > 0:
            scenario_samples = self._generate_scenario_variants(
                user_id,
                original_samples,
                count=min(needed_augmented // 3, len(original_samples))
            )
            enhanced_samples.extend(scenario_samples)
            print(f"   ✓ Generated {len(scenario_samples)} scenario-variant samples")
        
        # 5. 关系对比增强
        if enable_relationship_variants and needed_augmented > 0:
            relationship_samples = self._generate_relationship_variants(
                user_id,
                original_samples,
                count=min(needed_augmented // 4, len(original_samples))
            )
            enhanced_samples.extend(relationship_samples)
            print(f"   ✓ Generated {len(relationship_samples)} relationship-variant samples")
        
        # 6. 困难负样本挖掘
        if enable_hard_negatives:
            negative_samples = self._mine_hard_negatives(
                user_id,
                original_samples,
                count=min(50, len(original_samples) // 2)
            )
            enhanced_samples.extend(negative_samples)
            print(f"   ✓ Mined {len(negative_samples)} hard negative samples")
        
        # 7. 持久化增强样本
        self._save_enhanced_samples(enhanced_samples)
        
        print(f"   ✅ Total enhanced samples: {len(enhanced_samples)}")
        print(f"   📈 Augmentation ratio: {len(enhanced_samples) / len(original_samples):.2f}x")
        
        return enhanced_samples
    
    def _load_original_samples(self, user_id: str) -> List[Dict[str, Any]]:
        """加载原始训练样本"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT 
                id, user_id, conversation_context, user_response,
                target_person, emotional_context, quality_score,
                style_tags, intent_tags, created_at
            FROM personality_training_samples
            WHERE user_id = ? AND used_for_training = 0
            ORDER BY quality_score DESC
        """, (user_id,))
        
        samples = []
        for row in cursor.fetchall():
            samples.append(dict(row))
        
        return samples
    
    def _sample_to_enhanced(
        self,
        sample: Dict[str, Any],
        aug_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> EnhancedSample:
        """将样本转换为EnhancedSample"""
        return EnhancedSample(
            id=sample.get('id', self._generate_id()),
            user_id=sample['user_id'],
            original_sample_id=sample.get('id') if aug_type != 'original' else None,
            conversation_context=sample['conversation_context'],
            user_response=sample['user_response'],
            target_person=sample.get('target_person'),
            augmentation_type=aug_type,
            augmentation_metadata=metadata or {},
            quality_score=sample.get('quality_score', 0.5),
            style_tags=sample.get('style_tags', ''),
            intent_tags=sample.get('intent_tags', ''),
            emotional_context=sample.get('emotional_context'),
            created_at=sample.get('created_at', int(datetime.now().timestamp() * 1000))
        )
    
    def _generate_style_variants(
        self,
        user_id: str,
        samples: List[Dict[str, Any]],
        count: int
    ) -> List[EnhancedSample]:
        """
        风格迁移增强: 保持语义,改变表达风格
        
        策略:
        1. 正式→非正式 / 非正式→正式
        2. 简洁→详细 / 详细→简洁
        3. 直接→委婉 / 委婉→直接
        """
        enhanced = []
        
        # 需要调用LLM进行风格迁移,这里简化为规则变换示例
        # 生产环境应使用Gemini API
        
        import random
        selected = random.sample(samples, min(count, len(samples)))
        
        for sample in selected:
            response = sample['user_response']
            
            # 简单的风格变换规则 (示例)
            variants = []
            
            # 变体1: 添加礼貌用语
            if '吗' in response or '呢' in response:
                formal = response.replace('吗', '呢').replace('呢', '吗')
                variants.append(('formality_shift', formal))
            
            # 变体2: 改变语气
            if '!' in response:
                calm = response.replace('!', '。')
                variants.append(('tone_shift', calm))
            elif '。' in response:
                excited = response.replace('。', '!')
                variants.append(('tone_shift', excited))
            
            # 变体3: 详细程度调整
            if len(response) < 20:
                # 扩展简短回复 (实际应用LLM)
                detailed = response + "，这是我的想法。"
                variants.append(('elaboration', detailed))
            
            for variant_type, variant_text in variants[:1]:  # 每个样本生成1个变体
                metadata = {
                    'transform_type': variant_type,
                    'original_response': response,
                    'transform_method': 'rule_based'  # 或 'llm_based'
                }
                
                aug_sample = dict(sample)
                aug_sample['id'] = self._generate_id()
                aug_sample['user_response'] = variant_text
                aug_sample['quality_score'] = sample['quality_score'] * 0.9  # 略微降低质量分
                
                enhanced.append(
                    self._sample_to_enhanced(aug_sample, 'style_transfer', metadata)
                )
        
        return enhanced
    
    def _generate_scenario_variants(
        self,
        user_id: str,
        samples: List[Dict[str, Any]],
        count: int
    ) -> List[EnhancedSample]:
        """
        场景泛化增强: 相同语义,不同情境
        
        策略:
        1. 改变时间背景 (工作时间 vs 休息时间)
        2. 改变地点背景 (办公室 vs 家里)
        3. 改变情绪状态 (平静 vs 兴奋)
        """
        enhanced = []
        
        import random
        selected = random.sample(samples, min(count, len(samples)))
        
        scenario_templates = [
            {
                'name': 'work_context',
                'context_prefix': '在工作场合,',
                'formality_boost': 0.2
            },
            {
                'name': 'casual_context',
                'context_prefix': '在轻松的聊天中,',
                'formality_boost': -0.2
            },
            {
                'name': 'emotional_support',
                'context_prefix': '在提供情感支持时,',
                'formality_boost': 0.0
            }
        ]
        
        for sample in selected:
            scenario = random.choice(scenario_templates)
            
            # 修改context
            new_context = scenario['context_prefix'] + sample['conversation_context']
            
            metadata = {
                'scenario_type': scenario['name'],
                'original_context': sample['conversation_context'],
                'context_modification': scenario['context_prefix']
            }
            
            aug_sample = dict(sample)
            aug_sample['id'] = self._generate_id()
            aug_sample['conversation_context'] = new_context
            aug_sample['quality_score'] = sample['quality_score'] * 0.85
            
            # 更新情感标签
            if scenario['name'] == 'emotional_support':
                aug_sample['emotional_context'] = 'supportive'
            
            enhanced.append(
                self._sample_to_enhanced(aug_sample, 'scenario', metadata)
            )
        
        return enhanced
    
    def _generate_relationship_variants(
        self,
        user_id: str,
        samples: List[Dict[str, Any]],
        count: int
    ) -> List[EnhancedSample]:
        """
        关系对比增强: 相同内容对不同人的表达
        
        策略:
        1. 对陌生人 → 更正式、保守
        2. 对亲密朋友 → 更随意、开放
        3. 对权威人物 → 更谨慎、礼貌
        """
        enhanced = []
        
        # 获取用户的关系图谱
        relationships = self._get_user_relationships(user_id)
        
        if not relationships:
            print("   ⚠️  No relationship data found, skipping relationship variants")
            return enhanced
        
        import random
        selected = random.sample(samples, min(count, len(samples)))
        
        for sample in selected:
            # 为每个样本生成面向不同关系的变体
            for rel in random.sample(relationships, min(2, len(relationships))):
                person_id = rel['person_id']
                intimacy = rel.get('intimacy_level', 0.5)
                
                # 根据亲密度调整回复 (实际应用LLM)
                response = sample['user_response']
                
                if intimacy < 0.3:  # 陌生/疏远
                    # 增加礼貌用语
                    adjusted_response = "您好，" + response if not response.startswith(('你', '您')) else response
                elif intimacy > 0.7:  # 亲密
                    # 增加亲昵表达
                    adjusted_response = response + " 😊" if '😊' not in response else response
                else:
                    adjusted_response = response
                
                metadata = {
                    'target_relationship': person_id,
                    'intimacy_level': intimacy,
                    'original_person': sample.get('target_person'),
                    'adjustment_type': 'intimacy_based'
                }
                
                aug_sample = dict(sample)
                aug_sample['id'] = self._generate_id()
                aug_sample['target_person'] = person_id
                aug_sample['user_response'] = adjusted_response
                aug_sample['quality_score'] = sample['quality_score'] * 0.8
                
                enhanced.append(
                    self._sample_to_enhanced(aug_sample, 'relationship', metadata)
                )
        
        return enhanced
    
    def _mine_hard_negatives(
        self,
        user_id: str,
        samples: List[Dict[str, Any]],
        count: int
    ) -> List[EnhancedSample]:
        """
        困难负样本挖掘
        
        策略:
        1. 语义相近但风格不符的回复
        2. 事实正确但情感不匹配的回复
        3. 其他用户的相似场景回复
        """
        enhanced = []
        
        import random
        selected = random.sample(samples, min(count, len(samples)))
        
        for sample in selected:
            # 类型1: 风格对立的负样本
            response = sample['user_response']
            
            # 简单反向变换 (实际应用对比学习挖掘)
            if '!' in response:
                negative_response = response.replace('!', '…')  # 兴奋→犹豫
            elif len(response) > 30:
                negative_response = response[:15] + '。'  # 详细→简短
            else:
                negative_response = '嗯，' + response  # 果断→犹豫
            
            metadata = {
                'negative_type': 'style_mismatch',
                'original_response': response,
                'mismatch_dimension': 'tone'
            }
            
            aug_sample = dict(sample)
            aug_sample['id'] = self._generate_id()
            aug_sample['user_response'] = negative_response
            aug_sample['quality_score'] = 0.3  # 负样本低分
            
            # 标记为负样本
            neg_sample = self._sample_to_enhanced(aug_sample, 'hard_negative', metadata)
            neg_sample.augmentation_metadata['is_negative'] = True
            
            enhanced.append(neg_sample)
        
        return enhanced
    
    def _get_user_relationships(self, user_id: str) -> List[Dict[str, Any]]:
        """获取用户关系数据"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT DISTINCT target_person as person_id, 
                   COUNT(*) as interaction_count
            FROM personality_training_samples
            WHERE user_id = ? AND target_person IS NOT NULL
            GROUP BY target_person
            HAVING interaction_count >= 3
        """, (user_id,))
        
        relationships = []
        for row in cursor.fetchall():
            relationships.append({
                'person_id': row[0],
                'interaction_count': row[1],
                'intimacy_level': min(row[1] / 100, 1.0)  # 简化估计
            })
        
        return relationships
    
    def _save_enhanced_samples(self, samples: List[EnhancedSample]):
        """保存增强样本到数据库"""
        cursor = self.conn.cursor()
        
        # 创建增强样本表(如果不存在)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS enhanced_training_samples (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                original_sample_id TEXT,
                conversation_context TEXT,
                user_response TEXT,
                target_person TEXT,
                augmentation_type TEXT,
                augmentation_metadata TEXT,
                quality_score REAL,
                style_tags TEXT,
                intent_tags TEXT,
                emotional_context TEXT,
                used_for_training INTEGER DEFAULT 0,
                created_at INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
        """)
        
        # 批量插入
        for sample in samples:
            cursor.execute("""
                INSERT OR REPLACE INTO enhanced_training_samples
                (id, user_id, original_sample_id, conversation_context, user_response,
                 target_person, augmentation_type, augmentation_metadata, quality_score,
                 style_tags, intent_tags, emotional_context, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sample.id,
                sample.user_id,
                sample.original_sample_id,
                sample.conversation_context,
                sample.user_response,
                sample.target_person,
                sample.augmentation_type,
                json.dumps(sample.augmentation_metadata),
                sample.quality_score,
                sample.style_tags,
                sample.intent_tags,
                sample.emotional_context,
                sample.created_at
            ))
        
        self.conn.commit()
        print(f"   💾 Saved {len(samples)} enhanced samples to database")
    
    def _generate_id(self) -> str:
        """生成唯一ID"""
        return hashlib.md5(
            f"{datetime.now().timestamp()}-{np.random.random()}".encode()
        ).hexdigest()[:16]
    
    def get_augmentation_stats(self, user_id: str) -> Dict[str, Any]:
        """获取增强统计信息"""
        cursor = self.conn.cursor()
        
        # 按增强类型统计
        cursor.execute("""
            SELECT augmentation_type, COUNT(*) as count
            FROM enhanced_training_samples
            WHERE user_id = ?
            GROUP BY augmentation_type
        """, (user_id,))
        
        type_dist = {row[0]: row[1] for row in cursor.fetchall()}
        
        # 质量分布
        cursor.execute("""
            SELECT 
                CASE 
                    WHEN quality_score < 0.3 THEN 'low'
                    WHEN quality_score < 0.7 THEN 'medium'
                    ELSE 'high'
                END as quality_level,
                COUNT(*) as count
            FROM enhanced_training_samples
            WHERE user_id = ?
            GROUP BY quality_level
        """, (user_id,))
        
        quality_dist = {row[0]: row[1] for row in cursor.fetchall()}
        
        return {
            'type_distribution': type_dist,
            'quality_distribution': quality_dist,
            'total_samples': sum(type_dist.values())
        }
    
    def __del__(self):
        """清理资源"""
        if hasattr(self, 'conn'):
            self.conn.close()


def main():
    """测试增强器"""
    import argparse
    
    parser = argparse.ArgumentParser(description='训练样本增强器')
    parser.add_argument('--user-id', type=str, default='default', help='用户ID')
    parser.add_argument('--db-path', type=str, default='./self_agent.db', help='数据库路径')
    parser.add_argument('--multiplier', type=float, default=3.0, help='增强倍数')
    
    args = parser.parse_args()
    
    augmenter = TrainingSampleAugmenter(args.db_path)
    
    # 执行增强
    enhanced_samples = augmenter.augment_all(
        user_id=args.user_id,
        target_multiplier=args.multiplier
    )
    
    # 输出统计
    stats = augmenter.get_augmentation_stats(args.user_id)
    print(f"\n📊 Augmentation Statistics:")
    print(f"   Type Distribution: {json.dumps(stats['type_distribution'], indent=2)}")
    print(f"   Quality Distribution: {json.dumps(stats['quality_distribution'], indent=2)}")
    print(f"   Total Samples: {stats['total_samples']}")


if __name__ == '__main__':
    main()
