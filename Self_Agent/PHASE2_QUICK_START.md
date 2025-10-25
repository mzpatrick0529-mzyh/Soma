# Phase 2 快速使用指南

## 🎯 Phase 2核心功能

### 1. 训练样本增强 (Sample Augmentation)
将原始训练样本扩充3-5倍,提高训练数据质量和多样性。

### 2. 多任务训练 (Multi-Task Training)
联合优化4个损失函数:
- **Generation Loss**: 标准文本生成
- **Style Consistency Loss**: 风格一致性约束
- **Relationship-Aware Loss**: 关系感知适配
- **Contrastive Loss**: 正负样本对比学习

---

## 🚀 快速开始

### Step 1: 样本增强

```bash
# 方式1: 直接调用Python脚本
cd Self_Agent
python3 src/ml/sample_augmenter.py \
  --user-id default \
  --db-path ./self_agent.db \
  --multiplier 3.0

# 方式2: 通过API
curl -X POST http://127.0.0.1:8787/api/self-agent/multitask/augment-samples \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default",
    "multiplier": 3.0
  }'
```

**输出示例**:
```
🔄 [Augmentation] Starting comprehensive sample augmentation for user: default
   📊 Loaded 100 original samples
   🎯 Target: 300 samples (need 200 augmented)
   ✓ Generated 66 style-transferred samples
   ✓ Generated 66 scenario-variant samples
   ✓ Generated 50 relationship-variant samples
   ✓ Mined 50 hard negative samples
   ✅ Total enhanced samples: 332
   📈 Augmentation ratio: 3.32x
```

### Step 2: 查看增强统计

```bash
curl http://127.0.0.1:8787/api/self-agent/multitask/augmentation-stats/default
```

**响应示例**:
```json
{
  "success": true,
  "userId": "default",
  "typeDistribution": [
    {"augmentation_type": "original", "count": 100, "avg_quality": 0.75},
    {"augmentation_type": "style_transfer", "count": 66, "avg_quality": 0.68},
    {"augmentation_type": "scenario", "count": 66, "avg_quality": 0.64},
    {"augmentation_type": "relationship", "count": 50, "avg_quality": 0.60},
    {"augmentation_type": "hard_negative", "count": 50, "avg_quality": 0.30}
  ],
  "qualityDistribution": [
    {"quality_level": "high", "count": 120},
    {"quality_level": "medium", "count": 162},
    {"quality_level": "low", "count": 50}
  ],
  "totalSamples": 332
}
```

### Step 3: 多任务训练

```bash
# 方式1: 直接调用Python脚本
python3 src/ml/multitask_trainer.py \
  --user-id default \
  --db-path ./self_agent.db \
  --epochs 3 \
  --batch-size 4 \
  --use-augmented \
  --gen-loss-weight 1.0 \
  --style-loss-weight 0.3 \
  --relation-loss-weight 0.2 \
  --contrastive-loss-weight 0.1

# 方式2: 通过API
curl -X POST http://127.0.0.1:8787/api/self-agent/multitask/train-multitask \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "default",
    "epochs": 3,
    "batchSize": 4,
    "useAugmented": true,
    "genLossWeight": 1.0,
    "styleLossWeight": 0.3,
    "relationLossWeight": 0.2,
    "contrastiveLossWeight": 0.1
  }'
```

**训练日志示例**:
```
================================================================================
🎯 Starting Multi-Task Persona Training
================================================================================
✓ Loaded 299 training samples, 33 validation samples
✓ Extracted user style profile
✓ Built relationship map with 5 persons
✓ Initialized model: gemini-2.0-flash-exp

📈 Epoch 1/3
   Step 0/74 - Loss: 1.2345 (Gen: 1.10, Style: 0.35, Rel: 0.15, Contra: 0.08)
   Step 50/74 - Loss: 0.8712 (Gen: 0.75, Style: 0.28, Rel: 0.10, Contra: 0.05)
   Train Loss: 0.9234, Val Loss: 0.9100
   ✓ New best model saved

📈 Epoch 2/3
   Train Loss: 0.7821, Val Loss: 0.8450
   ✓ New best model saved

📈 Epoch 3/3
   Train Loss: 0.6912, Val Loss: 0.8200
   ✓ New best model saved

================================================================================
✅ Training Completed Successfully!
   Best Val Loss: 0.8200
   Model saved to: ./models/default/final-1737705600000
================================================================================
```

### Step 4: 模型对比

```bash
curl http://127.0.0.1:8787/api/self-agent/multitask/model-comparison/default
```

