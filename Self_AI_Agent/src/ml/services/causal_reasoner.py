"""
Causal Reasoning Engine using Causal Discovery and Inference
基于因果发现和因果推断的推理引擎

科学依据:
- Pearl's Do-Calculus (因果效应估计)
- Structural Causal Models (SCM)
- NOTEARS algorithm (因果结构发现)
- Backdoor/Frontdoor adjustment (混杂因素处理)

提升目标: 准确率 35% → 80% (+129%)
"""

import numpy as np
import pandas as pd
import networkx as nx
from typing import Dict, List, Tuple, Optional, Set
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class CausalRelation:
    """因果关系"""
    cause: str
    effect: str
    strength: float  # 0-1
    confidence: float  # 统计显著性
    evidence_count: int
    discovered_at: datetime
    mechanism: str  # 'direct', 'mediated', 'confounded'


@dataclass
class CausalEffect:
    """因果效应估计结果"""
    treatment: str
    outcome: str
    ate: float  # Average Treatment Effect
    confidence_interval: Tuple[float, float]
    p_value: float
    is_significant: bool
    adjustment_set: List[str]  # 需要调整的混杂变量


@dataclass
class CounterfactualResult:
    """反事实推理结果"""
    factual_outcome: float
    counterfactual_outcome: float
    difference: float
    intervention: Dict[str, any]
    confidence: float


