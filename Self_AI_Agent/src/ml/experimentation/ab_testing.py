"""
A/B Testing Framework - Phase 7B.2
生产级A/B测试和多变量实验系统

核心功能:
1. 一致性哈希分组 (Consistent Hashing)
2. 统计显著性检验 (t-test, Chi-squared, Mann-Whitney U)
3. 多臂老虎机 (Thompson Sampling, UCB1)
4. 实验追踪和可视化
5. 自动停止 (Early Stopping)

科学依据:
- Frequentist Statistics: t-test, p-value < 0.05
- Bayesian Statistics: Thompson Sampling
- Effect Size: Cohen's d, Hedge's g
- Sample Size: Power Analysis (α=0.05, β=0.20)

使用场景:
- 模型版本对比 (Model A vs Model B)
- 超参数调优 (Temperature 0.7 vs 0.9)
- 特征实验 (With/Without Knowledge Graph)
"""

import hashlib
import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import json
from pathlib import Path

import numpy as np
from scipy import stats

logger = logging.getLogger(__name__)


# ==================== 枚举类型 ====================

class ExperimentStatus(Enum):
    """实验状态"""
    DRAFT = "draft"              # 草稿
    RUNNING = "running"          # 运行中
    PAUSED = "paused"            # 暂停
    COMPLETED = "completed"      # 完成
    STOPPED = "stopped"          # 停止 (早期停止)


class MetricType(Enum):
    """指标类型"""
    CONVERSION = "conversion"    # 转化率 (0/1)
    CONTINUOUS = "continuous"    # 连续值 (延迟, 准确率)
    COUNT = "count"              # 计数 (点击数)


class BanditAlgorithm(Enum):
    """多臂老虎机算法"""
    THOMPSON_SAMPLING = "thompson"  # Thompson采样 (贝叶斯)
    UCB1 = "ucb1"                   # Upper Confidence Bound
    EPSILON_GREEDY = "epsilon"      # ε-贪婪


# ==================== 配置类 ====================

@dataclass
class VariantConfig:
    """变体配置"""
    name: str                          # 变体名称 (control, treatment_a, treatment_b)
    allocation: float = 0.0            # 分配比例 (0-1)
    parameters: Dict[str, Any] = field(default_factory=dict)  # 变体参数
    
    def __post_init__(self):
        if not 0 <= self.allocation <= 1:
            raise ValueError(f"Allocation must be in [0, 1], got {self.allocation}")


@dataclass
class ExperimentConfig:
    """实验配置"""
    name: str                                    # 实验名称
    variants: List[VariantConfig]                # 变体列表
    metric_name: str                             # 主要指标名称
    metric_type: MetricType                      # 指标类型
    
    # 统计参数
    alpha: float = 0.05                          # 显著性水平 (Type I错误)
    power: float = 0.80                          # 统计功效 (1 - Type II错误)
    minimum_detectable_effect: float = 0.05      # 最小可检测效应 (5%)
    
    # 实验控制
    min_sample_size: int = 100                   # 最小样本量
    max_duration_hours: int = 168                # 最大持续时间 (7天)
    check_frequency_hours: int = 24              # 检查频率 (每天)
    
    # 多臂老虎机
    use_bandit: bool = False                     # 是否使用多臂老虎机
    bandit_algorithm: BanditAlgorithm = BanditAlgorithm.THOMPSON_SAMPLING
    bandit_warmup_samples: int = 50              # 预热样本数
    
    def __post_init__(self):
        # 验证分配比例总和为1
        total_allocation = sum(v.allocation for v in self.variants)
        if not np.isclose(total_allocation, 1.0, atol=1e-6):
            raise ValueError(f"Variant allocations must sum to 1, got {total_allocation}")
        
        # 至少2个变体
        if len(self.variants) < 2:
            raise ValueError("Need at least 2 variants (control + treatment)")


@dataclass
class ExperimentResult:
    """实验结果"""
    experiment_id: str
    status: ExperimentStatus
    
    # 统计结果
    variant_stats: Dict[str, Dict[str, float]]   # {variant: {mean, std, count}}
    p_value: float = 1.0                         # p值
    confidence_interval: Tuple[float, float] = (0.0, 0.0)  # 置信区间
    effect_size: float = 0.0                     # 效应大小 (Cohen's d)
    
    # 决策
    is_significant: bool = False                 # 是否显著
    winner: Optional[str] = None                 # 获胜变体
    
    # 元数据
    sample_sizes: Dict[str, int] = field(default_factory=dict)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            'experiment_id': self.experiment_id,
            'status': self.status.value,
            'variant_stats': self.variant_stats,
            'p_value': self.p_value,
            'confidence_interval': list(self.confidence_interval),
            'effect_size': self.effect_size,
            'is_significant': self.is_significant,
            'winner': self.winner,
            'sample_sizes': self.sample_sizes,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None
        }


