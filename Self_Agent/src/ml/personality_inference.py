#!/usr/bin/env python3
"""
人格推理引擎 - Personality Inference Engine
用于加载训练好的人格模型并生成个性化回复
"""

import os
import json
import sqlite3
from typing import List, Dict, Optional, Tuple
import sys
from dataclasses import dataclass

try:
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from peft import PeftModel
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("Warning: PyTorch not installed. Run: pip install torch transformers peft")


@dataclass
class InferenceConfig:
    """推理配置"""
    max_new_tokens: int = 150
    temperature: float = 0.8
    top_p: float = 0.92
    top_k: int = 50
    repetition_penalty: float = 1.15
    do_sample: bool = True
    num_beams: int = 1


class PersonalityInferenceEngine:
    """人格推理引擎"""
    
    def __init__(
        self,
        user_id: str,
        db_path: str = './self_agent.db',
        base_model: str = "google/gemma-2b",
        model_path: Optional[str] = None
    ):
        """
        初始化推理引擎
        
        Args:
            user_id: 用户ID
            db_path: 数据库路径
            base_model: 基础模型名称
            model_path: LoRA模型路径（如果为None，从数据库查找最新版本）
        """
        if not HAS_TORCH:
            raise ImportError("PyTorch not installed. Cannot perform inference.")
        
        self.user_id = user_id
        self.db_path = db_path
        self.base_model = base_model
        
        # 如果未指定模型路径，从数据库加载最新版本
        if model_path is None:
            model_path = self._get_latest_model_path()
            if model_path is None:
                raise ValueError(
                    f"No trained model found for user {user_id}. "
                    f"Please train a model first."
                )
        
        self.model_path = model_path
        
        # 加载模型
        print(f"🔄 Loading personality model for user: {user_id}")
        print(f"   Base model: {base_model}")
        print(f"   LoRA adapter: {model_path}")
        
        self.tokenizer = AutoTokenizer.from_pretrained(base_model)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # 加载基础模型
        self.base = AutoModelForCausalLM.from_pretrained(
            base_model,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            device_map="auto" if torch.cuda.is_available() else None,
            low_cpu_mem_usage=True
        )
        
        # 加载LoRA权重
        self.model = PeftModel.from_pretrained(self.base, model_path)
        self.model.eval()  # 设置为评估模式
        
        print(f"✅ Model loaded successfully!")
        print(f"   Device: {'CUDA' if torch.cuda.is_available() else 'CPU'}")
        
    def _get_latest_model_path(self) -> Optional[str]:
        """从数据库获取最新的模型路径"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT model_path 
            FROM personality_models
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
        """, (self.user_id,))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result else None
    
    def generate_response(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        relevant_memories: Optional[List[str]] = None,
        persona_prompt: Optional[str] = None,
        config: Optional[InferenceConfig] = None
    ) -> Tuple[str, Dict]:
        """
        生成个性化回复
        
        Args:
            message: 当前输入消息
            conversation_history: 对话历史 [{"role": "user/assistant", "content": "..."}]
            relevant_memories: 相关记忆（从RAG检索）
            config: 推理配置
            
        Returns:
            (response, metadata): 回复内容和元数据
        """
        if config is None:
            config = InferenceConfig()
        
        # 构建输入提示
        prompt = self._build_prompt(message, conversation_history, relevant_memories, persona_prompt)
        
        # Tokenize
        inputs = self.tokenizer(prompt, return_tensors='pt', truncation=True, max_length=2048)
        
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}
        
        # 生成
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=config.max_new_tokens,
                temperature=config.temperature,
                top_p=config.top_p,
                top_k=config.top_k,
                repetition_penalty=config.repetition_penalty,
                do_sample=config.do_sample,
                num_beams=config.num_beams,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        # 解码
        full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # 提取回复部分（去除prompt）
        response = self._extract_response(full_response, prompt)
        
        # 元数据
        metadata = {
            'model_path': self.model_path,
            'prompt_length': len(inputs['input_ids'][0]),
            'response_length': len(self.tokenizer.encode(response)),
            'temperature': config.temperature,
            'used_memories': len(relevant_memories) if relevant_memories else 0
        }
        
        return response, metadata
    
    def _build_prompt(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]],
        relevant_memories: Optional[List[str]],
        persona_prompt: Optional[str] = None
    ) -> str:
        """构建推理提示"""
        parts = []

        # 0. 人格与可用数据源（若传入）
        if persona_prompt:
            parts.append("### 人格与可用数据源\n" + persona_prompt.strip())
        
        # 1. 相关记忆上下文（如果有）
        if relevant_memories and len(relevant_memories) > 0:
            parts.append("### 相关记忆背景:")
            for i, memory in enumerate(relevant_memories[:3], 1):  # 最多3条
                parts.append(f"{i}. {memory[:200]}...")  # 截断过长记忆
            parts.append("")
        
        # 2. 对话历史（如果有）
        if conversation_history and len(conversation_history) > 0:
            parts.append("### 对话历史:")
            for turn in conversation_history[-5:]:  # 最近5轮对话
                role = "我" if turn['role'] == 'assistant' else "对方"
                parts.append(f"{role}: {turn['content']}")
            parts.append("")
        
        # 3. 当前消息
        parts.append("### 当前消息:")
        parts.append(f"对方: {message}")
        parts.append("")
        
        # 4. 生成指令
        parts.append("### 回复:")
        
        return "\n".join(parts)
    
    def _extract_response(self, full_text: str, prompt: str) -> str:
        """从生成的完整文本中提取回复部分"""
        # 尝试找到"### 回复:"之后的内容
        if "### 回复:" in full_text:
            response = full_text.split("### 回复:")[-1].strip()
        else:
            # 如果找不到标记，尝试移除prompt
            response = full_text[len(prompt):].strip()
        
        # 清理可能的多余标记
        response = response.replace(self.tokenizer.eos_token, "")
        response = response.strip()
        
        # 如果回复太短，可能是生成失败
        if len(response) < 2:
            return "[模型未能生成有效回复]"
        
        return response
    
    def batch_generate(
        self,
        messages: List[str],
        config: Optional[InferenceConfig] = None,
        batch_size: int = 4
    ) -> List[Tuple[str, Dict]]:
        """
        批量生成回复（用于评估）
        
        Args:
            messages: 消息列表
            config: 推理配置
            batch_size: 批次大小
            
        Returns:
            [(response, metadata), ...]: 回复列表
        """
        results = []
        
        for i in range(0, len(messages), batch_size):
            batch = messages[i:i+batch_size]
            
            for msg in batch:
                response, metadata = self.generate_response(msg, config=config)
                results.append((response, metadata))
        
        return results