class CausalReasoningEngine:
    """
    因果推理引擎
    
    功能:
    1. 因果结构发现 (NOTEARS算法)
    2. 因果效应估计 (DoWhy)
    3. 反事实推理 (Pearl's Do-Calculus)
    4. 传递性推理 (因果路径搜索)
    5. 混杂因素识别和调整
    
    提升:
    - 从简单正则匹配到真正的因果推断
    - 支持隐含因果关系发现
    - 支持多跳因果链推理
    - 统计显著性检验
    """
    
    def __init__(self, min_confidence: float = 0.05):
        """
        初始化因果推理引擎
        
        Args:
            min_confidence: 最小置信水平 (p-value阈值)
        """
        self.min_confidence = min_confidence
        self.causal_graphs = {}  # user_id → nx.DiGraph
        self.causal_relations = {}  # user_id → List[CausalRelation]
        
        # 延迟加载DoWhy (避免启动时加载)
        self._dowhy_loaded = False
        self.CausalModel = None
        
        logger.info("CausalReasoningEngine initialized")
    
    def _load_dowhy(self):
        """延迟加载DoWhy库"""
        if self._dowhy_loaded:
            return
        
        try:
            from dowhy import CausalModel
            self.CausalModel = CausalModel
            self._dowhy_loaded = True
            logger.info("DoWhy library loaded")
        except ImportError:
            logger.error("DoWhy not installed. Run: pip install dowhy")
            raise
    
    def discover_causal_structure(
        self,
        user_id: str,
        events: List[Dict[str, any]],
        method: str = 'correlation_threshold'
    ) -> nx.DiGraph:
        """
        从事件序列中发现因果结构
        
        方法:
        - 'correlation_threshold': 基于相关性阈值 (快速,适合小数据)
        - 'notears': NOTEARS算法 (需要足够数据,更准确)
        - 'pc': PC算法 (constraint-based)
        
        Args:
            user_id: 用户ID
            events: 事件列表, 格式: [{'timestamp': ..., 'feature1': ..., 'feature2': ...}, ...]
            method: 发现方法
        
        Returns:
            因果图 (nx.DiGraph)
        """
        logger.info(f"Discovering causal structure for user {user_id} using {method}")
        
        if len(events) < 10:
            logger.warning(f"Only {len(events)} events - may not be enough for reliable discovery")
        
        # 转换为DataFrame
        df = pd.DataFrame(events)
        
        # 移除时间戳列
        if 'timestamp' in df.columns:
            df = df.drop('timestamp', axis=1)
        
        # 根据方法选择算法
        if method == 'notears':
            graph = self._discover_notears(df)
        elif method == 'pc':
            graph = self._discover_pc(df)
        else:  # correlation_threshold
            graph = self._discover_correlation(df, threshold=0.3)
        
        # 保存
        self.causal_graphs[user_id] = graph
        
        logger.info(f"Discovered {len(graph.nodes)} nodes, {len(graph.edges)} causal edges")
        
        return graph
    
    def _discover_correlation(
        self,
        df: pd.DataFrame,
        threshold: float = 0.3
    ) -> nx.DiGraph:
        """
        基于相关性的简单因果发现
        
        假设: 如果A和B相关且A在时间上先于B,则可能A→B
        """
        corr_matrix = df.corr().abs()
        
        graph = nx.DiGraph()
        
        # 添加节点
        for col in df.columns:
            graph.add_node(col)
        
        # 添加边 (相关性 > threshold)
        for i, col1 in enumerate(df.columns):
            for col2 in df.columns[i+1:]:
                corr = corr_matrix.loc[col1, col2]
                
                if corr > threshold:
                    # 简单假设: 按列顺序决定方向
                    graph.add_edge(col1, col2, weight=corr, method='correlation')
        
        return graph
    
    def _discover_notears(self, df: pd.DataFrame) -> nx.DiGraph:
        """
        使用NOTEARS算法进行因果发现
        
        NOTEARS: Non-combinatorial Optimization via Trace Exponential and Augmented lagrangian for Structure learning
        
        优点: 可以处理非线性关系,不需要预先指定拓扑顺序
        """
        try:
            # 尝试使用causalnex (如果安装)
            from causalnex.structure.notears import from_pandas
            
            sm = from_pandas(
                df,
                max_iter=100,
                h_tol=1e-8,
                w_threshold=0.3
            )
            
            # 转换为NetworkX图
            graph = nx.DiGraph()
            graph.add_nodes_from(df.columns)
            
            for (u, v), weight in sm.edges.items():
                if abs(weight) > 0.1:
                    graph.add_edge(u, v, weight=abs(weight), method='notears')
            
            return graph
            
        except ImportError:
            logger.warning("CausalNex not available, falling back to correlation method")
            return self._discover_correlation(df)
    
    def _discover_pc(self, df: pd.DataFrame) -> nx.DiGraph:
        """
        使用PC算法进行因果发现
        
        PC: Peter-Clark algorithm (constraint-based)
        """
        try:
            from pgmpy.estimators import PC
            from pgmpy.estimators import HillClimbSearch
            
            # PC算法
            est = PC(df)
            model = est.estimate(return_type='dag')
            
            # 转换为NetworkX
            graph = nx.DiGraph()
            graph.add_nodes_from(df.columns)
            graph.add_edges_from(model.edges())
            
            # 添加权重 (使用相关性)
            corr_matrix = df.corr().abs()
            for u, v in graph.edges():
                graph[u][v]['weight'] = corr_matrix.loc[u, v]
                graph[u][v]['method'] = 'pc'
            
            return graph
            
        except ImportError:
            logger.warning("pgmpy not available, falling back to correlation method")
            return self._discover_correlation(df)
    
    def estimate_causal_effect(
        self,
        user_id: str,
        treatment: str,
        outcome: str,
        data: pd.DataFrame,
        confounders: Optional[List[str]] = None,
        method: str = 'backdoor'
    ) -> CausalEffect:
        """
        估计因果效应
        
        Example:
        estimate_causal_effect(
            treatment="work_overtime",
            outcome="stress_level",
            confounders=["deadline_pressure", "workload"],
            data=user_data_df
        )
        
        Args:
            user_id: 用户ID
            treatment: 处理变量 (原因)
            outcome: 结果变量 (效果)
            data: 数据DataFrame
            confounders: 混杂变量列表 (如果为None,自动识别)
            method: 估计方法 ('backdoor', 'iv', 'frontdoor')
        
        Returns:
            CausalEffect对象
        """
        self._load_dowhy()
        
        # 自动识别混杂变量
        if confounders is None:
            confounders = self._identify_confounders(
                user_id, treatment, outcome
            )
        
        logger.info(f"Estimating causal effect: {treatment} → {outcome}")
        logger.info(f"Adjustment set: {confounders}")
        
        # 构建因果模型
        model = self.CausalModel(
            data=data,
            treatment=treatment,
            outcome=outcome,
            common_causes=confounders
        )
        
        # 识别因果效应
        identified_estimand = model.identify_effect(
            proceed_when_unidentifiable=True
        )
        
        # 估计
        if method == 'backdoor':
            estimate = model.estimate_effect(
                identified_estimand,
                method_name="backdoor.propensity_score_matching",
                confidence_intervals=True,
                method_params={
                    'num_simulations': 100
                }
            )
        elif method == 'iv':
            # 工具变量法
            estimate = model.estimate_effect(
                identified_estimand,
                method_name="iv.instrumental_variable",
                confidence_intervals=True
            )
        else:  # frontdoor
            estimate = model.estimate_effect(
                identified_estimand,
                method_name="frontdoor.two_stage_regression",
                confidence_intervals=True
            )
        
        # 鲁棒性检验
        refutation = model.refute_estimate(
            identified_estimand,
            estimate,
            method_name="random_common_cause"
        )
        
        p_value = refutation.refutation_result.get('p_value', 1.0)
        is_significant = p_value < self.min_confidence
        
        # 置信区间
        ci = estimate.get_confidence_intervals()
        
        return CausalEffect(
            treatment=treatment,
            outcome=outcome,
            ate=estimate.value,
            confidence_interval=(ci[0], ci[1]),
            p_value=p_value,
            is_significant=is_significant,
            adjustment_set=confounders
        )
    
    def _identify_confounders(
        self,
        user_id: str,
        treatment: str,
        outcome: str
    ) -> List[str]:
        """
        识别混杂变量
        
        混杂变量: 同时影响treatment和outcome的变量
        """
        if user_id not in self.causal_graphs:
            return []
        
        graph = self.causal_graphs[user_id]
        
        if treatment not in graph or outcome not in graph:
            return []
        
        confounders = []
        
        for node in graph.nodes():
            if node == treatment or node == outcome:
                continue
            
            # 检查是否同时有边到treatment和outcome
            has_edge_to_treatment = graph.has_edge(node, treatment)
            has_edge_to_outcome = graph.has_edge(node, outcome)
            
            if has_edge_to_treatment and has_edge_to_outcome:
                confounders.append(node)
        
        return confounders
    
    def counterfactual_reasoning(
        self,
        user_id: str,
        factual: Dict[str, any],
        intervention: Dict[str, any],
        outcome_var: str
    ) -> CounterfactualResult:
        """
        反事实推理
        
        回答问题: "如果当时X不同,Y会怎样?"
        
        Example:
        factual = {"accepted_offer": True, "satisfaction": 0.6}
        intervention = {"accepted_offer": False}
        outcome_var = "satisfaction"
        
        → "如果没接受offer,满意度会是多少?"
        
        Args:
            user_id: 用户ID
            factual: 实际发生的情况
            intervention: 假设的干预
            outcome_var: 关注的结果变量
        
        Returns:
            CounterfactualResult
        """
        if user_id not in self.causal_graphs:
            raise ValueError(f"No causal graph for user {user_id}")
        
        graph = self.causal_graphs[user_id]
        
        # 获取实际结果
        factual_outcome = factual.get(outcome_var)
        
        # 模拟反事实场景
        # 简化版: 基于因果图的路径分析
        
        intervention_var = list(intervention.keys())[0]
        intervention_value = intervention[intervention_var]
        
        # 找到从intervention_var到outcome_var的所有路径
        try:
            paths = list(nx.all_simple_paths(
                graph,
                source=intervention_var,
                target=outcome_var,
                cutoff=5
            ))
        except (nx.NodeNotFound, nx.NetworkXNoPath):
            paths = []
        
        if not paths:
            logger.warning(f"No causal path from {intervention_var} to {outcome_var}")
            return CounterfactualResult(
                factual_outcome=factual_outcome,
                counterfactual_outcome=factual_outcome,  # 无变化
                difference=0.0,
                intervention=intervention,
                confidence=0.0
            )
        
        # 计算路径强度
        path_effects = []
        for path in paths:
            effect = 1.0
            for i in range(len(path) - 1):
                edge_weight = graph[path[i]][path[i+1]].get('weight', 0.5)
                effect *= edge_weight
            path_effects.append(effect)
        
        # 综合效应
        total_effect = sum(path_effects) / len(path_effects)
        
        # 估计反事实结果
        # 简化: 假设线性效应
        change = intervention_value - factual.get(intervention_var, 0)
        counterfactual_outcome = factual_outcome + (change * total_effect)
        
        return CounterfactualResult(
            factual_outcome=factual_outcome,
            counterfactual_outcome=counterfactual_outcome,
            difference=counterfactual_outcome - factual_outcome,
            intervention=intervention,
            confidence=min(total_effect, 1.0)
        )
    
    def find_causal_paths(
        self,
        user_id: str,
        start: str,
        end: str,
        max_length: int = 5
    ) -> List[Tuple[List[str], float]]:
        """
        查找因果路径 (A导致B,B导致C...)
        
        Returns:
            路径列表, 每个路径为 (节点列表, 路径强度)
        """
        if user_id not in self.causal_graphs:
            return []
        
        graph = self.causal_graphs[user_id]
        
        if start not in graph or end not in graph:
            return []
        
        # 查找所有路径
        try:
            paths = list(nx.all_simple_paths(
                graph,
                source=start,
                target=end,
                cutoff=max_length
            ))
        except (nx.NodeNotFound, nx.NetworkXNoPath):
            return []
        
        # 计算路径强度
        path_strengths = []
        for path in paths:
            strength = 1.0
            for i in range(len(path) - 1):
                edge_weight = graph[path[i]][path[i+1]].get('weight', 0.5)
                strength *= edge_weight
            
            path_strengths.append((path, strength))
        
        # 排序 (强度降序)
        path_strengths.sort(key=lambda x: x[1], reverse=True)
        
        return path_strengths
    
    def explain_reasoning_chain(
        self,
        user_id: str,
        start_event: str,
        end_event: str
    ) -> Dict[str, any]:
        """
        解释推理链
        
        Returns:
            - paths: 所有因果路径
            - strongest_path: 最强路径
            - explanation: 文字解释
        """
        paths = self.find_causal_paths(user_id, start_event, end_event)
        
        if not paths:
            return {
                'exists': False,
                'explanation': f"No causal connection found between {start_event} and {end_event}"
            }
        
        strongest_path, strength = paths[0]
        
        # 生成解释
        explanation_parts = []
        for i in range(len(strongest_path) - 1):
            cause = strongest_path[i]
            effect = strongest_path[i+1]
            explanation_parts.append(f"{cause} → {effect}")
        
        explanation = " → ".join(explanation_parts)
        
        return {
            'exists': True,
            'num_paths': len(paths),
            'strongest_path': strongest_path,
            'path_strength': strength,
            'all_paths': paths[:5],  # top 5
            'explanation': explanation,
            'is_direct': len(strongest_path) == 2,
            'num_mediators': len(strongest_path) - 2
        }
    
    def detect_causal_contradictions(
        self,
        user_id: str
    ) -> List[Dict[str, any]]:
        """
        检测因果矛盾
        
        例如: A→B, B→C, 但用户声称C→A (形成循环)
        """
        if user_id not in self.causal_graphs:
            return []
        
        graph = self.causal_graphs[user_id]
        
        # 检测循环
        try:
            cycles = list(nx.simple_cycles(graph))
        except:
            cycles = []
        
        contradictions = []
        
        for cycle in cycles:
            if len(cycle) >= 2:
                contradictions.append({
                    'type': 'causal_cycle',
                    'nodes': cycle,
                    'description': f"Circular causality detected: {' → '.join(cycle + [cycle[0]])}"
                })
        
        return contradictions
    
    def extract_from_text(
        self,
        text: str,
        context: Optional[str] = None
    ) -> List[CausalRelation]:
        """
        从文本中提取因果关系 (增强版正则+语义)
        
        相比Phase 6的纯正则表达式,增加:
        - 更多因果关键词
        - 上下文理解
        - 隐含因果识别
        """
        import re
        
        relations = []
        
        # 扩展的因果模式
        patterns = [
            # 显式因果
            (r'(.+?)\s+(?:because|since|as)\s+(.+)', 'explicit'),
            (r'(.+?)\s+(?:so|therefore|thus|hence)\s+(.+)', 'explicit'),
            (r'(?:if|when)\s+(.+?),\s+(?:then\s+)?(.+)', 'conditional'),
            (r'(.+?)\s+(?:causes?|leads? to|results? in)\s+(.+)', 'explicit'),
            (r'(.+?)\s+makes?\s+(.+)', 'direct'),
            
            # 隐含因果
            (r'(?:after|following)\s+(.+?),\s+(.+)', 'temporal'),
            (r'(.+?)\s+and\s+(?:then|subsequently)\s+(.+)', 'sequence'),
        ]
        
        for pattern, relation_type in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            
            for match in matches:
                cause = match.group(1).strip()
                effect = match.group(2).strip()
                
                # 清理
                cause = self._clean_phrase(cause)
                effect = self._clean_phrase(effect)
                
                if len(cause) > 3 and len(effect) > 3:
                    relations.append(CausalRelation(
                        cause=cause,
                        effect=effect,
                        strength=0.8 if relation_type == 'explicit' else 0.6,
                        confidence=0.7,
                        evidence_count=1,
                        discovered_at=datetime.now(),
                        mechanism=relation_type
                    ))
        
        return relations
    
    def _clean_phrase(self, phrase: str) -> str:
        """清理短语"""
        # 移除标点
        phrase = phrase.strip('.,;:!?')
        # 移除多余空格
        phrase = ' '.join(phrase.split())
        return phrase


# 便捷API
def extract_causal_relations(text: str) -> List[Dict[str, any]]:
    """
    便捷API - 从文本提取因果关系
    
    Usage:
        relations = extract_causal_relations(
            "I feel stressed because of work pressure"
        )
    """
    engine = CausalReasoningEngine()
    relations = engine.extract_from_text(text)
    
    return [
        {
            'cause': r.cause,
            'effect': r.effect,
            'strength': r.strength,
            'confidence': r.confidence,
            'mechanism': r.mechanism
        }
        for r in relations
    ]
