"""
人格模型训练 Pipeline
基于 LoRA fine-tuning 的个性化语言模型训练
"""

import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
import sqlite3

# 训练相关库（需要安装）
try:
    import torch
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        TrainingArguments,
        Trainer,
        DataCollatorForLanguageModeling
    )
    from peft import LoraConfig, get_peft_model, TaskType, PeftModel
    from datasets import Dataset
    import numpy as np
except ImportError:
    print("Warning: Training libraries not installed. Install with:")
    print("pip install torch transformers peft datasets accelerate")


class PersonalityModelTrainer:
    """人格模型训练器"""
    
    def __init__(
        self,
        user_id: str,
        db_path: str = './self_agent.db',
        base_model: str = "google/gemma-2b",
        output_dir: str = "./models/personality"
    ):
        self.user_id = user_id
        self.db_path = db_path
        self.base_model = base_model
        self.output_dir = os.path.join(output_dir, user_id)
        
        self.tokenizer = None
        self.model = None
        self.training_data = []
        
    def prepare_training_data(self, min_samples: int = 50) -> Dataset:
        """
        从数据库准备训练数据
        
        Returns:
            HuggingFace Dataset 对象
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 从 personality_training_samples 表获取训练样本
        cursor.execute("""
            SELECT 
                conversation_context,
                user_response,
                target_person,
                timestamp_context
            FROM personality_training_samples
            WHERE user_id = ?
            AND used_for_training = 0
            ORDER BY timestamp_context DESC
            LIMIT 1000
        """, (self.user_id,))
        
        samples = cursor.fetchall()
        conn.close()
        
        if len(samples) < min_samples:
            raise ValueError(
                f"Insufficient training samples: {len(samples)} < {min_samples}. "
                f"Need more conversation data."
            )
        
        print(f"✓ Loaded {len(samples)} training samples")
        
        # 转换为训练格式
        training_examples = []
        for sample in samples:
            context_json = sample[0]
            user_response = sample[1]
            target_person = sample[2]
            
            try:
                context = json.loads(context_json) if context_json else []
            except:
                context = []
            
            # 构建训练输入-输出对
            conversation_history = self._format_conversation(context)
            
            training_examples.append({
                'input': conversation_history,
                'output': user_response,
                'metadata': {
                    'target_person': target_person,
                    'length': len(user_response.split())
                }
            })
        
        # 转换为 HuggingFace Dataset
        dataset = Dataset.from_dict({
            'input': [ex['input'] for ex in training_examples],
            'output': [ex['output'] for ex in training_examples]
        })
        
        return dataset
    
    def _format_conversation(self, context: List[Dict]) -> str:
        """格式化对话历史为训练输入"""
        formatted = []
        for msg in context[-5:]:  # 最近5条
            role = "对方" if msg.get('role') == 'other' else "我"
            formatted.append(f"{role}: {msg.get('content', '')}")
        return "\n".join(formatted)
    
    def initialize_model(self, lora_config: Optional[Dict] = None):
        """
        初始化基础模型和 LoRA 配置
        """
        print(f"Loading base model: {self.base_model}...")
        
        # 加载tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(self.base_model)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # 加载基础模型
        self.model = AutoModelForCausalLM.from_pretrained(
            self.base_model,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None
        )
        
        # 配置 LoRA
        if lora_config is None:
            lora_config = {
                'r': 16,                    # LoRA rank
                'lora_alpha': 32,           # LoRA alpha
                'lora_dropout': 0.1,
                'target_modules': ['q_proj', 'v_proj']  # 注意力层
            }
        
        peft_config = LoraConfig(
            task_type=TaskType.CAUSAL_LM,
            r=lora_config['r'],
            lora_alpha=lora_config['lora_alpha'],
            lora_dropout=lora_config['lora_dropout'],
            target_modules=lora_config['target_modules'],
            bias="none"
        )
        
        # 应用 LoRA
        self.model = get_peft_model(self.model, peft_config)
        
        trainable_params = sum(p.numel() for p in self.model.parameters() if p.requires_grad)
        total_params = sum(p.numel() for p in self.model.parameters())
        
        print(f"✓ Model initialized with LoRA")
        print(f"  Trainable params: {trainable_params:,} ({100 * trainable_params / total_params:.2f}%)")
        print(f"  Total params: {total_params:,}")
    
    def preprocess_dataset(self, dataset: Dataset) -> Dataset:
        """
        预处理数据集（tokenization）
        """
        def tokenize_function(examples):
            # 构建输入文本
            texts = [
                f"### 对话上下文:\n{inp}\n\n### 回复:\n{out}{self.tokenizer.eos_token}"
                for inp, out in zip(examples['input'], examples['output'])
            ]
            
            # Tokenize
            tokenized = self.tokenizer(
                texts,
                truncation=True,
                max_length=512,
                padding='max_length',
                return_tensors='pt'
            )
            
            # 设置 labels（用于计算loss）
            tokenized['labels'] = tokenized['input_ids'].clone()
            
            return tokenized
        
        print("Tokenizing dataset...")
        tokenized_dataset = dataset.map(
            tokenize_function,
            batched=True,
            remove_columns=dataset.column_names
        )
        
        print(f"✓ Dataset preprocessed: {len(tokenized_dataset)} samples")
        return tokenized_dataset
    
    def train(
        self,
        dataset: Dataset,
        num_epochs: int = 3,
        batch_size: int = 4,
        learning_rate: float = 2e-4,
        save_steps: int = 100
    ):
        """
        训练模型
        """
        if self.model is None:
            raise ValueError("Model not initialized. Call initialize_model() first.")
        
        # 训练参数
        training_args = TrainingArguments(
            output_dir=self.output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,
            learning_rate=learning_rate,
            fp16=torch.cuda.is_available(),
            logging_steps=10,
            save_steps=save_steps,
            save_total_limit=3,
            warmup_steps=50,
            report_to="none"
        )
        
        # 数据collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False
        )
        
        # Trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            train_dataset=dataset,
            data_collator=data_collator
        )
        
        print(f"\n{'='*50}")
        print(f"Starting training...")
        print(f"  Epochs: {num_epochs}")
        print(f"  Batch size: {batch_size}")
        print(f"  Learning rate: {learning_rate}")
        print(f"  Output: {self.output_dir}")
        print(f"{'='*50}\n")
        
        # 训练
        train_result = trainer.train()
        
        # 保存模型
        trainer.save_model()
        self.tokenizer.save_pretrained(self.output_dir)
        
        print(f"\n✓ Training completed!")
        print(f"  Final loss: {train_result.training_loss:.4f}")
        print(f"  Model saved to: {self.output_dir}")
        
        # 保存训练信息到数据库
        self._save_model_version(train_result)
        
        return train_result
    
    def _save_model_version(self, train_result):
        """保存模型版本信息到数据库"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 获取下一个版本号
        cursor.execute("""
            SELECT COALESCE(MAX(version_number), 0) + 1
            FROM personality_model_versions
            WHERE user_id = ?
        """, (self.user_id,))
        
        version_number = cursor.fetchone()[0]
        
        # 插入新版本
        cursor.execute("""
            INSERT INTO personality_model_versions (
                user_id, version_number, model_type, model_path,
                training_samples_count, training_loss,
                hyperparameters, is_active, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
        """, (
            self.user_id,
            version_number,
            'lora',
            self.output_dir,
            len(self.training_data),
            train_result.training_loss,
            json.dumps({
                'base_model': self.base_model,
                'epochs': train_result.global_step,
                'learning_rate': 2e-4
            })
        ))
        
        # 将其他版本设为非激活
        cursor.execute("""
            UPDATE personality_model_versions
            SET is_active = 0
            WHERE user_id = ? AND version_number != ?
        """, (self.user_id, version_number))
        
        conn.commit()
        conn.close()
        
        print(f"✓ Model version {version_number} saved to database")
    
    def evaluate(self, test_samples: List[Dict]) -> Dict[str, float]:
        """
        评估模型性能
        """
        if self.model is None:
            raise ValueError("Model not initialized")
        
        self.model.eval()
        
        similarities = []
        
        with torch.no_grad():
            for sample in test_samples:
                input_text = f"### 对话上下文:\n{sample['input']}\n\n### 回复:\n"
                inputs = self.tokenizer(input_text, return_tensors='pt')
                
                if torch.cuda.is_available():
                    inputs = {k: v.cuda() for k, v in inputs.items()}
                
                # 生成
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=100,
                    temperature=0.7,
                    do_sample=True
                )
                
                generated = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
                generated_response = generated.split("### 回复:\n")[-1].strip()
                
                # 计算相似度（简单的词重叠）
                similarity = self._compute_similarity(
                    generated_response,
                    sample['output']
                )
                similarities.append(similarity)
        
        return {
            'avg_similarity': np.mean(similarities),
            'std_similarity': np.std(similarities),
            'min_similarity': np.min(similarities),
            'max_similarity': np.max(similarities)
        }
    
    def _compute_similarity(self, text1: str, text2: str) -> float:
        """计算两个文本的相似度"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if len(words1) == 0 or len(words2) == 0:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union) if len(union) > 0 else 0.0


class PersonalityRLHFTrainer:
    """
    强化学习人类反馈训练器
    基于用户评分优化模型
    """
    
    def __init__(self, user_id: str, db_path: str = './self_agent.db'):
        self.user_id = user_id
        self.db_path = db_path
    
    def collect_feedback_data(self) -> List[Dict]:
        """
        收集用户反馈数据
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                agent_response,
                rating,
                feedback_type,
                feedback_text,
                suggested_response,
                context_snapshot
            FROM personality_feedback
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 500
        """, (self.user_id,))
        
        feedback_data = []
        for row in cursor.fetchall():
            feedback_data.append({
                'response': row[0],
                'rating': row[1],
                'feedback_type': row[2],
                'feedback_text': row[3],
                'suggested_response': row[4],
                'context': json.loads(row[5]) if row[5] else {}
            })
        
        conn.close()
        return feedback_data
    
    def compute_reward(self, feedback: Dict) -> float:
        """
        计算奖励信号
        """
        # 基础奖励：用户评分
        base_reward = (feedback['rating'] - 3) / 2.0  # 归一化到 [-1, 1]
        
        # 根据反馈类型调整
        type_weights = {
            'style': 1.0,
            'accuracy': 1.2,
            'emotion': 0.9,
            'relationship': 1.1,
            'general': 1.0
        }
        
        weight = type_weights.get(feedback['feedback_type'], 1.0)
        
        # 如果有改进建议，额外奖励
        if feedback.get('suggested_response'):
            weight *= 1.1
        
        return base_reward * weight
    
    def train_with_rlhf(self, model_path: str, num_iterations: int = 100):
        """
        使用 RLHF 优化模型
        
        注意：完整的 RLHF 需要 PPO 算法和奖励模型，这里是简化版本
        """
        print("RLHF training is a complex process requiring:")
        print("1. Reward model training")
        print("2. PPO (Proximal Policy Optimization)")
        print("3. Large-scale compute resources")
        print("\nFor production, consider using:")
        print("- HuggingFace TRL library")
        print("- OpenAI's RLHF implementation")
        print("\nCurrent implementation: Data collection and reward computation only")
        
        feedback_data = self.collect_feedback_data()
        
        if len(feedback_data) < 50:
            print(f"Insufficient feedback data: {len(feedback_data)} < 50")
            return
        
        # 计算平均奖励
        rewards = [self.compute_reward(fb) for fb in feedback_data]
        avg_reward = np.mean(rewards)
        
        print(f"\nFeedback Analysis:")
        print(f"  Total feedback: {len(feedback_data)}")
        print(f"  Average reward: {avg_reward:.3f}")
        print(f"  Positive feedback: {sum(1 for r in rewards if r > 0)}")
        print(f"  Negative feedback: {sum(1 for r in rewards if r < 0)}")
        
        return {
            'feedback_count': len(feedback_data),
            'avg_reward': avg_reward,
            'rewards': rewards
        }


# ==========================================
# 命令行工具
# ==========================================

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Train personality model')
    parser.add_argument('--user-id', required=True, help='User ID')
    parser.add_argument('--db-path', default='./self_agent.db', help='Database path')
    parser.add_argument('--base-model', default='google/gemma-2b', help='Base model')
    parser.add_argument('--epochs', type=int, default=3, help='Training epochs')
    parser.add_argument('--batch-size', type=int, default=4, help='Batch size')
    parser.add_argument('--min-samples', type=int, default=50, help='Minimum training samples')
    parser.add_argument('--rlhf', action='store_true', help='Run RLHF analysis')
    
    args = parser.parse_args()
    
    if args.rlhf:
        # RLHF 分析
        rlhf_trainer = PersonalityRLHFTrainer(args.user_id, args.db_path)
        rlhf_trainer.train_with_rlhf(None)
    else:
        # 标准训练
        trainer = PersonalityModelTrainer(
            user_id=args.user_id,
            db_path=args.db_path,
            base_model=args.base_model
        )
        
        # 准备数据
        dataset = trainer.prepare_training_data(min_samples=args.min_samples)
        
        # 初始化模型
        trainer.initialize_model()
        
        # 预处理
        tokenized_dataset = trainer.preprocess_dataset(dataset)
        
        # 训练
        trainer.train(
            dataset=tokenized_dataset,
            num_epochs=args.epochs,
            batch_size=args.batch_size
        )
        
        print("\n" + "="*50)
        print("Training completed successfully!")
        print("="*50)
