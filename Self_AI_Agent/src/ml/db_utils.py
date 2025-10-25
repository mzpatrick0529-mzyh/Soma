"""
Database utilities for ML services
"""
import sqlite3
import json
from typing import Any, Dict, List, Optional, Tuple
from contextlib import contextmanager
from datetime import datetime
import hashlib

from .config import settings


class Database:
    """Database wrapper for ML services"""
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or settings.DATABASE_PATH
    
    @contextmanager
    def get_connection(self):
        """Get database connection context manager"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def execute_query(
        self, 
        query: str, 
        params: Tuple = (), 
        fetch_one: bool = False
    ) -> Optional[List[Dict]]:
        """Execute a query and return results"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            
            if fetch_one:
                row = cursor.fetchone()
                return dict(row) if row else None
            
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    
    def execute_update(self, query: str, params: Tuple = ()) -> int:
        """Execute an update/insert and return affected rows"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.rowcount
    
    def insert_and_get_id(self, query: str, params: Tuple = ()) -> int:
        """Execute insert and return last inserted id"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.lastrowid
    
    # Cache operations
    def get_cached(
        self, 
        user_id: str, 
        module_name: str, 
        input_data: Any
    ) -> Optional[Dict]:
        """Get cached result if available and not expired"""
        if not settings.ENABLE_CACHE:
            return None
        
        input_hash = hashlib.sha256(
            json.dumps(input_data, sort_keys=True).encode()
        ).hexdigest()
        
        query = """
            SELECT output_data
            FROM cognitive_cache
            WHERE user_id = ? 
              AND module_name = ? 
              AND input_hash = ?
              AND (expires_at IS NULL OR expires_at > ?)
        """
        
        result = self.execute_query(
            query, 
            (user_id, module_name, input_hash, datetime.now().isoformat()),
            fetch_one=True
        )
        
        if result:
            return json.loads(result['output_data'])
        return None
    
    def set_cached(
        self,
        user_id: str,
        module_name: str,
        input_data: Any,
        output_data: Any,
        computation_time_ms: int = None,
        ttl_seconds: int = None
    ):
        """Cache computation result"""
        if not settings.ENABLE_CACHE:
            return
        
        input_hash = hashlib.sha256(
            json.dumps(input_data, sort_keys=True).encode()
        ).hexdigest()
        
        expires_at = None
        if ttl_seconds:
            from datetime import timedelta
            expires_at = (
                datetime.now() + timedelta(seconds=ttl_seconds)
            ).isoformat()
        
        query = """
            INSERT OR REPLACE INTO cognitive_cache
            (user_id, module_name, input_hash, output_data, 
             computation_time_ms, created_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        
        self.execute_update(
            query,
            (
                user_id,
                module_name,
                input_hash,
                json.dumps(output_data),
                computation_time_ms,
                datetime.now().isoformat(),
                expires_at
            )
        )
    
    # Conversation retrieval
    def get_user_conversations(
        self, 
        user_id: str, 
        limit: int = 100,
        include_context: bool = True
    ) -> List[Dict]:
        """Get user's conversation history"""
        query = """
            SELECT 
                cm.id,
                cm.conversation_id,
                cm.role,
                cm.content,
                cm.timestamp,
                cm.context_metadata
            FROM conversation_memory cm
            WHERE cm.user_id = ?
            ORDER BY cm.timestamp DESC
            LIMIT ?
        """
        
        rows = self.execute_query(query, (user_id, limit))
        
        if include_context and rows:
            for row in rows:
                if row.get('context_metadata'):
                    row['context_metadata'] = json.loads(row['context_metadata'])
        
        return rows
    
    def get_relationship_profiles(self, user_id: str) -> List[Dict]:
        """Get all relationship profiles for user"""
        query = """
            SELECT *
            FROM relationship_profiles
            WHERE user_id = ?
        """
        
        rows = self.execute_query(query, (user_id,))
        
        for row in rows:
            if row.get('conversation_style'):
                row['conversation_style'] = json.loads(row['conversation_style'])
            if row.get('topics_of_interest'):
                row['topics_of_interest'] = json.loads(row['topics_of_interest'])
        
        return rows
    
    def get_persona_profile(self, user_id: str) -> Optional[Dict]:
        """Get user's persona profile"""
        query = """
            SELECT *
            FROM persona_profiles
            WHERE user_id = ?
        """
        
        result = self.execute_query(query, (user_id,), fetch_one=True)
        
        if result:
            # Parse JSON fields
            json_fields = [
                'linguistic_features',
                'behavioral_traits',
                'emotional_patterns',
                'knowledge_domains',
                'communication_style'
            ]
            for field in json_fields:
                if result.get(field):
                    result[field] = json.loads(result[field])
        
        return result
    
    # Initialize ML schema
    def initialize_ml_schema(self):
        """Initialize Phase 5 database schema"""
        import os
        schema_path = os.path.join(
            os.path.dirname(__file__),
            'schema.sql'
        )
        
        if not os.path.exists(schema_path):
            print(f"Warning: Schema file not found at {schema_path}")
            return
        
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        with self.get_connection() as conn:
            conn.executescript(schema_sql)
        
        print("Phase 5 ML schema initialized successfully")


# Global database instance
db = Database()
