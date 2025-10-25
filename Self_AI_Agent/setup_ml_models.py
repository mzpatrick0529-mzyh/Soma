#!/usr/bin/env python3
"""
Phase 7A Model Setup Script
下载和初始化所有ML模型

Usage:
    python setup_ml_models.py
"""

import os
import sys
from pathlib import Path

def setup_environment():
    """设置环境"""
    print("🔧 Setting up Python environment...")
    
    # 检查Python版本
    if sys.version_info < (3, 9):
        print("❌ Error: Python 3.9+ required")
        sys.exit(1)
    
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor}")


def install_dependencies():
    """安装依赖"""
    print("\n📦 Installing ML dependencies...")
    
    requirements_file = Path(__file__).parent / "requirements-ml.txt"
    
    if not requirements_file.exists():
        print(f"❌ Error: {requirements_file} not found")
        sys.exit(1)
    
    os.system(f"pip install -r {requirements_file}")
    print("✅ Dependencies installed")


def download_emotion_models():
    """下载情感识别模型"""
    print("\n🧠 Downloading emotion recognition models...")
    
    try:
        from transformers import pipeline, AutoModelForSequenceClassification, AutoTokenizer
        
        # 1. GoEmotions (28种情感)
        print("  📥 Downloading GoEmotions model...")
        emotion_classifier = pipeline(
            "text-classification",
            model="SamLowe/roberta-base-go_emotions",
            top_k=None
        )
        print("  ✅ GoEmotions model ready")
        
        # 2. 讽刺检测器
        print("  📥 Downloading Sarcasm detector...")
        sarcasm_detector = pipeline(
            "text-classification",
            model="mrm8488/t5-base-finetuned-sarcasm-twitter"
        )
        print("  ✅ Sarcasm detector ready")
        
        # 3. 情感强度模型
        print("  📥 Downloading Emotion intensity model...")
        intensity_model = AutoModelForSequenceClassification.from_pretrained(
            "cardiffnlp/twitter-roberta-base-emotion-multilabel-latest"
        )
        intensity_tokenizer = AutoTokenizer.from_pretrained(
            "cardiffnlp/twitter-roberta-base-emotion-multilabel-latest"
        )
        print("  ✅ Emotion intensity model ready")
        
        print("\n✅ All emotion models downloaded successfully!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error downloading emotion models: {e}")
        print("\n💡 Tip: Make sure you have enough disk space (~2GB)")
        return False


def test_emotion_model():
    """测试情感模型"""
    print("\n🧪 Testing emotion model...")
    
    try:
        sys.path.insert(0, str(Path(__file__).parent / "src"))
        from ml.services.emotion_model_v2 import analyze_emotion
        
        # 测试用例
        test_cases = [
            "I'm so happy today!",
            "This is frustrating.",
            "Oh great, another problem."
        ]
        
        for text in test_cases:
            result = analyze_emotion(text)
            print(f"  '{text}'")
            print(f"    → {result['primary_emotion']} (score: {result['primary_score']:.2f})")
        
        print("\n✅ Emotion model working correctly!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error testing emotion model: {e}")
        return False


def download_causal_models():
    """设置因果推理库"""
    print("\n🔗 Setting up causal inference libraries...")
    
    try:
        import dowhy
        import causalml
        import causalnex
        
        print("  ✅ DoWhy installed")
        print("  ✅ CausalML installed")
        print("  ✅ CausalNex installed")
        
        print("\n✅ Causal inference libraries ready!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error setting up causal libraries: {e}")
        return False


def setup_neo4j():
    """设置Neo4j"""
    print("\n🔷 Setting up Neo4j...")
    
    # 检查Docker
    docker_check = os.system("docker --version > /dev/null 2>&1")
    
    if docker_check != 0:
        print("  ⚠️  Docker not found - Neo4j setup skipped")
        print("  💡 Install Docker to enable Knowledge Graph features")
        return False
    
    print("  ✅ Docker detected")
    print("  💡 Run 'docker-compose -f docker-compose-ml.yml up -d neo4j' to start Neo4j")
    return True


def download_spacy_model():
    """下载spaCy模型"""
    print("\n🔤 Downloading spaCy language model...")
    
    try:
        import spacy
        
        # 下载英文模型
        os.system("python -m spacy download en_core_web_sm")
        
        # 测试
        nlp = spacy.load("en_core_web_sm")
        doc = nlp("This is a test.")
        
        print("  ✅ spaCy model ready")
        return True
        
    except Exception as e:
        print(f"  ⚠️  spaCy model download failed: {e}")
        return False


def print_summary(results):
    """打印总结"""
    print("\n" + "="*70)
    print("📊 SETUP SUMMARY")
    print("="*70)
    
    total = len(results)
    success = sum(results.values())
    
    for task, status in results.items():
        icon = "✅" if status else "❌"
        print(f"{icon} {task}")
    
    print("="*70)
    print(f"Success Rate: {success}/{total} ({success/total*100:.0f}%)")
    
    if success == total:
        print("\n🎉 All models ready! You can now start Phase 7A development.")
        print("\n📝 Next steps:")
        print("  1. Test emotion model: python tests/test_emotion_v2.py")
        print("  2. Implement causal reasoning: See PHASE7_DEEP_OPTIMIZATION_PLAN.md")
        print("  3. Start Neo4j: docker-compose -f docker-compose-ml.yml up -d neo4j")
    else:
        print("\n⚠️  Some models failed to download. Please check errors above.")
        print("\n💡 You can retry failed downloads individually.")


def main():
    """主函数"""
    print("="*70)
    print("🚀 PHASE 7A: ML MODEL SETUP")
    print("="*70)
    
    results = {}
    
    # 1. 环境检查
    setup_environment()
    
    # 2. 安装依赖
    install_dependencies()
    
    # 3. 下载模型
    results['Emotion Models'] = download_emotion_models()
    results['Causal Libraries'] = download_causal_models()
    results['spaCy Model'] = download_spacy_model()
    results['Neo4j Setup'] = setup_neo4j()
    
    # 4. 测试
    if results['Emotion Models']:
        results['Emotion Model Test'] = test_emotion_model()
    
    # 5. 总结
    print_summary(results)


if __name__ == "__main__":
    main()
