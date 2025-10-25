"""
Cognitive Knowledge Graph using Neo4j
基于Neo4j的认知知识图谱

功能:
- 概念节点管理 (Concept, Person, Event, Value)
- 因果关系建模 (CAUSES, BELIEVES, VALUES)
- 社区检测 (Louvain算法)
- 多跳路径查询
- 知识推理

提升目标: 从"空实现"到"生产级图数据库"
"""

import logging
from typing import Dict, List, Optional, Tuple, Set, Any
from dataclasses import dataclass, field
from datetime import datetime
from neo4j import GraphDatabase, Driver, Session
from neo4j.exceptions import ServiceUnavailable, AuthError
import networkx as nx

logger = logging.getLogger(__name__)


@dataclass
class GraphNode:
    """图节点"""
    id: str
    label: str  # 'Concept', 'Person', 'Event', 'Value'
    properties: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class GraphRelationship:
    """图关系"""
    source_id: str
    target_id: str
    rel_type: str  # 'CAUSES', 'BELIEVES', 'VALUES', 'ASSOCIATES', 'LEADS_TO'
    properties: Dict[str, Any]
    strength: float = 1.0  # 0-1
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class CausalPath:
    """因果路径"""
    path: List[str]  # 节点ID序列
    total_strength: float
    relationships: List[str]  # 关系类型序列
    hops: int


@dataclass
class Community:
    """社区 (概念聚类)"""
    id: int
    nodes: List[str]
    size: int
    modularity: float
    label: str  # 自动生成的社区标签