def test_inference():
    """测试推理引擎"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Test personality inference')
    parser.add_argument('--user-id', required=True, help='User ID')
    parser.add_argument('--message', required=True, help='Input message')
    parser.add_argument('--db-path', default='./self_agent.db', help='Database path')
    parser.add_argument('--temperature', type=float, default=0.8, help='Sampling temperature')
    parser.add_argument('--stdin-json', action='store_true', help='Read JSON context from stdin')
    
    args = parser.parse_args()

    # 读取 stdin 上下文（可选）
    persona_prompt: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    relevant_memories: Optional[List[str]] = None
    if args.stdin_json:
        try:
            raw = sys.stdin.read()
            if raw:
                ctx = json.loads(raw)
                persona_prompt = ctx.get('personaPrompt')
                conversation_history = ctx.get('conversationHistory')
                relevant_memories = ctx.get('relevantMemories')
                # 若 stdin 里也提供 message，优先使用
                if 'message' in ctx:
                    args.message = ctx['message']
        except Exception as e:
            print(f"Warning: failed to parse stdin JSON: {e}")

    # 创建推理引擎
    engine = PersonalityInferenceEngine(
        user_id=args.user_id,
        db_path=args.db_path
    )
    
    # 生成回复
    config = InferenceConfig(temperature=args.temperature)
    response, metadata = engine.generate_response(
        args.message,
        conversation_history=conversation_history,
        relevant_memories=relevant_memories,
        persona_prompt=persona_prompt,
        config=config
    )
    
    print(f"\n{'='*60}")
    print(f"💬 输入: {args.message}")
    print(f"🤖 回复: {response}")
    print(f"{'='*60}")
    print(f"\n📊 元数据:")
    for key, value in metadata.items():
        print(f"   {key}: {value}")


if __name__ == '__main__':
    test_inference()