# ==================== 统计测试类 ====================

class StatisticalTest:
    """
    统计显著性检验
    
    支持的测试:
    1. t-test (连续指标, 正态分布)
    2. Mann-Whitney U (连续指标, 非正态)
    3. Chi-squared (分类指标, 转化率)
    """
    
    @staticmethod
    def t_test(
        control_data: np.ndarray,
        treatment_data: np.ndarray,
        alpha: float = 0.05
    ) -> Tuple[float, bool, float]:
        """
        独立样本t检验
        
        假设:
        - 数据近似正态分布
        - 方差齐性
        
        Returns:
            (p_value, is_significant, effect_size)
        """
        # Welch's t-test (不假设方差相等)
        t_stat, p_value = stats.ttest_ind(
            control_data,
            treatment_data,
            equal_var=False
        )
        
        # Cohen's d (效应大小)
        pooled_std = np.sqrt(
            (np.var(control_data) + np.var(treatment_data)) / 2
        )
        effect_size = (np.mean(treatment_data) - np.mean(control_data)) / (pooled_std + 1e-8)
        
        is_significant = p_value < alpha
        
        return p_value, is_significant, effect_size
    
    @staticmethod
    def mann_whitney_u(
        control_data: np.ndarray,
        treatment_data: np.ndarray,
        alpha: float = 0.05
    ) -> Tuple[float, bool]:
        """
        Mann-Whitney U检验 (非参数)
        
        优点:
        - 不假设正态分布
        - 对异常值鲁棒
        
        Returns:
            (p_value, is_significant)
        """
        u_stat, p_value = stats.mannwhitneyu(
            control_data,
            treatment_data,
            alternative='two-sided'
        )
        
        is_significant = p_value < alpha
        
        return p_value, is_significant
    
    @staticmethod
    def chi_squared(
        control_conversions: int,
        control_total: int,
        treatment_conversions: int,
        treatment_total: int,
        alpha: float = 0.05
    ) -> Tuple[float, bool, float]:
        """
        卡方检验 (转化率)
        
        适用于:
        - 二分类结果 (转化/未转化)
        - 计数数据
        
        Returns:
            (p_value, is_significant, relative_lift)
        """
        # 构建列联表
        observed = np.array([
            [control_conversions, control_total - control_conversions],
            [treatment_conversions, treatment_total - treatment_conversions]
        ])
        
        chi2, p_value, _, _ = stats.chi2_contingency(observed)
        
        # 相对提升
        control_rate = control_conversions / (control_total + 1e-8)
        treatment_rate = treatment_conversions / (treatment_total + 1e-8)
        relative_lift = (treatment_rate - control_rate) / (control_rate + 1e-8)
        
        is_significant = p_value < alpha
        
        return p_value, is_significant, relative_lift
    
    @staticmethod
    def confidence_interval(
        data: np.ndarray,
        confidence: float = 0.95
    ) -> Tuple[float, float]:
        """
        计算置信区间
        
        Args:
            data: 数据
            confidence: 置信水平 (0.95 = 95%)
        
        Returns:
            (lower_bound, upper_bound)
        """
        mean = np.mean(data)
        std_err = stats.sem(data)
        ci = stats.t.interval(
            confidence,
            len(data) - 1,
            loc=mean,
            scale=std_err
        )
        return ci
    
    @staticmethod
    def calculate_sample_size(
        baseline_rate: float,
        minimum_detectable_effect: float,
        alpha: float = 0.05,
        power: float = 0.80
    ) -> int:
        """
        计算所需样本量
        
        使用: 双样本比例检验的样本量公式
        
        Args:
            baseline_rate: 基线转化率
            minimum_detectable_effect: 最小可检测效应 (相对提升)
            alpha: 显著性水平
            power: 统计功效
        
        Returns:
            每组所需样本量
        """
        # Z值
        z_alpha = stats.norm.ppf(1 - alpha / 2)
        z_beta = stats.norm.ppf(power)
        
        # 转化率
        p1 = baseline_rate
        p2 = baseline_rate * (1 + minimum_detectable_effect)
        p_avg = (p1 + p2) / 2
        
        # 样本量公式
        n = (
            (z_alpha * np.sqrt(2 * p_avg * (1 - p_avg)) + 
             z_beta * np.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
        ) / ((p2 - p1) ** 2)
        
        return int(np.ceil(n))


# ==================== 多臂老虎机类 ====================

class MultiArmedBandit:
    """
    多臂老虎机算法
    
    算法:
    1. Thompson Sampling (贝叶斯): Beta分布采样
    2. UCB1 (频率派): 置信上界
    3. ε-Greedy: 探索-利用权衡
    """
    
    def __init__(
        self,
        variant_names: List[str],
        algorithm: BanditAlgorithm = BanditAlgorithm.THOMPSON_SAMPLING,
        epsilon: float = 0.1
    ):
        self.variant_names = variant_names
        self.algorithm = algorithm
        self.epsilon = epsilon
        
        # 统计数据
        self.successes = {v: 1 for v in variant_names}  # Beta先验 (1, 1)
        self.failures = {v: 1 for v in variant_names}
        self.pulls = {v: 0 for v in variant_names}
    
    def select_variant(self) -> str:
        """
        选择变体
        
        Returns:
            选中的变体名称
        """
        if self.algorithm == BanditAlgorithm.THOMPSON_SAMPLING:
            return self._thompson_sampling()
        elif self.algorithm == BanditAlgorithm.UCB1:
            return self._ucb1()
        elif self.algorithm == BanditAlgorithm.EPSILON_GREEDY:
            return self._epsilon_greedy()
        else:
            raise ValueError(f"Unknown algorithm: {self.algorithm}")
    
    def update(self, variant: str, reward: float):
        """
        更新统计数据
        
        Args:
            variant: 变体名称
            reward: 奖励 (0或1)
        """
        self.pulls[variant] += 1
        
        if reward > 0:
            self.successes[variant] += 1
        else:
            self.failures[variant] += 1
    
    def _thompson_sampling(self) -> str:
        """
        Thompson Sampling
        
        原理:
        - 为每个变体从Beta分布采样
        - 选择采样值最大的变体
        - Beta(α, β): α=successes, β=failures
        """
        samples = {}
        for variant in self.variant_names:
            alpha = self.successes[variant]
            beta = self.failures[variant]
            samples[variant] = np.random.beta(alpha, beta)
        
        return max(samples, key=samples.get)
    
    def _ucb1(self) -> str:
        """
        UCB1 (Upper Confidence Bound)
        
        原理:
        - UCB = mean + sqrt(2 * log(total_pulls) / variant_pulls)
        - 选择UCB最大的变体
        """
        total_pulls = sum(self.pulls.values())
        
        if total_pulls == 0:
            return np.random.choice(self.variant_names)
        
        ucb_scores = {}
        for variant in self.variant_names:
            pulls = self.pulls[variant]
            
            if pulls == 0:
                ucb_scores[variant] = float('inf')
            else:
                mean = self.successes[variant] / (self.successes[variant] + self.failures[variant])
                exploration = np.sqrt(2 * np.log(total_pulls) / pulls)
                ucb_scores[variant] = mean + exploration
        
        return max(ucb_scores, key=ucb_scores.get)
    
    def _epsilon_greedy(self) -> str:
        """
        ε-Greedy
        
        原理:
        - 以概率ε随机探索
        - 以概率1-ε选择最优变体
        """
        if np.random.random() < self.epsilon:
            # 探索
            return np.random.choice(self.variant_names)
        else:
            # 利用
            rates = {
                v: self.successes[v] / (self.successes[v] + self.failures[v])
                for v in self.variant_names
            }
            return max(rates, key=rates.get)


# ==================== 主框架类 ====================

class ABTestingFramework:
    """
    A/B测试框架
    
    功能:
    1. 创建实验
    2. 分配用户到变体 (一致性哈希)
    3. 记录指标
    4. 统计分析
    5. 自动停止 (早期停止)
    6. 多臂老虎机
    
    使用示例:
    ```python
    framework = ABTestingFramework()
    
    # 创建实验
    config = ExperimentConfig(
        name="model_version_test",
        variants=[
            VariantConfig("control", 0.5),
            VariantConfig("treatment", 0.5)
        ],
        metric_name="accuracy",
        metric_type=MetricType.CONTINUOUS
    )
    exp_id = framework.create_experiment(config)
    
    # 分配用户
    variant = framework.assign_variant("user_123", exp_id)
    
    # 记录指标
    framework.log_metric(exp_id, "user_123", variant, 0.95)
    
    # 分析结果
    result = framework.analyze_experiment(exp_id)
    print(f"Winner: {result.winner}, p-value: {result.p_value}")
    ```
    """
    
    def __init__(self, storage_path: Optional[Path] = None):
        """
        初始化框架
        
        Args:
            storage_path: 实验数据存储路径
        """
        self.storage_path = storage_path or Path("./experiments")
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # 实验存储
        self.experiments: Dict[str, ExperimentConfig] = {}
        self.experiment_data: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: defaultdict(list))
        self.user_assignments: Dict[str, Dict[str, str]] = defaultdict(dict)  # {exp_id: {user_id: variant}}
        self.experiment_status: Dict[str, ExperimentStatus] = {}
        self.experiment_start_time: Dict[str, datetime] = {}
        
        # 多臂老虎机
        self.bandits: Dict[str, MultiArmedBandit] = {}
        
        logger.info(f"✅ ABTestingFramework initialized (storage={self.storage_path})")
    
    # ==================== 实验管理 ====================
    
    def create_experiment(self, config: ExperimentConfig) -> str:
        """
        创建实验
        
        Args:
            config: 实验配置
        
        Returns:
            experiment_id
        """
        # 生成实验ID
        exp_id = f"{config.name}_{int(time.time())}"
        
        # 存储配置
        self.experiments[exp_id] = config
        self.experiment_status[exp_id] = ExperimentStatus.DRAFT
        self.experiment_start_time[exp_id] = datetime.now()
        
        # 初始化多臂老虎机
        if config.use_bandit:
            variant_names = [v.name for v in config.variants]
            self.bandits[exp_id] = MultiArmedBandit(
                variant_names,
                algorithm=config.bandit_algorithm
            )
        
        logger.info(f"✅ Experiment created: {exp_id}")
        logger.info(f"   - Variants: {[v.name for v in config.variants]}")
        logger.info(f"   - Metric: {config.metric_name} ({config.metric_type.value})")
        logger.info(f"   - Use bandit: {config.use_bandit}")
        
        return exp_id
    
    def start_experiment(self, exp_id: str):
        """开始实验"""
        if exp_id not in self.experiments:
            raise ValueError(f"Experiment {exp_id} not found")
        
        self.experiment_status[exp_id] = ExperimentStatus.RUNNING
        self.experiment_start_time[exp_id] = datetime.now()
        
        logger.info(f"▶️ Experiment started: {exp_id}")
    
    def stop_experiment(self, exp_id: str, reason: str = "manual"):
        """停止实验"""
        if exp_id not in self.experiments:
            raise ValueError(f"Experiment {exp_id} not found")
        
        self.experiment_status[exp_id] = ExperimentStatus.STOPPED
        
        logger.info(f"⏹️ Experiment stopped: {exp_id} (reason: {reason})")
    
    # ==================== 用户分配 ====================
    
    def assign_variant(self, user_id: str, exp_id: str) -> str:
        """
        分配用户到变体
        
        使用一致性哈希保证:
        - 同一用户总是分配到同一变体
        - 分配比例接近配置
        
        Args:
            user_id: 用户ID
            exp_id: 实验ID
        
        Returns:
            variant_name
        """
        if exp_id not in self.experiments:
            raise ValueError(f"Experiment {exp_id} not found")
        
        # 检查是否已分配
        if user_id in self.user_assignments[exp_id]:
            return self.user_assignments[exp_id][user_id]
        
        config = self.experiments[exp_id]
        
        # 多臂老虎机分配
        if config.use_bandit:
            bandit = self.bandits[exp_id]
            total_pulls = sum(bandit.pulls.values())
            
            # 预热期: 均匀分配
            if total_pulls < config.bandit_warmup_samples * len(config.variants):
                variant = self._hash_assignment(user_id, exp_id)
            else:
                # 老虎机选择
                variant = bandit.select_variant()
        else:
            # 一致性哈希分配
            variant = self._hash_assignment(user_id, exp_id)
        
        # 存储分配
        self.user_assignments[exp_id][user_id] = variant
        
        return variant
    
    def _hash_assignment(self, user_id: str, exp_id: str) -> str:
        """
        一致性哈希分配
        
        原理:
        - hash(user_id + exp_id) -> [0, 1)
        - 根据累积分配比例确定变体
        """
        config = self.experiments[exp_id]
        
        # 计算哈希值 [0, 1)
        hash_str = f"{user_id}_{exp_id}"
        hash_value = int(hashlib.md5(hash_str.encode()).hexdigest(), 16)
        normalized_hash = (hash_value % 10000) / 10000.0
        
        # 累积分配
        cumulative = 0.0
        for variant in config.variants:
            cumulative += variant.allocation
            if normalized_hash < cumulative:
                return variant.name
        
        # 边界情况
        return config.variants[-1].name
    
    # ==================== 指标记录 ====================
    
    def log_metric(
        self,
        exp_id: str,
        user_id: str,
        variant: str,
        value: float
    ):
        """
        记录指标
        
        Args:
            exp_id: 实验ID
            user_id: 用户ID
            variant: 变体名称
            value: 指标值
        """
        if exp_id not in self.experiments:
            raise ValueError(f"Experiment {exp_id} not found")
        
        # 存储数据
        self.experiment_data[exp_id][variant].append(value)
        
        # 更新多臂老虎机
        config = self.experiments[exp_id]
        if config.use_bandit and exp_id in self.bandits:
            # 假设value是奖励 (0或1)
            reward = 1 if value > 0.5 else 0
            self.bandits[exp_id].update(variant, reward)
    
    # ==================== 统计分析 ====================
    
    def analyze_experiment(self, exp_id: str) -> ExperimentResult:
        """
        分析实验结果
        
        步骤:
        1. 计算各变体统计量
        2. 执行显著性检验
        3. 计算效应大小
        4. 确定获胜者
        
        Args:
            exp_id: 实验ID
        
        Returns:
            ExperimentResult
        """
        if exp_id not in self.experiments:
            raise ValueError(f"Experiment {exp_id} not found")
        
        config = self.experiments[exp_id]
        data = self.experiment_data[exp_id]
        
        # 计算统计量
        variant_stats = {}
        sample_sizes = {}
        
        for variant_name in data.keys():
            values = np.array(data[variant_name])
            if len(values) > 0:
                variant_stats[variant_name] = {
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values)),
                    'count': len(values)
                }
                sample_sizes[variant_name] = len(values)
            else:
                variant_stats[variant_name] = {
                    'mean': 0.0,
                    'std': 0.0,
                    'count': 0
                }
                sample_sizes[variant_name] = 0
        
        # 找到control组
        control_variant = config.variants[0].name
        if control_variant not in data or len(data[control_variant]) == 0:
            logger.warning(f"No data for control variant: {control_variant}")
            return ExperimentResult(
                experiment_id=exp_id,
                status=self.experiment_status[exp_id],
                variant_stats=variant_stats,
                sample_sizes=sample_sizes,
                start_time=self.experiment_start_time.get(exp_id)
            )
        
        # 对每个treatment变体执行统计检验
        control_data = np.array(data[control_variant])
        best_p_value = 1.0
        best_effect_size = 0.0
        best_variant = control_variant
        
        for variant in config.variants[1:]:
            variant_name = variant.name
            if variant_name not in data or len(data[variant_name]) < config.min_sample_size:
                continue
            
            treatment_data = np.array(data[variant_name])
            
            # 执行t检验
            p_value, is_significant, effect_size = StatisticalTest.t_test(
                control_data,
                treatment_data,
                alpha=config.alpha
            )
            
            # 更新最佳变体
            if is_significant and effect_size > best_effect_size:
                best_p_value = p_value
                best_effect_size = effect_size
                best_variant = variant_name
        
        # 置信区间 (treatment vs control)
        if best_variant != control_variant and len(data[best_variant]) > 0:
            treatment_data = np.array(data[best_variant])
            # 取较短的长度
            min_len = min(len(control_data), len(treatment_data))
            diff_data = treatment_data[:min_len] - control_data[:min_len]
            ci = StatisticalTest.confidence_interval(diff_data)
        else:
            ci = (0.0, 0.0)
        
        # 构建结果
        result = ExperimentResult(
            experiment_id=exp_id,
            status=self.experiment_status[exp_id],
            variant_stats=variant_stats,
            p_value=best_p_value,
            confidence_interval=ci,
            effect_size=best_effect_size,
            is_significant=(best_p_value < config.alpha),
            winner=best_variant if best_p_value < config.alpha else None,
            sample_sizes=sample_sizes,
            start_time=self.experiment_start_time.get(exp_id),
            end_time=datetime.now()
        )
        
        return result
    
    # ==================== 自动决策 ====================
    
    def check_early_stopping(self, exp_id: str) -> bool:
        """
        检查是否应该早期停止
        
        条件:
        1. 样本量足够
        2. 统计显著
        3. 效应大小足够大
        
        Returns:
            should_stop
        """
        if exp_id not in self.experiments:
            return False
        
        config = self.experiments[exp_id]
        result = self.analyze_experiment(exp_id)
        
        # 检查样本量
        min_samples = all(
            size >= config.min_sample_size
            for size in result.sample_sizes.values()
        )
        
        if not min_samples:
            return False
        
        # 检查显著性和效应大小
        if result.is_significant and abs(result.effect_size) > config.minimum_detectable_effect:
            logger.info(f"🎯 Early stopping triggered for {exp_id}")
            logger.info(f"   - Winner: {result.winner}")
            logger.info(f"   - p-value: {result.p_value:.4f}")
            logger.info(f"   - Effect size: {result.effect_size:.4f}")
            return True
        
        return False
    
    def get_experiment_summary(self, exp_id: str) -> Dict[str, Any]:
        """
        获取实验摘要
        
        Returns:
            摘要字典
        """
        result = self.analyze_experiment(exp_id)
        config = self.experiments[exp_id]
        
        summary = {
            'experiment_id': exp_id,
            'name': config.name,
            'status': result.status.value,
            'variants': [v.name for v in config.variants],
            'metric': config.metric_name,
            'sample_sizes': result.sample_sizes,
            'statistics': result.variant_stats,
            'p_value': result.p_value,
            'is_significant': result.is_significant,
            'winner': result.winner,
            'effect_size': result.effect_size,
            'confidence_interval': list(result.confidence_interval),
            'duration_hours': (
                (result.end_time - result.start_time).total_seconds() / 3600
                if result.start_time and result.end_time else 0
            )
        }
        
        return summary
    
    # ==================== 持久化 ====================
    
    def save_experiment(self, exp_id: str):
        """保存实验数据"""
        filepath = self.storage_path / f"{exp_id}.json"
        
        data = {
            'config': {
                'name': self.experiments[exp_id].name,
                'variants': [
                    {'name': v.name, 'allocation': v.allocation}
                    for v in self.experiments[exp_id].variants
                ],
                'metric_name': self.experiments[exp_id].metric_name,
                'metric_type': self.experiments[exp_id].metric_type.value
            },
            'data': {k: list(v) for k, v in self.experiment_data[exp_id].items()},
            'status': self.experiment_status[exp_id].value,
            'start_time': self.experiment_start_time[exp_id].isoformat()
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        
        logger.info(f"💾 Experiment saved: {filepath}")
    
    def load_experiment(self, exp_id: str):
        """加载实验数据"""
        filepath = self.storage_path / f"{exp_id}.json"
        
        if not filepath.exists():
            raise FileNotFoundError(f"Experiment file not found: {filepath}")
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        # TODO: 重建配置和数据
        logger.info(f"📂 Experiment loaded: {filepath}")


# ==================== 便捷函数 ====================

def quick_ab_test(
    control_data: List[float],
    treatment_data: List[float],
    alpha: float = 0.05
) -> Dict[str, Any]:
    """
    快速A/B测试
    
    Args:
        control_data: 对照组数据
        treatment_data: 实验组数据
        alpha: 显著性水平
    
    Returns:
        测试结果字典
    """
    control_array = np.array(control_data)
    treatment_array = np.array(treatment_data)
    
    p_value, is_significant, effect_size = StatisticalTest.t_test(
        control_array,
        treatment_array,
        alpha=alpha
    )
    
    return {
        'p_value': p_value,
        'is_significant': is_significant,
        'effect_size': effect_size,
        'control_mean': float(np.mean(control_array)),
        'treatment_mean': float(np.mean(treatment_array)),
        'relative_improvement': (
            (np.mean(treatment_array) - np.mean(control_array)) / 
            np.mean(control_array) * 100
        )
    }
