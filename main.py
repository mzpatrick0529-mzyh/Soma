"""
Soma Platform Main Entry Point

This module provides a simple command-line interface for the Soma platform.
"""

import sys
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from soma import AvatarEngine, TextConversation, DataAggregator, ModelTrainer
from soma.media.video_manager import VideoManager
from soma.blog.blog_manager import BlogManager
from soma.proactive_engagement.engagement_manager import ProactiveEngagement

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    """
    Main entry point for the Soma platform.
    """
    print("\n" + "=" * 70)
    print("Welcome to Soma - An Emotionally Interactive Digital Memory Platform")
    print("=" * 70 + "\n")
    
    print("Soma aggregates users' multimodal digital footprints to create")
    print("AI avatars that authentically replicate behavioral styles.\n")
    
    print("Features:")
    print("  • Multimodal data aggregation (chat, audio, video, social media)")
    print("  • AI avatar creation with personality modeling")
    print("  • Text and voice conversations")
    print("  • Video sharing and blog posts")
    print("  • Proactive engagement and emotional bonding\n")
    
    print("=" * 70 + "\n")
    
    # Interactive menu
    while True:
        print("Options:")
        print("  1. Run example demonstration")
        print("  2. Create a new avatar")
        print("  3. View API documentation")
        print("  4. Exit")
        
        choice = input("\nSelect an option (1-4): ").strip()
        
        if choice == "1":
            run_example()
        elif choice == "2":
            create_avatar_interactive()
        elif choice == "3":
            show_api_docs()
        elif choice == "4":
            print("\nThank you for using Soma!")
            break
        else:
            print("\nInvalid option. Please try again.")


def run_example():
    """Run the example demonstration."""
    print("\n" + "-" * 70)
    print("Running Example Demonstration")
    print("-" * 70 + "\n")
    
    try:
        import examples.basic_usage as example
        example.main()
    except Exception as e:
        logger.error(f"Error running example: {e}")
        print(f"\nError: {e}")
    
    input("\nPress Enter to continue...")


def create_avatar_interactive():
    """Create a new avatar interactively."""
    print("\n" + "-" * 70)
    print("Create New Avatar")
    print("-" * 70 + "\n")
    
    user_id = input("Enter user ID: ").strip()
    avatar_name = input("Enter avatar name: ").strip()
    
    if not user_id or not avatar_name:
        print("\nError: User ID and avatar name are required.")
        input("\nPress Enter to continue...")
        return
    
    try:
        # Create aggregator
        print("\nInitializing data aggregator...")
        aggregator = DataAggregator(user_id)
        
        # Create avatar
        print(f"Creating avatar '{avatar_name}'...")
        avatar = AvatarEngine(user_id, avatar_name=avatar_name)
        
        print(f"\n✓ Avatar '{avatar_name}' created successfully!")
        print(f"  User ID: {user_id}")
        print(f"  Avatar Name: {avatar_name}")
        
    except Exception as e:
        logger.error(f"Error creating avatar: {e}")
        print(f"\nError: {e}")
    
    input("\nPress Enter to continue...")


def show_api_docs():
    """Show API documentation information."""
    print("\n" + "-" * 70)
    print("API Documentation")
    print("-" * 70 + "\n")
    
    print("For detailed API documentation, see API.md in the project root.")
    print("\nCore modules:")
    print("  • AvatarEngine: Avatar management and personality")
    print("  • DataAggregator: Multimodal data collection")
    print("  • ModelTrainer: Model fine-tuning")
    print("  • TextConversation: Text-based interaction")
    print("  • VoiceConversation: Voice-based interaction")
    print("  • VideoManager: Video sharing")
    print("  • BlogManager: Blog post management")
    print("  • ProactiveEngagement: Proactive expression\n")
    
    input("Press Enter to continue...")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nExiting Soma. Goodbye!")
        sys.exit(0)
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        print(f"\nAn unexpected error occurred: {e}")
        sys.exit(1)
