"""
Soma Platform Example Usage

This script demonstrates how to use the Soma AI Avatar platform.
"""

from soma import (
    AvatarEngine,
    TextConversation,
    VoiceConversation,
    DataAggregator,
    ModelTrainer
)
from soma.media.video_manager import VideoManager
from soma.blog.blog_manager import BlogManager
from soma.proactive_engagement.engagement_manager import ProactiveEngagement


def main():
    """
    Main example demonstrating the Soma platform features.
    """
    print("=" * 60)
    print("Soma AI Avatar Platform - Example Usage")
    print("=" * 60)
    
    # User identification
    user_id = "user_001"
    
    # Step 1: Data Aggregation
    print("\n1. Aggregating User Data...")
    aggregator = DataAggregator(user_id)
    
    # Add chat histories
    chat_data = [
        {"content": "Hey, how are you doing?", "timestamp": "2024-01-01T10:00:00"},
        {"content": "I'm working on an interesting project.", "timestamp": "2024-01-01T10:05:00"},
        {"content": "Life has been great lately!", "timestamp": "2024-01-01T10:10:00"}
    ]
    aggregator.add_chat_history(chat_data)
    
    # Add social media data
    social_posts = [
        {"text": "Beautiful day today!", "platform": "twitter"},
        {"text": "Just finished reading an amazing book", "platform": "twitter"}
    ]
    aggregator.add_social_media_data("twitter", social_posts)
    
    # Save aggregated data
    aggregator.save_aggregated_data()
    print(f"   ✓ Aggregated {aggregator.get_aggregated_data()['total_chat_messages']} chat messages")
    print(f"   ✓ Aggregated {aggregator.get_aggregated_data()['total_social_media_entries']} social media entries")
    
    # Step 2: Model Training
    print("\n2. Training AI Avatar Model...")
    trainer = ModelTrainer(user_id, model_name="gpt2")
    trainer.prepare_training_data(aggregator.get_aggregated_data())
    trainer.load_base_model()
    print(f"   ✓ Prepared {trainer.get_training_stats()['training_samples']} training samples")
    print("   ✓ Base model loaded")
    
    # Step 3: Create Avatar
    print("\n3. Creating AI Avatar...")
    avatar = AvatarEngine(user_id, avatar_name="MyAvatar")
    avatar.initialize_personality(aggregator.get_aggregated_data())
    print(f"   ✓ Avatar '{avatar.avatar_name}' created")
    print(f"   ✓ Communication style: {avatar.personality_profile.get('communication_style', 'N/A')}")
    
    # Step 4: Text Conversation
    print("\n4. Text Conversation Example...")
    text_chat = TextConversation(avatar, user_id)
    
    print("   User: Hello!")
    response = text_chat.send_message("Hello!")
    print(f"   Avatar: {response}")
    
    print("   User: How are you?")
    response = text_chat.send_message("How are you?")
    print(f"   Avatar: {response}")
    
    # Step 5: Proactive Engagement
    print("\n5. Proactive Engagement...")
    engagement = ProactiveEngagement(avatar, user_id)
    
    # Schedule greeting
    greeting = engagement.schedule_greeting("morning")
    print(f"   ✓ Scheduled greeting: {greeting['message']}")
    
    # Send update
    update = engagement.send_update("recent developments")
    print(f"   ✓ Sent update: {update['message']}")
    
    # Check-in
    check_in = engagement.check_in()
    print(f"   ✓ Check-in: {check_in['message']}")
    
    # Step 6: Blog Management
    print("\n6. Blog System...")
    blog = BlogManager(user_id, avatar)
    
    # User creates a post
    user_post = blog.create_post(
        title="My Journey with AI",
        content="Today I started using an AI avatar platform...",
        author="user"
    )
    print(f"   ✓ User created post: '{user_post['title']}'")
    
    # Avatar generates a post
    avatar_post = blog.generate_avatar_post("friendship")
    print(f"   ✓ Avatar created post: '{avatar_post['title']}'")
    
    # Step 7: Video Management
    print("\n7. Video Sharing...")
    video_mgr = VideoManager(user_id)
    print("   ✓ Video manager initialized")
    print("   ✓ Ready to upload and share videos")
    
    # Step 8: Emotional Bond Status
    print("\n8. Emotional Bond Status...")
    emotional_state = avatar.get_emotional_state()
    print(f"   ✓ Bond strength: {emotional_state['bond_strength']:.2f}")
    print(f"   ✓ Total interactions: {emotional_state['interaction_count']}")
    
    # Step 9: Save Avatar State
    print("\n9. Saving Avatar State...")
    avatar_path = avatar.save_avatar_state()
    print(f"   ✓ Avatar state saved to {avatar_path}")
    
    print("\n" + "=" * 60)
    print("Example completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