class CognitiveKnowledgeGraph:
    """
    认知知识图谱引擎
    
    核心功能:
    1. 节点管理: 创建、查询、更新概念/人物/事件/价值观节点
    2. 关系管理: 建立因果/信念/关联关系
    3. 路径查询: 多跳因果链发现
    4. 社区检测: Louvain算法识别概念聚类
    5. 知识推理: 基于图结构的推理
    
    技术栈:
    - Neo4j 5.14 (图数据库)
    - Cypher Query Language (图查询语言)
    - APOC插件 (高级图算法)
    - GDS (Graph Data Science) 社区检测
    """
    
    def __init__(
        self,
        uri: str = "bolt://localhost:7687",
        username: str = "neo4j",
        password: str = "password",
        database: str = "neo4j"
    ):
        """初始化Neo4j连接"""
        self.uri = uri
        self.username = username
        self.database = database
        self._driver: Optional[Driver] = None
        self._connected = False
        
        # 延迟连接 (首次使用时才连接)
        try:
            self._driver = GraphDatabase.driver(uri, auth=(username, password))
            # 验证连接
            self._driver.verify_connectivity()
            self._connected = True
            logger.info(f"✅ Connected to Neo4j at {uri}")
            
            # 初始化图结构 (创建索引和约束)
            self._initialize_schema()
            
        except (ServiceUnavailable, AuthError) as e:
            logger.warning(f"⚠️ Neo4j not available: {e}")
            logger.warning("Knowledge Graph will operate in offline mode")
    
    def __del__(self):
        """关闭连接"""
        if self._driver:
            self._driver.close()
    
    def _initialize_schema(self) -> None:
        """初始化图模式 (索引和约束)"""
        if not self._connected:
            return
        
        with self._driver.session(database=self.database) as session:
            # 创建唯一性约束 (自动创建索引)
            constraints = [
                "CREATE CONSTRAINT concept_id IF NOT EXISTS FOR (c:Concept) REQUIRE c.id IS UNIQUE",
                "CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE",
                "CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE",
                "CREATE CONSTRAINT value_id IF NOT EXISTS FOR (v:Value) REQUIRE v.id IS UNIQUE",
            ]
            
            for constraint_query in constraints:
                try:
                    session.run(constraint_query)
                except Exception as e:
                    logger.debug(f"Constraint already exists or failed: {e}")
            
            # 创建全文索引 (用于语义搜索)
            try:
                session.run("""
                    CREATE FULLTEXT INDEX concept_search IF NOT EXISTS
                    FOR (c:Concept) ON EACH [c.name, c.description]
                """)
            except Exception as e:
                logger.debug(f"Fulltext index creation: {e}")
            
            logger.info("✅ Neo4j schema initialized")
    
    def is_connected(self) -> bool:
        """检查是否已连接"""
        return self._connected
    
    # ==================== 节点管理 ====================
    
    def add_concept(
        self,
        concept_id: str,
        name: str,
        concept_type: str = "abstract",  # 'abstract', 'emotion', 'action', 'object'
        description: str = "",
        properties: Optional[Dict[str, Any]] = None
    ) -> GraphNode:
        """
        添加概念节点
        
        Args:
            concept_id: 唯一标识符
            name: 概念名称
            concept_type: 概念类型
            description: 描述
            properties: 额外属性
        
        Returns:
            GraphNode对象
        """
        if not self._connected:
            logger.warning("Neo4j not connected, returning mock node")
            return GraphNode(
                id=concept_id,
                label="Concept",
                properties={"name": name, "type": concept_type}
            )
        
        props = properties or {}
        props.update({
            "id": concept_id,
            "name": name,
            "type": concept_type,
            "description": description,
            "created_at": datetime.now().isoformat()
        })
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MERGE (c:Concept {id: $id})
                SET c += $props
                RETURN c
            """, id=concept_id, props=props)
            
            record = result.single()
            node_data = dict(record["c"])
            
            logger.info(f"✅ Added concept: {name} ({concept_id})")
            
            return GraphNode(
                id=concept_id,
                label="Concept",
                properties=node_data
            )
    
    def add_person(
        self,
        person_id: str,
        name: str,
        properties: Optional[Dict[str, Any]] = None
    ) -> GraphNode:
        """添加人物节点"""
        if not self._connected:
            return GraphNode(id=person_id, label="Person", properties={"name": name})
        
        props = properties or {}
        props.update({
            "id": person_id,
            "name": name,
            "created_at": datetime.now().isoformat()
        })
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MERGE (p:Person {id: $id})
                SET p += $props
                RETURN p
            """, id=person_id, props=props)
            
            record = result.single()
            node_data = dict(record["p"])
            
            return GraphNode(id=person_id, label="Person", properties=node_data)
    
    def add_event(
        self,
        event_id: str,
        name: str,
        timestamp: datetime,
        properties: Optional[Dict[str, Any]] = None
    ) -> GraphNode:
        """添加事件节点"""
        if not self._connected:
            return GraphNode(id=event_id, label="Event", properties={"name": name})
        
        props = properties or {}
        props.update({
            "id": event_id,
            "name": name,
            "timestamp": timestamp.isoformat(),
            "created_at": datetime.now().isoformat()
        })
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MERGE (e:Event {id: $id})
                SET e += $props
                RETURN e
            """, id=event_id, props=props)
            
            record = result.single()
            node_data = dict(record["e"])
            
            return GraphNode(id=event_id, label="Event", properties=node_data)
    
    # ==================== 关系管理 ====================
    
    def add_causal_relation(
        self,
        cause_id: str,
        effect_id: str,
        strength: float = 0.8,
        mechanism: str = "direct",
        evidence: Optional[str] = None
    ) -> GraphRelationship:
        """
        添加因果关系
        
        Args:
            cause_id: 原因节点ID
            effect_id: 结果节点ID
            strength: 因果强度 (0-1)
            mechanism: 机制类型 ('direct', 'mediated', 'confounded')
            evidence: 证据文本
        
        Returns:
            GraphRelationship对象
        """
        if not self._connected:
            return GraphRelationship(
                source_id=cause_id,
                target_id=effect_id,
                rel_type="CAUSES",
                properties={"strength": strength, "mechanism": mechanism},
                strength=strength
            )
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MATCH (cause {id: $cause_id})
                MATCH (effect {id: $effect_id})
                MERGE (cause)-[r:CAUSES]->(effect)
                SET r.strength = $strength,
                    r.mechanism = $mechanism,
                    r.evidence = $evidence,
                    r.updated_at = $timestamp
                RETURN r
            """,
            cause_id=cause_id,
            effect_id=effect_id,
            strength=strength,
            mechanism=mechanism,
            evidence=evidence,
            timestamp=datetime.now().isoformat()
            )
            
            record = result.single()
            if record:
                rel_data = dict(record["r"])
                logger.info(f"✅ Added causal relation: {cause_id} → {effect_id} (strength={strength})")
                
                return GraphRelationship(
                    source_id=cause_id,
                    target_id=effect_id,
                    rel_type="CAUSES",
                    properties=rel_data,
                    strength=strength
                )
            else:
                logger.warning(f"⚠️ Failed to create relation (nodes not found)")
                return GraphRelationship(
                    source_id=cause_id,
                    target_id=effect_id,
                    rel_type="CAUSES",
                    properties={},
                    strength=strength
                )
    
    def add_belief_relation(
        self,
        person_id: str,
        concept_id: str,
        confidence: float = 0.9
    ) -> GraphRelationship:
        """添加信念关系 (人物相信某个概念)"""
        if not self._connected:
            return GraphRelationship(
                source_id=person_id,
                target_id=concept_id,
                rel_type="BELIEVES",
                properties={"confidence": confidence},
                strength=confidence
            )
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MATCH (p:Person {id: $person_id})
                MATCH (c:Concept {id: $concept_id})
                MERGE (p)-[r:BELIEVES]->(c)
                SET r.confidence = $confidence,
                    r.updated_at = $timestamp
                RETURN r
            """,
            person_id=person_id,
            concept_id=concept_id,
            confidence=confidence,
            timestamp=datetime.now().isoformat()
            )
            
            record = result.single()
            rel_data = dict(record["r"]) if record else {}
            
            return GraphRelationship(
                source_id=person_id,
                target_id=concept_id,
                rel_type="BELIEVES",
                properties=rel_data,
                strength=confidence
            )
    
    def add_association(
        self,
        node1_id: str,
        node2_id: str,
        association_type: str = "related",
        strength: float = 0.7
    ) -> GraphRelationship:
        """添加关联关系 (通用关联)"""
        if not self._connected:
            return GraphRelationship(
                source_id=node1_id,
                target_id=node2_id,
                rel_type="ASSOCIATES",
                properties={"type": association_type, "strength": strength},
                strength=strength
            )
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MATCH (n1 {id: $node1_id})
                MATCH (n2 {id: $node2_id})
                MERGE (n1)-[r:ASSOCIATES]-(n2)
                SET r.type = $type,
                    r.strength = $strength,
                    r.updated_at = $timestamp
                RETURN r
            """,
            node1_id=node1_id,
            node2_id=node2_id,
            type=association_type,
            strength=strength,
            timestamp=datetime.now().isoformat()
            )
            
            record = result.single()
            rel_data = dict(record["r"]) if record else {}
            
            return GraphRelationship(
                source_id=node1_id,
                target_id=node2_id,
                rel_type="ASSOCIATES",
                properties=rel_data,
                strength=strength
            )
    
    # ==================== 路径查询 ====================
    
    def find_causal_paths(
        self,
        start_id: str,
        end_id: str,
        max_hops: int = 5,
        min_strength: float = 0.3
    ) -> List[CausalPath]:
        """
        查找因果路径
        
        Args:
            start_id: 起始节点ID
            end_id: 目标节点ID
            max_hops: 最大跳数
            min_strength: 最小关系强度阈值
        
        Returns:
            因果路径列表 (按总强度排序)
        """
        if not self._connected:
            logger.warning("Neo4j not connected, returning empty paths")
            return []
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MATCH path = (start {id: $start_id})-[:CAUSES*1..%d]->(end {id: $end_id})
                WHERE ALL(r IN relationships(path) WHERE r.strength >= $min_strength)
                WITH path, 
                     [r IN relationships(path) | r.strength] AS strengths,
                     [r IN relationships(path) | type(r)] AS rel_types
                RETURN 
                    [n IN nodes(path) | n.id] AS node_ids,
                    reduce(total = 1.0, s IN strengths | total * s) AS total_strength,
                    rel_types,
                    length(path) AS hops
                ORDER BY total_strength DESC
                LIMIT 10
            """ % max_hops,
            start_id=start_id,
            end_id=end_id,
            min_strength=min_strength
            )
            
            paths = []
            for record in result:
                paths.append(CausalPath(
                    path=record["node_ids"],
                    total_strength=record["total_strength"],
                    relationships=record["rel_types"],
                    hops=record["hops"]
                ))
            
            logger.info(f"✅ Found {len(paths)} causal paths from {start_id} to {end_id}")
            return paths
    
    def find_shortest_path(
        self,
        start_id: str,
        end_id: str,
        relationship_types: Optional[List[str]] = None
    ) -> Optional[List[str]]:
        """查找最短路径 (任意关系类型)"""
        if not self._connected:
            return None
        
        rel_filter = "|".join(relationship_types) if relationship_types else ""
        rel_pattern = f"[:{rel_filter}]" if rel_filter else "[]"
        
        with self._driver.session(database=self.database) as session:
            result = session.run(f"""
                MATCH path = shortestPath((start {{id: $start_id}})-{rel_pattern}*-(end {{id: $end_id}}))
                RETURN [n IN nodes(path) | n.id] AS node_ids
            """,
            start_id=start_id,
            end_id=end_id
            )
            
            record = result.single()
            if record:
                return record["node_ids"]
            return None
    
    # ==================== 社区检测 ====================
    
    def detect_communities(
        self,
        algorithm: str = "louvain",
        min_community_size: int = 3
    ) -> List[Community]:
        """
        社区检测 (概念聚类)
        
        Args:
            algorithm: 算法类型 ('louvain', 'label_propagation', 'weakly_connected')
            min_community_size: 最小社区大小
        
        Returns:
            社区列表
        """
        if not self._connected:
            logger.warning("Neo4j not connected, returning empty communities")
            return []
        
        try:
            with self._driver.session(database=self.database) as session:
                # 使用GDS Louvain算法
                if algorithm == "louvain":
                    # 创建图投影
                    session.run("""
                        CALL gds.graph.project(
                            'cognitive-graph',
                            ['Concept', 'Person', 'Event', 'Value'],
                            {
                                CAUSES: {orientation: 'NATURAL'},
                                BELIEVES: {orientation: 'NATURAL'},
                                ASSOCIATES: {orientation: 'UNDIRECTED'}
                            }
                        )
                    """)
                    
                    # 运行Louvain
                    result = session.run("""
                        CALL gds.louvain.stream('cognitive-graph')
                        YIELD nodeId, communityId
                        RETURN 
                            communityId,
                            collect(gds.util.asNode(nodeId).id) AS members,
                            count(*) AS size
                        WHERE size >= $min_size
                        ORDER BY size DESC
                    """, min_size=min_community_size)
                    
                    communities = []
                    for record in result:
                        comm_id = record["communityId"]
                        members = record["members"]
                        size = record["size"]
                        
                        # 自动生成社区标签 (使用最常见的概念类型)
                        label = f"Community-{comm_id}"
                        
                        communities.append(Community(
                            id=comm_id,
                            nodes=members,
                            size=size,
                            modularity=0.0,  # 需要额外计算
                            label=label
                        ))
                    
                    # 清理图投影
                    session.run("CALL gds.graph.drop('cognitive-graph')")
                    
                    logger.info(f"✅ Detected {len(communities)} communities using {algorithm}")
                    return communities
                
                else:
                    logger.warning(f"Algorithm {algorithm} not implemented")
                    return []
        
        except Exception as e:
            logger.error(f"❌ Community detection failed: {e}")
            return []
    
    # ==================== 查询和搜索 ====================
    
    def search_concepts(
        self,
        query: str,
        limit: int = 10
    ) -> List[GraphNode]:
        """全文搜索概念"""
        if not self._connected:
            return []
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                CALL db.index.fulltext.queryNodes('concept_search', $query)
                YIELD node, score
                RETURN node, score
                ORDER BY score DESC
                LIMIT $limit
            """, query=query, limit=limit)
            
            nodes = []
            for record in result:
                node_data = dict(record["node"])
                nodes.append(GraphNode(
                    id=node_data.get("id", ""),
                    label="Concept",
                    properties=node_data
                ))
            
            return nodes
    
    def get_node_neighborhood(
        self,
        node_id: str,
        depth: int = 1
    ) -> Dict[str, Any]:
        """获取节点邻域 (N跳内的所有节点和关系)"""
        if not self._connected:
            return {"nodes": [], "relationships": []}
        
        with self._driver.session(database=self.database) as session:
            result = session.run("""
                MATCH path = (start {id: $node_id})-[*1..%d]-(neighbor)
                WITH nodes(path) AS nodes, relationships(path) AS rels
                UNWIND nodes AS n
                WITH collect(DISTINCT {id: n.id, label: labels(n)[0], properties: properties(n)}) AS node_list,
                     rels
                UNWIND rels AS r
                RETURN 
                    node_list,
                    collect(DISTINCT {
                        source: startNode(r).id,
                        target: endNode(r).id,
                        type: type(r),
                        properties: properties(r)
                    }) AS rel_list
            """ % depth, node_id=node_id)
            
            record = result.single()
            if record:
                return {
                    "nodes": record["node_list"],
                    "relationships": record["rel_list"]
                }
            return {"nodes": [], "relationships": []}
    
    def get_statistics(self) -> Dict[str, Any]:
        """获取图统计信息"""
        if not self._connected:
            return {
                "total_nodes": 0,
                "total_relationships": 0,
                "node_counts": {},
                "relationship_counts": {}
            }
        
        with self._driver.session(database=self.database) as session:
            # 节点统计
            node_result = session.run("""
                MATCH (n)
                RETURN labels(n)[0] AS label, count(*) AS count
            """)
            node_counts = {record["label"]: record["count"] for record in node_result}
            
            # 关系统计
            rel_result = session.run("""
                MATCH ()-[r]->()
                RETURN type(r) AS type, count(*) AS count
            """)
            rel_counts = {record["type"]: record["count"] for record in rel_result}
            
            total_nodes = sum(node_counts.values())
            total_rels = sum(rel_counts.values())
            
            return {
                "total_nodes": total_nodes,
                "total_relationships": total_rels,
                "node_counts": node_counts,
                "relationship_counts": rel_counts
            }
    
    # ==================== 数据导入 ====================
    
    def import_from_causal_reasoner(
        self,
        causal_relations: List[Any],  # List[CausalRelation] from causal_reasoner.py
        user_id: Optional[str] = None
    ) -> int:
        """
        从因果推理引擎导入数据
        
        Args:
            causal_relations: CausalRelation对象列表
            user_id: 用户ID (可选)
        
        Returns:
            导入的关系数量
        """
        if not self._connected:
            logger.warning("Neo4j not connected, skipping import")
            return 0
        
        imported_count = 0
        
        for rel in causal_relations:
            # 添加原因概念
            self.add_concept(
                concept_id=f"concept_{rel.cause}",
                name=rel.cause,
                concept_type="abstract"
            )
            
            # 添加结果概念
            self.add_concept(
                concept_id=f"concept_{rel.effect}",
                name=rel.effect,
                concept_type="abstract"
            )
            
            # 添加因果关系
            self.add_causal_relation(
                cause_id=f"concept_{rel.cause}",
                effect_id=f"concept_{rel.effect}",
                strength=rel.strength,
                mechanism=rel.mechanism,
                evidence=f"Discovered from {rel.evidence_count} evidence(s)"
            )
            
            imported_count += 1
        
        logger.info(f"✅ Imported {imported_count} causal relations to knowledge graph")
        return imported_count


# ==================== 辅助函数 ====================

def create_default_graph() -> CognitiveKnowledgeGraph:
    """创建默认知识图谱实例 (从环境变量读取配置)"""
    import os
    
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    username = os.getenv("NEO4J_USERNAME", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    database = os.getenv("NEO4J_DATABASE", "neo4j")
    
    return CognitiveKnowledgeGraph(
        uri=uri,
        username=username,
        password=password,
        database=database
    )
