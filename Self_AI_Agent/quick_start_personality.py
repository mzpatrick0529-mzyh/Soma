#!/usr/bin/env python3
"""
人格系统快速启动脚本
一键运行特征提取和推理测试
"""

import os
import sys
import json
import sqlite3
from datetime import datetime

# 添加项目路径
sys.path.insert(0, os.path.dirname(__file__))

from ml.personality_extractor import PersonalityFeatureExtractor


def check_dependencies():
    """检查依赖"""
    missing = []
    
    try:
        import spacy
    except ImportError:
        missing.append('spacy')
    
    try:
        import textblob
    except ImportError:
        missing.append('textblob')
    
    try:
        import nltk
    except ImportError:
        missing.append('nltk')
    
    if missing:
        print("❌ Missing dependencies:")
        for pkg in missing:
            print(f"   - {pkg}")
        print("\nInstall with:")
        print(f"pip install {' '.join(missing)}")
        print("python -m spacy download en_core_web_sm")
        return False
    
    return True


def initialize_database(db_path: str = './self_agent.db'):
    """初始化人格数据库表"""
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return False
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 检查表是否存在
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='user_personality_vectors'
    """)
    
    if not cursor.fetchone():
        print("⚠️  Personality tables not found. Creating...")
        
        # 执行 schema
        schema_path = './src/db/personality_schema.sql'
        if os.path.exists(schema_path):
            with open(schema_path, 'r') as f:
                cursor.executescript(f.read())
            print("✓ Tables created")
        else:
            print(f"❌ Schema file not found: {schema_path}")
            conn.close()
            return False
    
    conn.close()
    return True


def export_conversations(user_id: str, db_path: str = './self_agent.db', limit: int = 500):
    """导出用户对话数据"""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 从documents和chunks表提取
    cursor.execute("""
        SELECT 
            d.id,
            d.title,
            c.text,
            d.timestamp,
            d.metadata,
            d.source
        FROM documents d
        JOIN chunks c ON d.id = c.document_id
        WHERE d.user_id = ?
        AND d.source IN ('wechat', 'instagram', 'google', 'chat')
        ORDER BY d.timestamp DESC
        LIMIT ?
    """, (user_id, limit))
    
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        print(f"❌ No conversation data found for user: {user_id}")
        return None
    
    conversations = []
    for row in rows:
        try:
            metadata = json.loads(row[4]) if row[4] else {}
        except:
            metadata = {}
        
        conversations.append({
            'doc_id': row[0],
            'title': row[1],
            'content': row[2],
            'timestamp': datetime.fromisoformat(row[3]) if row[3] else datetime.now(),
            'sender': user_id,
            'is_user_message': True,
            'metadata': metadata,
            'source': row[5]
        })
    
    print(f"✓ Exported {len(conversations)} conversations")
    return conversations


def run_feature_extraction(user_id: str, db_path: str = './self_agent.db'):
    """运行特征提取"""
    print("\n" + "="*60)
    print("特征提取开始".center(60))
    print("="*60 + "\n")
    
    # 1. 导出对话
    print("📦 Step 1: Exporting conversations...")
    conversations = export_conversations(user_id, db_path)
    
    if not conversations or len(conversations) < 10:
        print(f"❌ Insufficient data: {len(conversations) if conversations else 0} conversations")
        print("   Need at least 10 conversations for feature extraction")
        return False
    
    # 2. 提取特征
    print(f"\n🧠 Step 2: Extracting personality features from {len(conversations)} conversations...")
    extractor = PersonalityFeatureExtractor()
    
    try:
        features = extractor.extract_all_features(conversations, user_id)
        print("✓ Feature extraction completed")
    except Exception as e:
        print(f"❌ Feature extraction failed: {e}")
        return False
    
    # 3. 保存到数据库
    print("\n💾 Step 3: Saving to database...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 插入人格向量
        cursor.execute("""
            INSERT OR REPLACE INTO user_personality_vectors (
                user_id,
                vocab_complexity,
                sentence_length_pref,
                formality_level,
                humor_frequency,
                emoji_usage_rate,
                catchphrases,
                punctuation_style,
                baseline_sentiment,
                emotional_volatility,
                empathy_level,
                optimism_score,
                analytical_vs_intuitive,
                detail_oriented,
                extraversion_score,
                response_time_pattern,
                daily_routine,
                hobby_interests,
                last_trained_at,
                training_samples_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
        """, (
            user_id,
            features['linguistic']['vocabulary_complexity'],
            features['linguistic']['sentence_length_preference'],
            features['linguistic']['formality_level'],
            features['linguistic']['humor_frequency'],
            features['linguistic']['emoji_usage_rate'],
            json.dumps(features['linguistic']['catchphrases'], ensure_ascii=False),
            json.dumps(features['linguistic']['punctuation_style']),
            features['emotional']['baseline_sentiment'],
            features['emotional']['emotional_volatility'],
            features['emotional']['empathy_level'],
            features['emotional']['optimism_score'],
            features['cognitive']['analytical_vs_intuitive'],
            features['cognitive']['detail_oriented'],
            features['social']['extraversion_score'],
            json.dumps(features['social']['response_time_pattern']),
            json.dumps(features['behavioral']['daily_routine']),
            json.dumps(features['behavioral']['hobby_interests'], ensure_ascii=False),
            features['metadata']['total_messages_analyzed']
        ))
        
        # 插入价值观
        for key, value in features['values']['priorities'].items():
            cursor.execute("""
                INSERT OR REPLACE INTO user_value_systems (
                    user_id, priority_key, priority_value, confidence_score
                ) VALUES (?, ?, ?, 0.7)
            """, (user_id, key, value))
        
        # 插入关系图谱
        for person_id, rel in features['social']['relationship_map'].items():
            cursor.execute("""
                INSERT OR REPLACE INTO user_relationships (
                    user_id, person_identifier, intimacy_level,
                    interaction_frequency, emotional_tone, total_interactions
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                user_id, person_id,
                rel['intimacy_level'],
                rel['interaction_frequency'],
                rel['emotional_tone'],
                rel['total_interactions']
            ))
        
        conn.commit()
        print("✓ Data saved successfully")
        
    except Exception as e:
        print(f"❌ Database save failed: {e}")
        conn.rollback()
        conn.close()
        return False
    
    conn.close()
    
    # 4. 显示结果摘要
    print("\n" + "="*60)
    print("提取结果摘要".center(60))
    print("="*60)
    print(f"\n语言风格:")
    print(f"  • 词汇复杂度: {features['linguistic']['vocabulary_complexity']:.2f}")
    print(f"  • 正式程度: {features['linguistic']['formality_level']:.2f}")
    print(f"  • 平均句长: {features['linguistic']['sentence_length_preference']:.1f}词")
    print(f"  • 表情使用率: {features['linguistic']['emoji_usage_rate']:.2f}")
    if features['linguistic']['catchphrases']:
        print(f"  • 口头禅: {', '.join(features['linguistic']['catchphrases'][:3])}")
    
    print(f"\n情感特征:")
    print(f"  • 基线情绪: {features['emotional']['baseline_sentiment']:.2f}")
    print(f"  • 情绪波动: {features['emotional']['emotional_volatility']:.2f}")
    print(f"  • 共情能力: {features['emotional']['empathy_level']:.2f}")
    print(f"  • 乐观度: {features['emotional']['optimism_score']:.2f}")
    
    print(f"\n社交风格:")
    print(f"  • 外向性: {features['social']['extraversion_score']:.2f}")
    print(f"  • 关系数量: {len(features['social']['relationship_map'])}")
    
    if features['values']['priorities']:
        print(f"\n价值观排序:")
        sorted_values = sorted(
            features['values']['priorities'].items(),
            key=lambda x: x[1],
            reverse=True
        )
        for i, (key, val) in enumerate(sorted_values[:5], 1):
            print(f"  {i}. {key}: {val:.3f}")
    
    print("\n" + "="*60)
    print("✅ Feature extraction completed successfully!".center(60))
    print("="*60)
    
    return True


