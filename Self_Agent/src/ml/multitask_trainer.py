"""
多任务训练框架
支持联合优化: Generation + Style Consistency + Relationship-Aware + Contrastive Learning
"""

import os
import sys
import json
import sqlite3
import argparse
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
import numpy as np
from datetime import datetime
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """训练配置"""
    user_id: str
    db_path: str
    
    # 模型参数
    base_model: str = "gemini-2.0-flash-exp"
    model_type: str = "lora"
    lora_rank: int = 16
    lora_alpha: int = 32
    
    # 训练超参数
    epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-5
    warmup_steps: int = 100
    gradient_accumulation_steps: int = 4
    
    # 多任务损失权重
    gen_loss_weight: float = 1.0
    style_loss_weight: float = 0.3
    relation_loss_weight: float = 0.2
    contrastive_loss_weight: float = 0.1
    
    # 数据配置
    use_augmented_data: bool = True
    min_samples: int = 50
    max_samples: Optional[int] = None
    validation_split: float = 0.1
    
    # 训练策略
    use_mixed_precision: bool = True
    use_gradient_checkpointing: bool = True
    early_stopping_patience: int = 3
    
    # 输出配置
    output_dir: str = "./models"
    save_steps: int = 500
    logging_steps: int = 50


@dataclass
class TrainingBatch:
    """训练批次数据"""
    input_ids: np.ndarray
    attention_mask: np.ndarray
    labels: np.ndarray
    
    # 多任务辅助输入
    style_embeddings: Optional[np.ndarray] = None
    relationship_context: Optional[np.ndarray] = None
    is_negative: Optional[np.ndarray] = None  # 负样本标记
    
    # 元数据
    sample_ids: Optional[List[str]] = None
    target_persons: Optional[List[str]] = None