**响应示例**:
```json
{
  "success": true,
  "userId": "default",
  "totalModels": 2,
  "comparison": {
    "latest": {
      "model_version": "v1737705600000",
      "model_type": "lora",
      "training_loss": 0.82,
      "training_samples_count": 332,
      "created_at": 1737705600000
    },
    "previous": {
      "model_version": "v1737600000000",
      "model_type": "lora",
      "training_loss": 1.15,
      "training_samples_count": 100,
      "created_at": 1737600000000
    },
    "improvement": {
      "lossReduction": "28.70%",
      "samplesIncrease": 232
    }
  }
}
```

---

## 📊 增强策略详解

### 1. Style Transfer (风格迁移)
保持语义不变,改变表达风格:
- 正式 ↔ 非正式
- 简洁 ↔ 详细
- 直接 ↔ 委婉

### 2. Scenario Variants (场景泛化)
相同内容在不同情境:
- 工作场合 vs 休闲时刻
- 办公室 vs 家里
- 平静 vs 兴奋状态

### 3. Relationship Variants (关系对比)
同一内容对不同人的表达:
- 陌生人: 更正式、保守
- 亲密朋友: 更随意、开放
- 权威人物: 更谨慎、礼貌

### 4. Hard Negatives (困难负样本)
用于对比学习:
- 语义相近但风格不符
- 事实正确但情感不匹配
- 其他用户的相似场景回复

---

## 🎛️ 超参数调优建议

### 损失权重
```python
# 基础配置 (平衡型)
gen_loss_weight = 1.0
style_loss_weight = 0.3
relation_loss_weight = 0.2
contrastive_loss_weight = 0.1

# 强调风格一致性
style_loss_weight = 0.5

# 强调关系适配
relation_loss_weight = 0.4

# 强调对比学习 (数据量大时)
contrastive_loss_weight = 0.2
```

### 数据增强倍数
```python
# 数据稀缺 (< 100 samples)
multiplier = 5.0

# 数据充足 (> 200 samples)
multiplier = 2.0

# 数据丰富 (> 500 samples)
multiplier = 1.5
```

### 训练轮数
```python
# 小数据集
epochs = 5

# 中等数据集
epochs = 3

# 大数据集
epochs = 2
```

---

## 🔧 故障排查

### 问题1: 样本数不足
```
Error: Insufficient samples: 30 < 50
```
**解决**:
```bash
# 先生成原始样本
curl -X POST http://127.0.0.1:8787/api/self-agent/training/generate-samples \
  -H "Content-Type: application/json" \
  -d '{"userId":"default","source":"all","maxSamples":200}'

# 再执行增强
curl -X POST http://127.0.0.1:8787/api/self-agent/multitask/augment-samples \
  -d '{"userId":"default","multiplier":3.0}'
```

### 问题2: Python依赖缺失
```
ModuleNotFoundError: No module named 'numpy'
```
**解决**:
```bash
# 安装依赖
pip3 install numpy

# 或安装全部ML依赖
pip3 install -r Self_Agent/requirements.txt
```

### 问题3: 训练过程中断
**解决**: 训练支持断点续训 (TODO: 实现checkpoint恢复)

---

## 📈 效果评估

### 定量指标
- **训练损失下降**: 期望 > 25%
- **验证损失**: 应低于训练损失 (避免过拟合)
- **样本利用率**: 增强后应达到 2-5x

### 定性评估
1. 风格一致性: 生成文本是否符合用户习惯
2. 关系适配性: 对不同人是否有差异化表现
3. 语义准确性: 回复内容是否符合上下文

### A/B测试
使用评测系统对比新旧模型:
```bash
curl http://127.0.0.1:8787/api/self-agent/eval/batch-evaluate \
  -d '{
    "userId": "default",
    "testSamples": [...],
    "modelVersions": ["v_old", "v_new"]
  }'
```

---

## 🎯 下一步

- [ ] Phase 3: 推理引擎优化 (上下文感知推理)
- [ ] Phase 4: 评估与反馈闭环
- [ ] Phase 5: 生产部署优化

---

## 💡 最佳实践

1. **先增强,再训练**: 确保数据量足够
2. **监控损失**: 各项损失应协同下降
3. **早期停止**: 避免过拟合
4. **版本对比**: 每次训练后对比效果
5. **持续迭代**: 根据反馈调整权重

---

## 📞 支持

遇到问题? 查看日志:
```bash
# Python训练日志
tail -f models/default/final-*/train.log

# 服务器日志
npm run dev --prefix Self_Agent
```