def test_inference(user_id: str, db_path: str = './self_agent.db'):
    """测试推理引擎"""
    print("\n" + "="*60)
    print("推理测试".center(60))
    print("="*60 + "\n")
    
    # TODO: 实现推理测试
    print("⚠️  Inference testing requires backend server running")
    print("   Start server with: npm run dev")
    print("   Then test via API: POST /api/personality/generate")
    
    return True


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Personality System Quick Start')
    parser.add_argument('--user-id', required=True, help='User ID')
    parser.add_argument('--db-path', default='./self_agent.db', help='Database path')
    parser.add_argument('--skip-check', action='store_true', help='Skip dependency check')
    parser.add_argument('--test-only', action='store_true', help='Only run inference test')
    
    args = parser.parse_args()
    
    print("\n🚀 Self Agent Personality System - Quick Start\n")
    
    # 检查依赖
    if not args.skip_check:
        print("Step 1: Checking dependencies...")
        if not check_dependencies():
            sys.exit(1)
        print("✓ All dependencies installed\n")
    
    # 初始化数据库
    print("Step 2: Initializing database...")
    if not initialize_database(args.db_path):
        sys.exit(1)
    print("✓ Database ready\n")
    
    if args.test_only:
        # 仅测试推理
        test_inference(args.user_id, args.db_path)
    else:
        # 运行特征提取
        if run_feature_extraction(args.user_id, args.db_path):
            print("\n✅ Setup completed! You can now:")
            print("   1. Start backend: cd Self_AI_Agent && npm run dev")
            print("   2. Test API: curl http://localhost:8787/api/personality/" + args.user_id)
            print("   3. Generate response: POST /api/personality/generate")
        else:
            print("\n❌ Setup failed. Please check errors above.")
            sys.exit(1)


if __name__ == '__main__':
    main()
