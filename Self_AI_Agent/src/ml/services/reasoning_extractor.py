"""
Reasoning Chain Extractor - Extract and model logical reasoning patterns

This module identifies how the user thinks, including:
- Causal reasoning (X causes Y)
- Deductive logic (If A then B, A is true, therefore B)
- Inductive patterns (Generalization from examples)
- Analogical thinking (X is like Y)
- Abductive reasoning (Best explanation for observation)
"""

import re
import json
from typing import Dict, List, Tuple, Optional, Set
from datetime import datetime
from collections import defaultdict
import networkx as nx

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("Warning: spaCy not available. Using fallback pattern matching.")

from .config import settings
from .db_utils import db


class ReasoningChainExtractor:
    """Extract reasoning patterns from conversation history"""
    
    # Causal indicators
    CAUSAL_PATTERNS = [
        r'because\s+(.+?)(\.|\,|$)',
        r'due to\s+(.+?)(\.|\,|$)',
        r'caused by\s+(.+?)(\.|\,|$)',
        r'as a result of\s+(.+?)(\.|\,|$)',
        r'therefore\s+(.+?)(\.|\,|$)',
        r'thus\s+(.+?)(\.|\,|$)',
        r'so\s+(.+?)(\.|\,|$)',
        r'which led to\s+(.+?)(\.|\,|$)',
        r'resulting in\s+(.+?)(\.|\,|$)',
    ]
    
    # Logical connectives
    DEDUCTIVE_PATTERNS = [
        r'if\s+(.+?)\s+then\s+(.+?)(\.|\,|$)',
        r'given that\s+(.+?),\s*(.+?)(\.|\,|$)',
        r'assuming\s+(.+?),\s*(.+?)(\.|\,|$)',
        r'since\s+(.+?),\s*(.+?)(\.|\,|$)',
    ]
    
    # Generalization indicators
    INDUCTIVE_PATTERNS = [
        r'always\s+(.+?)(\.|\,|$)',
        r'never\s+(.+?)(\.|\,|$)',
        r'usually\s+(.+?)(\.|\,|$)',
        r'often\s+(.+?)(\.|\,|$)',
        r'typically\s+(.+?)(\.|\,|$)',
        r'in general\s+(.+?)(\.|\,|$)',
        r'most (?:of the time|people|cases)\s+(.+?)(\.|\,|$)',
    ]
    
    # Analogy indicators
    ANALOGICAL_PATTERNS = [
        r'(.+?)\s+is like\s+(.+?)(\.|\,|$)',
        r'(.+?)\s+reminds me of\s+(.+?)(\.|\,|$)',
        r'similar to\s+(.+?)(\.|\,|$)',
        r'just as\s+(.+?),\s*(.+?)(\.|\,|$)',
        r'compared to\s+(.+?)(\.|\,|$)',
    ]
    
    def __init__(self):
        self.nlp = None
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load(settings.SPACY_MODEL)
            except OSError:
                print(f"spaCy model '{settings.SPACY_MODEL}' not found. "
                      f"Install with: python -m spacy download {settings.SPACY_MODEL}")
        
        self.knowledge_graph = nx.DiGraph()
    
    def extract_reasoning_chains(
        self, 
        user_id: str, 
        conversations: List[Dict] = None,
        save_to_db: bool = True
    ) -> Dict[str, List[Dict]]:
        """
        Extract all reasoning patterns from user's conversations
        
        Returns:
            Dict with keys: 'causal', 'deductive', 'inductive', 'analogical'
        """
        if conversations is None:
            conversations = db.get_user_conversations(user_id, limit=500)
        
        # Only analyze user's messages
        user_messages = [
            c for c in conversations 
            if c['role'] == 'user'
        ]
        
        chains = {
            'causal': [],
            'deductive': [],
            'inductive': [],
            'analogical': [],
            'abductive': []
        }
        
        for msg in user_messages:
            content = msg['content']
            
            # Extract different types of reasoning
            chains['causal'].extend(
                self._extract_causal_chains(content, msg['conversation_id'])
            )
            chains['deductive'].extend(
                self._extract_deductive_chains(content, msg['conversation_id'])
            )
            chains['inductive'].extend(
                self._extract_inductive_chains(content, msg['conversation_id'])
            )
            chains['analogical'].extend(
                self._extract_analogical_chains(content, msg['conversation_id'])
            )
        
        # Save to database
        if save_to_db:
            self._save_chains(user_id, chains)
        
        # Build knowledge graph
        self._build_knowledge_graph(user_id, chains)
        
        return chains
    
    def _extract_causal_chains(
        self, 
        text: str, 
        conversation_id: str
    ) -> List[Dict]:
        """Extract causal reasoning (X causes Y)"""
        chains = []
        
        for pattern in self.CAUSAL_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Split sentence to get premise and conclusion
                sentence = text[max(0, match.start()-100):match.end()]
                cause_indicator_pos = match.start() - max(0, match.start()-100)
                
                premise = sentence[:cause_indicator_pos].strip()
                conclusion = match.group(1).strip()
                
                if premise and conclusion:
                    chains.append({
                        'chain_type': 'causal',
                        'premise': [premise],
                        'conclusion': conclusion,
                        'confidence': 0.7,
                        'source_conversation_id': conversation_id
                    })
        
        return chains
    
    def _extract_deductive_chains(
        self, 
        text: str, 
        conversation_id: str
    ) -> List[Dict]:
        """Extract deductive reasoning (if-then logic)"""
        chains = []
        
        for pattern in self.DEDUCTIVE_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                premise = match.group(1).strip()
                conclusion = match.group(2).strip()
                
                if premise and conclusion:
                    chains.append({
                        'chain_type': 'deductive',
                        'premise': [premise],
                        'conclusion': conclusion,
                        'confidence': 0.8,
                        'source_conversation_id': conversation_id
                    })
        
        return chains
    
    def _extract_inductive_chains(
        self, 
        text: str, 
        conversation_id: str
    ) -> List[Dict]:
        """Extract inductive reasoning (generalizations)"""
        chains = []
        
        for pattern in self.INDUCTIVE_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Get surrounding context
                sentence = text[max(0, match.start()-50):match.end()+50]
                generalization = match.group(0).strip()
                
                chains.append({
                    'chain_type': 'inductive',
                    'premise': [sentence],
                    'conclusion': generalization,
                    'confidence': 0.6,  # Lower confidence for generalizations
                    'source_conversation_id': conversation_id
                })
        
        return chains
    
    def _extract_analogical_chains(
        self, 
        text: str, 
        conversation_id: str
    ) -> List[Dict]:
        """Extract analogical reasoning (comparisons)"""
        chains = []
        
        for pattern in self.ANALOGICAL_PATTERNS:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                if len(match.groups()) >= 2:
                    source = match.group(1).strip()
                    target = match.group(2).strip()
                    
                    chains.append({
                        'chain_type': 'analogical',
                        'premise': [source],
                        'conclusion': target,
                        'confidence': 0.65,
                        'source_conversation_id': conversation_id
                    })
        
        return chains
    
    def _save_chains(self, user_id: str, chains: Dict[str, List[Dict]]):
        """Save extracted chains to database"""
        for chain_type, chain_list in chains.items():
            for chain in chain_list:
                # Detect domain from content
                domain = self._detect_domain(
                    chain['premise'][0] + " " + chain['conclusion']
                )
                
                query = """
                    INSERT INTO reasoning_chains
                    (user_id, chain_type, premise, conclusion, confidence, 
                     domain, source_conversation_id, extracted_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                db.execute_update(
                    query,
                    (
                        user_id,
                        chain['chain_type'],
                        json.dumps(chain['premise']),
                        chain['conclusion'],
                        chain['confidence'],
                        domain,
                        chain.get('source_conversation_id'),
                        datetime.now().isoformat()
                    )
                )
    
    def _detect_domain(self, text: str) -> str:
        """Detect reasoning domain from text"""
        text_lower = text.lower()
        
        domain_keywords = {
            'work': ['work', 'job', 'career', 'office', 'project', 'meeting'],
            'relationships': ['relationship', 'friend', 'family', 'love', 'partner'],
            'technology': ['tech', 'software', 'computer', 'app', 'code', 'programming'],
            'health': ['health', 'exercise', 'diet', 'medical', 'doctor'],
            'finance': ['money', 'invest', 'budget', 'financial', 'cost'],
            'philosophy': ['think', 'believe', 'meaning', 'purpose', 'existence'],
        }
        
        for domain, keywords in domain_keywords.items():
            if any(kw in text_lower for kw in keywords):
                return domain
        
        return 'general'
    
    def _build_knowledge_graph(
        self, 
        user_id: str, 
        chains: Dict[str, List[Dict]]
    ):
        """Build knowledge graph from reasoning chains"""
        # Add nodes and edges from all chains
        for chain_type, chain_list in chains.items():
            for chain in chain_list:
                premise_text = " ".join(chain['premise'])
                conclusion_text = chain['conclusion']
                
                # Extract key concepts (simplified)
                premise_concepts = self._extract_concepts(premise_text)
                conclusion_concepts = self._extract_concepts(conclusion_text)
                
                # Add edges between concepts
                for p_concept in premise_concepts:
                    for c_concept in conclusion_concepts:
                        relation = self._map_chain_type_to_relation(chain_type)
                        self._add_or_update_edge(
                            user_id, 
                            p_concept, 
                            relation, 
                            c_concept,
                            chain['confidence']
                        )
    
    def _extract_concepts(self, text: str) -> List[str]:
        """Extract key concepts from text"""
        if self.nlp:
            doc = self.nlp(text)
            # Extract noun chunks and named entities
            concepts = [chunk.text.lower() for chunk in doc.noun_chunks]
            concepts.extend([ent.text.lower() for ent in doc.ents])
            return list(set(concepts))[:5]  # Top 5 concepts
        else:
            # Fallback: extract capitalized words and key nouns
            words = text.split()
            concepts = [
                w.lower() for w in words 
                if len(w) > 4 and (w[0].isupper() or w.lower() in ['work', 'life', 'people'])
            ]
            return concepts[:5]
    
    def _map_chain_type_to_relation(self, chain_type: str) -> str:
        """Map reasoning chain type to graph relation"""
        mapping = {
            'causal': 'causes',
            'deductive': 'implies',
            'inductive': 'generalizes_to',
            'analogical': 'similar_to',
            'abductive': 'explains'
        }
        return mapping.get(chain_type, 'relates_to')
    
    def _add_or_update_edge(
        self,
        user_id: str,
        source: str,
        relation: str,
        target: str,
        confidence: float
    ):
        """Add or update knowledge graph edge"""
        query = """
            INSERT INTO knowledge_graph
            (user_id, source_concept, relation_type, target_concept, 
             strength, evidence_count, last_updated)
            VALUES (?, ?, ?, ?, ?, 1, ?)
            ON CONFLICT(user_id, source_concept, relation_type, target_concept)
            DO UPDATE SET
                strength = (strength * evidence_count + ?) / (evidence_count + 1),
                evidence_count = evidence_count + 1,
                last_updated = ?
        """
        
        now = datetime.now().isoformat()
        db.execute_update(
            query,
            (user_id, source, relation, target, confidence, now, confidence, now)
        )
        
        # Also add to in-memory graph
        self.knowledge_graph.add_edge(
            source, 
            target, 
            relation=relation, 
            weight=confidence
        )
    
    def get_reasoning_patterns(self, user_id: str) -> Dict[str, any]:
        """Get user's reasoning pattern statistics"""
        query = """
            SELECT 
                chain_type,
                COUNT(*) as count,
                AVG(confidence) as avg_confidence,
                domain
            FROM reasoning_chains
            WHERE user_id = ?
            GROUP BY chain_type, domain
            ORDER BY count DESC
        """
        
        patterns = db.execute_query(query, (user_id,))
        
        # Get most common domains
        domain_query = """
            SELECT domain, COUNT(*) as count
            FROM reasoning_chains
            WHERE user_id = ?
            GROUP BY domain
            ORDER BY count DESC
            LIMIT 5
        """
        domains = db.execute_query(domain_query, (user_id,))
        
        return {
            'patterns': patterns,
            'top_domains': domains,
            'total_chains': sum(p['count'] for p in patterns),
            'preferred_reasoning_style': patterns[0]['chain_type'] if patterns else None
        }
    
    def query_knowledge_graph(
        self, 
        user_id: str, 
        concept: str, 
        max_depth: int = 2
    ) -> Dict[str, any]:
        """Query knowledge graph for related concepts"""
        # Load graph from database if empty
        if not self.knowledge_graph.nodes():
            self._load_knowledge_graph(user_id)
        
        concept_lower = concept.lower()
        
        if concept_lower not in self.knowledge_graph:
            return {'concept': concept, 'related': [], 'chains': []}
        
        # Get related concepts within max_depth
        related = []
        for node in nx.single_source_shortest_path_length(
            self.knowledge_graph, 
            concept_lower, 
            cutoff=max_depth
        ):
            if node != concept_lower:
                # Get edge data
                if self.knowledge_graph.has_edge(concept_lower, node):
                    edge_data = self.knowledge_graph[concept_lower][node]
                    related.append({
                        'concept': node,
                        'relation': edge_data.get('relation', 'relates_to'),
                        'confidence': edge_data.get('weight', 0.5)
                    })
        
        return {
            'concept': concept,
            'related': sorted(related, key=lambda x: x['confidence'], reverse=True),
            'graph_size': len(self.knowledge_graph.nodes())
        }
    
    def _load_knowledge_graph(self, user_id: str):
        """Load knowledge graph from database"""
        query = """
            SELECT source_concept, relation_type, target_concept, strength
            FROM knowledge_graph
            WHERE user_id = ?
        """
        
        edges = db.execute_query(query, (user_id,))
        
        for edge in edges:
            self.knowledge_graph.add_edge(
                edge['source_concept'],
                edge['target_concept'],
                relation=edge['relation_type'],
                weight=edge['strength']
            )


# Global instance
reasoning_extractor = ReasoningChainExtractor()