class MultiTaskPersonaTrainer:
    """多任务人格训练器"""
    
    def __init__(self, config: TrainingConfig):
        self.config = config
        self.db_conn = sqlite3.connect(config.db_path)
        self.db_conn.row_factory = sqlite3.Row
        
        # 训练统计
        self.training_stats = {
            'total_steps': 0,
            'best_val_loss': float('inf'),
            'epochs_without_improvement': 0,
            'losses': {
                'gen': [],
                'style': [],
                'relation': [],
                'contrastive': [],
                'total': []
            }
        }
        
        logger.info(f"🚀 Initialized MultiTaskPersonaTrainer for user: {config.user_id}")
        logger.info(f"   Base model: {config.base_model}")
        logger.info(f"   Loss weights: Gen={config.gen_loss_weight}, Style={config.style_loss_weight}, "
                   f"Relation={config.relation_loss_weight}, Contrastive={config.contrastive_loss_weight}")
    
    def train(self) -> Dict[str, Any]:
        """执行多任务训练"""
        logger.info("\n" + "="*80)
        logger.info("🎯 Starting Multi-Task Persona Training")
        logger.info("="*80)
        
        try:
            # 1. 加载数据
            train_data, val_data = self._load_training_data()
            logger.info(f"✓ Loaded {len(train_data)} training samples, {len(val_data)} validation samples")
            
            # 2. 提取用户风格profile
            style_profile = self._extract_style_profile()
            logger.info(f"✓ Extracted user style profile")
            
            # 3. 构建关系映射
            relationship_map = self._build_relationship_map()
            logger.info(f"✓ Built relationship map with {len(relationship_map)} persons")
            
            # 4. 准备模型 (这里是伪代码,实际需要集成真实模型)
            model = self._initialize_model()
            logger.info(f"✓ Initialized model: {self.config.base_model}")
            
            # 5. 训练循环
            best_model_path = None
            for epoch in range(self.config.epochs):
                logger.info(f"\n📈 Epoch {epoch + 1}/{self.config.epochs}")
                
                # 训练一个epoch
                train_loss = self._train_epoch(
                    model, 
                    train_data, 
                    style_profile, 
                    relationship_map
                )
                
                # 验证
                val_loss = self._validate_epoch(
                    model, 
                    val_data, 
                    style_profile, 
                    relationship_map
                )
                
                logger.info(f"   Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
                
                # Early stopping检查
                if val_loss < self.training_stats['best_val_loss']:
                    self.training_stats['best_val_loss'] = val_loss
                    self.training_stats['epochs_without_improvement'] = 0
                    
                    # 保存最佳模型
                    best_model_path = self._save_checkpoint(model, epoch, val_loss)
                    logger.info(f"   ✓ New best model saved: {best_model_path}")
                else:
                    self.training_stats['epochs_without_improvement'] += 1
                    if self.training_stats['epochs_without_improvement'] >= self.config.early_stopping_patience:
                        logger.info(f"   ⚠️  Early stopping triggered (patience={self.config.early_stopping_patience})")
                        break
            
            # 6. 保存最终模型与元数据
            final_metadata = self._save_final_model(best_model_path)
            
            logger.info("\n" + "="*80)
            logger.info("✅ Training Completed Successfully!")
            logger.info(f"   Best Val Loss: {self.training_stats['best_val_loss']:.4f}")
            logger.info(f"   Model saved to: {final_metadata['model_path']}")
            logger.info("="*80 + "\n")
            
            return final_metadata
            
        except Exception as e:
            logger.error(f"❌ Training failed: {str(e)}")
            raise
        finally:
            self.db_conn.close()
    
    def _load_training_data(self) -> Tuple[List[Dict], List[Dict]]:
        """加载训练数据"""
        cursor = self.db_conn.cursor()
        
        # 选择数据源
        if self.config.use_augmented_data:
            # 使用增强数据
            table = 'enhanced_training_samples'
            logger.info("   Using augmented training samples")
        else:
            # 使用原始数据
            table = 'personality_training_samples'
            logger.info("   Using original training samples")
        
        # 查询数据
        query = f"""
            SELECT 
                id, conversation_context, user_response, target_person,
                emotional_context, quality_score, style_tags, intent_tags,
                augmentation_type, augmentation_metadata
            FROM {table}
            WHERE user_id = ? AND used_for_training = 0
            ORDER BY quality_score DESC
        """
        
        if self.config.max_samples:
            query += f" LIMIT {self.config.max_samples}"
        
        cursor.execute(query, (self.config.user_id,))
        
        all_samples = []
        for row in cursor.fetchall():
            sample = dict(row)
            
            # 解析JSON字段
            if 'augmentation_metadata' in sample and sample['augmentation_metadata']:
                try:
                    sample['augmentation_metadata'] = json.loads(sample['augmentation_metadata'])
                except:
                    sample['augmentation_metadata'] = {}
            
            all_samples.append(sample)
        
        if len(all_samples) < self.config.min_samples:
            raise ValueError(
                f"Insufficient samples: {len(all_samples)} < {self.config.min_samples}. "
                "Consider running sample augmentation first."
            )
        
        # 划分训练集和验证集
        np.random.shuffle(all_samples)
        split_idx = int(len(all_samples) * (1 - self.config.validation_split))
        
        train_data = all_samples[:split_idx]
        val_data = all_samples[split_idx:]
        
        return train_data, val_data
    
    def _extract_style_profile(self) -> Dict[str, Any]:
        """提取用户风格profile"""
        cursor = self.db_conn.cursor()
        
        # 从所有用户回复中分析风格
        cursor.execute("""
            SELECT user_response, style_tags
            FROM personality_training_samples
            WHERE user_id = ?
        """, (self.config.user_id,))
        
        responses = [row[0] for row in cursor.fetchall()]
        
        if not responses:
            logger.warning("   No responses found for style extraction, using defaults")
            return self._get_default_style_profile()
        
        # 风格特征提取
        profile = {
            'avg_length': np.mean([len(r) for r in responses]),
            'exclamation_freq': sum(r.count('!') for r in responses) / len(responses),
            'question_freq': sum(r.count('?') for r in responses) / len(responses),
            'emoji_freq': sum(len([c for c in r if ord(c) > 0x1F300]) for r in responses) / len(responses),
            
            # 简化的embedding (实际应用真实embedding模型)
            'style_embedding': np.random.randn(128).tolist()  # 占位符
        }
        
        return profile
    
    def _get_default_style_profile(self) -> Dict[str, Any]:
        """默认风格profile"""
        return {
            'avg_length': 30,
            'exclamation_freq': 0.1,
            'question_freq': 0.05,
            'emoji_freq': 0.2,
            'style_embedding': np.zeros(128).tolist()
        }
    
    def _build_relationship_map(self) -> Dict[str, Dict[str, Any]]:
        """构建关系映射"""
        cursor = self.db_conn.cursor()
        
        cursor.execute("""
            SELECT 
                target_person,
                COUNT(*) as interaction_count,
                AVG(COALESCE(emotional_context, 0)) as avg_emotion
            FROM personality_training_samples
            WHERE user_id = ? AND target_person IS NOT NULL
            GROUP BY target_person
        """, (self.config.user_id,))
        
        relationship_map = {}
        for row in cursor.fetchall():
            person = row[0]
            relationship_map[person] = {
                'interaction_count': row[1],
                'intimacy_level': min(row[1] / 100, 1.0),
                'avg_emotion': row[2] if row[2] else 0.0,
                # 简化的关系embedding
                'relation_embedding': np.random.randn(64).tolist()  # 占位符
            }
        
        return relationship_map
    
    def _initialize_model(self):
        """初始化模型 (伪代码)"""
        # 实际实现应加载真实的Gemini模型或其他LLM
        # 这里返回一个占位符
        logger.info("   📦 Model initialization (placeholder)")
        
        return {
            'base_model': self.config.base_model,
            'lora_config': {
                'rank': self.config.lora_rank,
                'alpha': self.config.lora_alpha
            },
            'initialized_at': datetime.now().isoformat()
        }
    
    def _train_epoch(
        self, 
        model, 
        train_data: List[Dict], 
        style_profile: Dict,
        relationship_map: Dict
    ) -> float:
        """训练一个epoch"""
        total_loss = 0.0
        num_batches = len(train_data) // self.config.batch_size
        
        for batch_idx in range(num_batches):
            # 获取batch数据
            batch_start = batch_idx * self.config.batch_size
            batch_end = batch_start + self.config.batch_size
            batch_samples = train_data[batch_start:batch_end]
            
            # 准备batch
            batch = self._prepare_batch(batch_samples, style_profile, relationship_map)
            
            # 计算多任务损失
            losses = self._compute_multitask_loss(model, batch, style_profile, relationship_map)
            
            # 总损失 (加权和)
            total_batch_loss = (
                self.config.gen_loss_weight * losses['gen'] +
                self.config.style_loss_weight * losses['style'] +
                self.config.relation_loss_weight * losses['relation'] +
                self.config.contrastive_loss_weight * losses['contrastive']
            )
            
            total_loss += total_batch_loss
            
            # 记录损失
            if batch_idx % self.config.logging_steps == 0:
                logger.info(
                    f"   Step {batch_idx}/{num_batches} - "
                    f"Loss: {total_batch_loss:.4f} "
                    f"(Gen: {losses['gen']:.4f}, Style: {losses['style']:.4f}, "
                    f"Rel: {losses['relation']:.4f}, Contra: {losses['contrastive']:.4f})"
                )
                
                # 保存到统计
                for key, value in losses.items():
                    self.training_stats['losses'][key].append(value)
                self.training_stats['losses']['total'].append(total_batch_loss)
            
            self.training_stats['total_steps'] += 1
        
        avg_loss = total_loss / num_batches
        return avg_loss
    
    def _validate_epoch(
        self, 
        model, 
        val_data: List[Dict],
        style_profile: Dict,
        relationship_map: Dict
    ) -> float:
        """验证一个epoch"""
        total_loss = 0.0
        num_batches = len(val_data) // self.config.batch_size
        
        for batch_idx in range(num_batches):
            batch_start = batch_idx * self.config.batch_size
            batch_end = batch_start + self.config.batch_size
            batch_samples = val_data[batch_start:batch_end]
            
            batch = self._prepare_batch(batch_samples, style_profile, relationship_map)
            losses = self._compute_multitask_loss(model, batch, style_profile, relationship_map)
            
            total_batch_loss = (
                self.config.gen_loss_weight * losses['gen'] +
                self.config.style_loss_weight * losses['style'] +
                self.config.relation_loss_weight * losses['relation'] +
                self.config.contrastive_loss_weight * losses['contrastive']
            )
            
            total_loss += total_batch_loss
        
        avg_loss = total_loss / num_batches
        return avg_loss
    
    def _prepare_batch(
        self, 
        samples: List[Dict],
        style_profile: Dict,
        relationship_map: Dict
    ) -> TrainingBatch:
        """准备训练batch"""
        # 简化版实现 (实际需要tokenization等)
        batch_size = len(samples)
        
        # 构建输入序列 (占位符)
        input_ids = np.random.randint(0, 1000, (batch_size, 512))
        attention_mask = np.ones((batch_size, 512))
        labels = np.random.randint(0, 1000, (batch_size, 512))
        
        # 风格embedding (所有样本共享用户风格)
        style_embeddings = np.array([style_profile['style_embedding']] * batch_size)
        
        # 关系context (根据target_person提取)
        relationship_context = []
        for sample in samples:
            person = sample.get('target_person')
            if person and person in relationship_map:
                rel_emb = relationship_map[person]['relation_embedding']
            else:
                rel_emb = np.zeros(64).tolist()  # 默认
            relationship_context.append(rel_emb)
        relationship_context = np.array(relationship_context)
        
        # 负样本标记
        is_negative = np.array([
            sample.get('augmentation_metadata', {}).get('is_negative', False)
            for sample in samples
        ], dtype=bool)
        
        return TrainingBatch(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels,
            style_embeddings=style_embeddings,
            relationship_context=relationship_context,
            is_negative=is_negative,
            sample_ids=[s['id'] for s in samples],
            target_persons=[s.get('target_person') for s in samples]
        )
    
    def _compute_multitask_loss(
        self,
        model,
        batch: TrainingBatch,
        style_profile: Dict,
        relationship_map: Dict
    ) -> Dict[str, float]:
        """计算多任务损失"""
        
        # 1. Generation Loss (标准生成损失)
        gen_loss = self._compute_generation_loss(model, batch)
        
        # 2. Style Consistency Loss (风格一致性)
        style_loss = self._compute_style_loss(model, batch, style_profile)
        
        # 3. Relationship-Aware Loss (关系适配)
        relation_loss = self._compute_relationship_loss(model, batch, relationship_map)
        
        # 4. Contrastive Loss (对比学习)
        contrastive_loss = self._compute_contrastive_loss(model, batch)
        
        return {
            'gen': gen_loss,
            'style': style_loss,
            'relation': relation_loss,
            'contrastive': contrastive_loss
        }
    
    def _compute_generation_loss(self, model, batch: TrainingBatch) -> float:
        """计算生成损失 (Cross-Entropy)"""
        # 伪代码: 实际应调用模型的forward pass
        # loss = F.cross_entropy(logits, batch.labels)
        
        # 占位符: 随机损失
        return np.random.uniform(0.5, 2.0)
    
    def _compute_style_loss(
        self, 
        model, 
        batch: TrainingBatch,
        style_profile: Dict
    ) -> float:
        """计算风格一致性损失 (Cosine Distance)"""
        # 伪代码:
        # 1. 从模型输出中提取生成文本的风格embedding
        # 2. 与用户风格profile的embedding计算余弦距离
        # style_loss = 1 - cosine_similarity(generated_style_emb, user_style_emb)
        
        # 占位符
        return np.random.uniform(0.1, 0.5)
    
    def _compute_relationship_loss(
        self,
        model,
        batch: TrainingBatch,
        relationship_map: Dict
    ) -> float:
        """计算关系适配损失 (KL Divergence)"""
        # 伪代码:
        # 1. 根据target_person获取期望的关系context分布
        # 2. 从模型输出中提取实际生成的关系context
        # 3. 计算KL散度
        # relation_loss = kl_divergence(expected_rel_dist, generated_rel_dist)
        
        # 占位符
        return np.random.uniform(0.05, 0.3)
    
    def _compute_contrastive_loss(self, model, batch: TrainingBatch) -> float:
        """计算对比学习损失 (InfoNCE)"""
        # 伪代码:
        # 1. 对于每个anchor样本,找到positive (真实用户回复) 和 negative samples
        # 2. 计算embedding距离
        # 3. InfoNCE: -log(exp(sim(anchor, pos)) / (exp(sim(anchor, pos)) + sum(exp(sim(anchor, neg)))))
        
        # 仅对标记为负样本的batch计算
        if not batch.is_negative.any():
            return 0.0
        
        # 占位符
        return np.random.uniform(0.05, 0.2)
    
    def _save_checkpoint(self, model, epoch: int, val_loss: float) -> str:
        """保存checkpoint"""
        checkpoint_dir = os.path.join(
            self.config.output_dir,
            self.config.user_id,
            f"checkpoint-epoch{epoch}"
        )
        os.makedirs(checkpoint_dir, exist_ok=True)
        
        checkpoint_path = os.path.join(checkpoint_dir, "model.json")
        
        # 保存模型 (伪代码)
        with open(checkpoint_path, 'w') as f:
            json.dump({
                'model': model,
                'epoch': epoch,
                'val_loss': val_loss,
                'config': self.config.__dict__
            }, f, indent=2)
        
        return checkpoint_path
    
    def _save_final_model(self, best_model_path: Optional[str]) -> Dict[str, Any]:
        """保存最终模型和元数据"""
        timestamp = int(datetime.now().timestamp() * 1000)
        final_dir = os.path.join(
            self.config.output_dir,
            self.config.user_id,
            f"final-{timestamp}"
        )
        os.makedirs(final_dir, exist_ok=True)
        
        # 复制最佳模型
        if best_model_path:
            import shutil
            shutil.copy(best_model_path, os.path.join(final_dir, "model.json"))
        
        # 保存训练元数据
        metadata = {
            'user_id': self.config.user_id,
            'model_version': f"v{timestamp}",
            'training_config': self.config.__dict__,
            'training_stats': self.training_stats,
            'best_val_loss': self.training_stats['best_val_loss'],
            'total_steps': self.training_stats['total_steps'],
            'model_path': final_dir,
            'trained_at': datetime.now().isoformat()
        }
        
        metadata_path = os.path.join(final_dir, "metadata.json")
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        # 保存损失曲线
        losses_path = os.path.join(final_dir, "training_losses.json")
        with open(losses_path, 'w') as f:
            json.dump(self.training_stats['losses'], f, indent=2)
        
        logger.info(f"   💾 Saved final model to: {final_dir}")
        logger.info(f"   📊 Saved metadata to: {metadata_path}")
        
        # 写入数据库
        self._record_trained_model(metadata)
        
        return metadata
    
    def _record_trained_model(self, metadata: Dict[str, Any]):
        """记录训练好的模型到数据库"""
        cursor = self.db_conn.cursor()
        
        cursor.execute("""
            INSERT INTO personality_models 
            (user_id, model_version, model_type, model_path, 
             training_samples_count, training_loss, hyperparameters, 
             is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
        """, (
            self.config.user_id,
            metadata['model_version'],
            self.config.model_type,
            metadata['model_path'],
            metadata['training_stats']['total_steps'] * self.config.batch_size,
            metadata['best_val_loss'],
            json.dumps(self.config.__dict__),
            int(datetime.now().timestamp() * 1000)
        ))
        
        self.db_conn.commit()
        logger.info("   ✓ Recorded model in database")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='多任务人格训练器')
    
    # 基础参数
    parser.add_argument('--user-id', type=str, required=True, help='用户ID')
    parser.add_argument('--db-path', type=str, default='./self_agent.db', help='数据库路径')
    
    # 模型参数
    parser.add_argument('--base-model', type=str, default='gemini-2.0-flash-exp', help='基础模型')
    parser.add_argument('--lora-rank', type=int, default=16, help='LoRA rank')
    
    # 训练参数
    parser.add_argument('--epochs', type=int, default=3, help='训练轮数')
    parser.add_argument('--batch-size', type=int, default=4, help='批大小')
    parser.add_argument('--learning-rate', type=float, default=2e-5, help='学习率')
    
    # 损失权重
    parser.add_argument('--gen-loss-weight', type=float, default=1.0, help='生成损失权重')
    parser.add_argument('--style-loss-weight', type=float, default=0.3, help='风格损失权重')
    parser.add_argument('--relation-loss-weight', type=float, default=0.2, help='关系损失权重')
    parser.add_argument('--contrastive-loss-weight', type=float, default=0.1, help='对比损失权重')
    
    # 数据参数
    parser.add_argument('--use-augmented', action='store_true', help='使用增强数据')
    parser.add_argument('--min-samples', type=int, default=50, help='最小样本数')
    
    # 输出参数
    parser.add_argument('--output-dir', type=str, default='./models', help='输出目录')
    
    args = parser.parse_args()
    
    # 构建配置
    config = TrainingConfig(
        user_id=args.user_id,
        db_path=args.db_path,
        base_model=args.base_model,
        lora_rank=args.lora_rank,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        gen_loss_weight=args.gen_loss_weight,
        style_loss_weight=args.style_loss_weight,
        relation_loss_weight=args.relation_loss_weight,
        contrastive_loss_weight=args.contrastive_loss_weight,
        use_augmented_data=args.use_augmented,
        min_samples=args.min_samples,
        output_dir=args.output_dir
    )
    
    # 创建训练器并训练
    trainer = MultiTaskPersonaTrainer(config)
    result = trainer.train()
    
    print("\n" + "="*80)
    print("🎉 Training Result:")
    print(json.dumps(result, indent=2))
    print("="*80 + "\n")


if __name__ == '__main__':
    main()
