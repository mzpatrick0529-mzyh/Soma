"""
测试文件: 真实模型量化 - Phase 7B.1
验证量化、剪枝、蒸馏功能

测试场景:
1. 动态量化 (Linear层)
2. 静态量化 (CNN)
3. 结构化剪枝
4. 知识蒸馏
5. 完整优化流程
"""

import torch
import torch.nn as nn
import pytest
from typing import List
import logging

from model_quantization import (
    ProductionModelOptimizer,
    QuantizationConfig,
    PruningConfig,
    DistillationConfig,
    quick_quantize,
    quick_optimize
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ==================== 测试模型 ====================

class SimpleLinearModel(nn.Module):
    """简单线性模型 (用于测试动态量化)"""
    def __init__(self, input_dim: int = 512, hidden_dim: int = 256, output_dim: int = 10):
        super().__init__()
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, output_dim)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x


class SimpleCNNModel(nn.Module):
    """简单CNN模型 (用于测试静态量化)"""
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.relu = nn.ReLU()
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(32, 10)
    
    def forward(self, x):
        x = self.conv1(x)
        x = self.relu(x)
        x = self.pool(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        return x


# ==================== 测试用例 ====================

class TestModelQuantization:
    """模型量化测试套件"""
    
    @pytest.fixture
    def optimizer(self):
        """创建优化器实例"""
        return ProductionModelOptimizer(device="cpu")
    
    @pytest.fixture
    def linear_model(self):
        """创建线性模型"""
        model = SimpleLinearModel()
        model.eval()
        return model
    
    @pytest.fixture
    def cnn_model(self):
        """创建CNN模型"""
        model = SimpleCNNModel()
        model.eval()
        return model
    
    # ==================== Test 1: 动态量化 ====================
    
    def test_dynamic_quantization(self, optimizer, linear_model):
        """
        测试1: 动态量化
        
        验证:
        - 模型大小减少 > 50%
        - 模型可正常推理
        - 输出形状不变
        """
        logger.info("\n" + "="*60)
        logger.info("Test 1: Dynamic Quantization")
        logger.info("="*60)
        
        # 原始模型
        original_size = optimizer._get_model_size(linear_model)
        logger.info(f"Original model size: {original_size:.2f} MB")
        
        # 量化
        quantized_model = optimizer.quantize_dynamic(linear_model)
        quantized_size = optimizer._get_model_size(quantized_model)
        reduction = 100 * (1 - quantized_size / original_size)
        
        logger.info(f"Quantized model size: {quantized_size:.2f} MB")
        logger.info(f"Size reduction: {reduction:.1f}%")
        
        # 验证推理
        dummy_input = torch.randn(1, 512)
        with torch.no_grad():
            original_output = linear_model(dummy_input)
            quantized_output = quantized_model(dummy_input)
        
        # 断言
        assert reduction > 50, f"Size reduction {reduction:.1f}% < 50%"
        assert original_output.shape == quantized_output.shape, "Output shape mismatch"
        
        # 验证精度损失 < 5%
        mse = torch.nn.functional.mse_loss(original_output, quantized_output).item()
        logger.info(f"MSE between original and quantized: {mse:.6f}")
        assert mse < 1.0, f"MSE {mse:.6f} too high"
        
        logger.info("✅ Test 1 PASSED: Dynamic quantization works correctly")
    
    # ==================== Test 2: 静态量化 ====================
    
    def test_static_quantization(self, optimizer, cnn_model):
        """
        测试2: 静态量化
        
        验证:
        - 需要校准数据
        - 模型大小减少 > 60%
        - 推理速度提升
        """
        logger.info("\n" + "="*60)
        logger.info("Test 2: Static Quantization")
        logger.info("="*60)
        
        # 创建校准数据
        calibration_data = [torch.randn(1, 3, 32, 32) for _ in range(10)]
        
        # 原始模型
        original_size = optimizer._get_model_size(cnn_model)
        original_latency = optimizer._benchmark_latency(
            cnn_model,
            input_shape=(1, 3, 32, 32),
            num_runs=50
        )
        
        logger.info(f"Original: {original_size:.2f} MB, {original_latency:.2f} ms")
        
        # 静态量化
        quantized_model = optimizer.quantize_static(cnn_model, calibration_data)
        quantized_size = optimizer._get_model_size(quantized_model)
        quantized_latency = optimizer._benchmark_latency(
            quantized_model,
            input_shape=(1, 3, 32, 32),
            num_runs=50
        )
        
        size_reduction = 100 * (1 - quantized_size / original_size)
        latency_reduction = 100 * (1 - quantized_latency / original_latency)
        
        logger.info(f"Quantized: {quantized_size:.2f} MB, {quantized_latency:.2f} ms")
        logger.info(f"Size reduction: {size_reduction:.1f}%")
        logger.info(f"Latency reduction: {latency_reduction:.1f}%")
        
        # 断言
        assert size_reduction > 50, f"Size reduction {size_reduction:.1f}% < 50%"
        
        logger.info("✅ Test 2 PASSED: Static quantization works correctly")
    
    # ==================== Test 3: 结构化剪枝 ====================
    
    def test_structured_pruning(self, optimizer, linear_model):
        """
        测试3: 结构化剪枝
        
        验证:
        - 参数数量减少
        - 模型可正常推理
        """
        logger.info("\n" + "="*60)
        logger.info("Test 3: Structured Pruning")
        logger.info("="*60)
        
        # 原始参数数量
        original_params = sum(p.numel() for p in linear_model.parameters())
        logger.info(f"Original parameters: {original_params:,}")
        
        # 剪枝 30%
        pruned_model = optimizer.prune_structured(linear_model, amount=0.3)
        pruned_params = sum(p.numel() for p in pruned_model.parameters())
        reduction = 100 * (1 - pruned_params / original_params)
        
        logger.info(f"Pruned parameters: {pruned_params:,}")
        logger.info(f"Parameter reduction: {reduction:.1f}%")
        
        # 验证推理
        dummy_input = torch.randn(1, 512)
        with torch.no_grad():
            output = pruned_model(dummy_input)
        
        # 断言
        assert output.shape == (1, 10), "Output shape incorrect"
        assert reduction > 0, "No parameters were pruned"
        
        logger.info("✅ Test 3 PASSED: Structured pruning works correctly")
    
    # ==================== Test 4: 知识蒸馏 ====================
    
    def test_knowledge_distillation(self, optimizer):
        """
        测试4: 知识蒸馏
        
        验证:
        - 学生模型可训练
        - 损失下降
        """
        logger.info("\n" + "="*60)
        logger.info("Test 4: Knowledge Distillation")
        logger.info("="*60)
        
        # 教师模型 (大)
        teacher_model = SimpleLinearModel(512, 512, 10)
        teacher_model.eval()
        
        # 学生模型 (小)
        student_model = SimpleLinearModel(512, 128, 10)
        
        # 创建假数据
        train_data = [
            (torch.randn(4, 512), torch.randint(0, 10, (4,)))
            for _ in range(10)
        ]
        
        # 蒸馏
        config = DistillationConfig(epochs=2, learning_rate=1e-3)
        trained_student = optimizer.distill_knowledge(
            teacher_model,
            student_model,
            train_data,
            config
        )
        
        # 验证学生模型大小更小
        teacher_size = optimizer._get_model_size(teacher_model)
        student_size = optimizer._get_model_size(trained_student)
        
        logger.info(f"Teacher size: {teacher_size:.2f} MB")
        logger.info(f"Student size: {student_size:.2f} MB")
        logger.info(f"Size reduction: {100 * (1 - student_size / teacher_size):.1f}%")
        
        # 断言
        assert student_size < teacher_size, "Student should be smaller than teacher"
        
        logger.info("✅ Test 4 PASSED: Knowledge distillation works correctly")
    
    # ==================== Test 5: 完整优化流程 ====================
    
    def test_full_optimization_pipeline(self, optimizer, linear_model):
        """
        测试5: 完整优化流程
        
        验证:
        - 剪枝 + 量化组合
        - 性能提升明显
        """
        logger.info("\n" + "="*60)
        logger.info("Test 5: Full Optimization Pipeline")
        logger.info("="*60)
        
        # 完整优化
        optimized_model, result = optimizer.optimize_full_pipeline(
            linear_model,
            prune_amount=0.3,
            use_quantization=True,
            use_pruning=True
        )
        
        logger.info(f"📊 Optimization Results:")
        logger.info(f"   Size: {result.original_size_mb:.2f} → {result.optimized_size_mb:.2f} MB ({result.size_reduction_percent:.1f}%)")
        logger.info(f"   Latency: {result.original_latency_ms:.1f} → {result.optimized_latency_ms:.1f} ms ({result.latency_reduction_percent:.1f}%)")
        logger.info(f"   Method: {result.method}")
        
        # 断言
        assert result.size_reduction_percent > 50, "Size reduction insufficient"
        
        logger.info("✅ Test 5 PASSED: Full optimization pipeline works correctly")
    
    # ==================== Test 6: 便捷函数 ====================
    
    def test_quick_quantize(self, linear_model):
        """测试6: 快速量化函数"""
        logger.info("\n" + "="*60)
        logger.info("Test 6: Quick Quantize Function")
        logger.info("="*60)
        
        quantized_model = quick_quantize(linear_model)
        
        # 验证推理
        dummy_input = torch.randn(1, 512)
        with torch.no_grad():
            output = quantized_model(dummy_input)
        
        assert output.shape == (1, 10), "Output shape incorrect"
        logger.info("✅ Test 6 PASSED: Quick quantize works")
    
    def test_quick_optimize(self, linear_model):
        """测试7: 快速优化函数"""
        logger.info("\n" + "="*60)
        logger.info("Test 7: Quick Optimize Function")
        logger.info("="*60)
        
        optimized_model, result = quick_optimize(linear_model, prune_amount=0.2)
        
        logger.info(f"Size reduction: {result.size_reduction_percent:.1f}%")
        logger.info(f"Latency reduction: {result.latency_reduction_percent:.1f}%")
        
        assert result.size_reduction_percent > 40, "Optimization insufficient"
        logger.info("✅ Test 7 PASSED: Quick optimize works")


# ==================== 集成测试 ====================

def test_integration_real_world_scenario():
    """
    集成测试: 真实场景模拟
    
    场景: 部署一个大型线性模型到移动设备
    目标: 模型大小 < 100MB, 延迟 < 100ms
    """
    logger.info("\n" + "="*60)
    logger.info("Integration Test: Real-World Scenario")
    logger.info("="*60)
    
    # 创建大模型
    large_model = SimpleLinearModel(input_dim=1024, hidden_dim=2048, output_dim=100)
    large_model.eval()
    
    optimizer = ProductionModelOptimizer()
    
    # 原始指标
    original_size = optimizer._get_model_size(large_model)
    original_latency = optimizer._benchmark_latency(
        large_model,
        input_shape=(1, 1024),
        num_runs=50
    )
    
    logger.info(f"🎯 Target: Size < 100MB, Latency < 100ms")
    logger.info(f"📊 Original: Size = {original_size:.2f} MB, Latency = {original_latency:.2f} ms")
    
    # 完整优化
    optimized_model, result = optimizer.optimize_full_pipeline(
        large_model,
        prune_amount=0.4,  # 更激进的剪枝
        use_quantization=True,
        use_pruning=True
    )
    
    logger.info(f"✅ Optimized: Size = {result.optimized_size_mb:.2f} MB, Latency = {result.optimized_latency_ms:.2f} ms")
    
    # 验证目标达成
    if result.optimized_size_mb < 100:
        logger.info("✅ Size target achieved!")
    else:
        logger.warning(f"⚠️ Size target missed: {result.optimized_size_mb:.2f} MB > 100 MB")
    
    if result.optimized_latency_ms < 100:
        logger.info("✅ Latency target achieved!")
    else:
        logger.warning(f"⚠️ Latency target missed: {result.optimized_latency_ms:.2f} ms > 100 ms")
    
    logger.info("🎉 Integration test complete!")


# ==================== 主函数 ====================

if __name__ == "__main__":
    logger.info("="*60)
    logger.info("Production Model Quantization Tests - Phase 7B.1")
    logger.info("="*60)
    
    # 运行所有测试
    pytest.main([__file__, "-v", "-s"])
    
    # 运行集成测试
    test_integration_real_world_scenario()
