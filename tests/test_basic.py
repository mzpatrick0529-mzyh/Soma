"""
Test suite for Soma platform

Basic tests for core functionality.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from soma import AvatarEngine, DataAggregator, TextConversation, ModelTrainer


def test_data_aggregator():
    """Test data aggregation functionality."""
    aggregator = DataAggregator("test_user")
    
    # Test adding chat history
    chat_data = [{"content": "Hello", "timestamp": "2024-01-01T10:00:00"}]
    aggregator.add_chat_history(chat_data)
    
    data = aggregator.get_aggregated_data()
    assert data["total_chat_messages"] == 1
    assert data["user_id"] == "test_user"
    print("✓ test_data_aggregator passed")


def test_avatar_engine():
    """Test avatar engine functionality."""
    avatar = AvatarEngine("test_user", avatar_name="TestAvatar")
    
    assert avatar.avatar_name == "TestAvatar"
    assert avatar.user_id == "test_user"
    
    # Test greeting generation
    greeting = avatar.generate_greeting()
    assert isinstance(greeting, str)
    assert len(greeting) > 0
    
    # Test emotional state
    state = avatar.get_emotional_state()
    assert "bond_strength" in state
    assert "interaction_count" in state
    
    print("✓ test_avatar_engine passed")


def test_text_conversation():
    """Test text conversation functionality."""
    avatar = AvatarEngine("test_user")
    conversation = TextConversation(avatar, "test_user")
    
    # Test sending message
    response = conversation.send_message("Hello")
    assert isinstance(response, str)
    assert len(response) > 0
    
    # Test conversation history
    history = conversation.get_conversation_history()
    assert len(history) == 2  # User message + avatar response
    
    print("✓ test_text_conversation passed")


def test_model_trainer():
    """Test model trainer functionality."""
    trainer = ModelTrainer("test_user", model_name="gpt2")
    
    # Test with sample data
    sample_data = {
        "data_sources": {
            "chat_histories": [{"content": "Hello"}],
            "social_media": []
        }
    }
    
    trainer.prepare_training_data(sample_data)
    stats = trainer.get_training_stats()
    
    assert stats["user_id"] == "test_user"
    assert stats["training_samples"] == 1
    
    print("✓ test_model_trainer passed")


def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("Running Soma Platform Tests")
    print("=" * 60 + "\n")
    
    tests = [
        test_data_aggregator,
        test_avatar_engine,
        test_text_conversation,
        test_model_trainer
    ]
    
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"✗ {test.__name__} failed: {e}")
            raise
    
    print("\n" + "=" * 60)
    print("All tests passed!")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    run_all_tests()
