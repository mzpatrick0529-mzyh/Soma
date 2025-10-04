# Getting Started with Soma

This guide will help you get up and running with the Soma AI Avatar platform.

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Basic understanding of Python programming
- (Optional) Virtual environment tool (venv, conda, etc.)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/mzpatrick0529-mzyh/Soma.git
cd Soma
```

### Step 2: Create a Virtual Environment (Recommended)

```bash
# Using venv
python -m venv venv

# Activate on Linux/Mac
source venv/bin/activate

# Activate on Windows
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Install Soma Package

```bash
pip install -e .
```

## Quick Start

### Running the Main Interface

```bash
python main.py
```

This will launch the interactive command-line interface where you can:
1. Run example demonstrations
2. Create new avatars
3. View API documentation
4. Explore features

### Running the Example

```bash
cd examples
PYTHONPATH=../src python basic_usage.py
```

This demonstrates all major features of the platform.

### Running Tests

```bash
PYTHONPATH=src python tests/test_basic.py
```

## Your First Avatar

### Step 1: Create a Data Aggregator

```python
from soma import DataAggregator

# Initialize for your user
aggregator = DataAggregator("my_user_id")

# Add some chat history
chat_data = [
    {"content": "I love hiking in the mountains", "timestamp": "2024-01-01T10:00:00"},
    {"content": "Pizza is my favorite food", "timestamp": "2024-01-01T10:30:00"},
    {"content": "I enjoy reading science fiction", "timestamp": "2024-01-01T11:00:00"}
]
aggregator.add_chat_history(chat_data)

# Add social media posts
social_posts = [
    {"text": "Beautiful sunset today!", "timestamp": "2024-01-02"},
    {"text": "Just finished a great book", "timestamp": "2024-01-03"}
]
aggregator.add_social_media_data("twitter", social_posts)

# Save the aggregated data
aggregator.save_aggregated_data()
```

### Step 2: Train the Model

```python
from soma import ModelTrainer

# Initialize trainer
trainer = ModelTrainer("my_user_id")

# Prepare training data from aggregated footprints
trainer.prepare_training_data(aggregator.get_aggregated_data())

# Load base model
trainer.load_base_model()

# Fine-tune (in production, this would use actual model training)
trainer.fine_tune(epochs=3)

# Save the trained model
trainer.save_model()
```

### Step 3: Create Your Avatar

```python
from soma import AvatarEngine

# Create the avatar
avatar = AvatarEngine("my_user_id", avatar_name="MyPersonalAvatar")

# Initialize personality from training data
avatar.initialize_personality(aggregator.get_aggregated_data())

# Save avatar state
avatar.save_avatar_state()
```

### Step 4: Start Conversing

```python
from soma import TextConversation

# Create conversation interface
conversation = TextConversation(avatar, "my_user_id")

# Send a message
response = conversation.send_message("Hi! How are you?")
print(f"Avatar: {response}")

# Continue the conversation
response = conversation.send_message("Tell me about yourself")
print(f"Avatar: {response}")

# Export conversation history
conversation.export_conversation("my_conversation.json")
```

### Step 5: Enable Proactive Engagement

```python
from soma.proactive_engagement.engagement_manager import ProactiveEngagement

# Initialize engagement system
engagement = ProactiveEngagement(avatar, "my_user_id")

# Schedule a morning greeting
greeting = engagement.schedule_greeting("morning")
print(f"Scheduled: {greeting['message']}")

# Send a proactive update
update = engagement.send_update("recent conversations")
print(f"Update: {update['message']}")

# Regular check-in
check_in = engagement.check_in()
print(f"Check-in: {check_in['message']}")
```

## Common Use Cases

### Use Case 1: Digital Memory Preservation

Preserve memories and conversations with loved ones by creating avatars that can continue interactions based on their communication style.

```python
# Aggregate all chat histories with a person
aggregator = DataAggregator("loved_one_id")
aggregator.add_chat_history(all_chat_messages)

# Create avatar that replicates their style
avatar = AvatarEngine("loved_one_id", avatar_name="TheirName")
avatar.initialize_personality(aggregator.get_aggregated_data())

# Interact as if they're still present
conversation = TextConversation(avatar, "my_id")
response = conversation.send_message("I miss you")
```

### Use Case 2: Personal AI Assistant

Create an AI assistant that learns your communication style and preferences.

```python
# Aggregate your own data
aggregator = DataAggregator("my_id")
aggregator.add_chat_history(my_messages)
aggregator.add_social_media_data("twitter", my_tweets)

# Create self-avatar
avatar = AvatarEngine("my_id", avatar_name="MySelfAvatar")
avatar.initialize_personality(aggregator.get_aggregated_data())

# It can now communicate in your style
blog = BlogManager("my_id", avatar)
post = blog.generate_avatar_post("productivity")
```

### Use Case 3: Content Creation

Use the avatar to generate content in your style for social media or blogs.

```python
from soma.blog.blog_manager import BlogManager

blog = BlogManager("my_id", avatar)

# Generate blog posts
post = blog.generate_avatar_post("artificial intelligence")
print(f"Title: {post['title']}")
print(f"Content: {post['content']}")

# List all posts
all_posts = blog.list_posts(author="avatar")
```

### Use Case 4: Video and Media Sharing

Share and analyze video content with your avatar.

```python
from soma.media.video_manager import VideoManager

video_mgr = VideoManager("my_id")

# Upload a video
video_info = video_mgr.upload_video("family_vacation.mp4", 
                                    metadata={"event": "vacation", "year": 2024})

# Share with family members
video_mgr.share_video(video_info["video_id"], 
                     ["family_member_1", "family_member_2"])

# Analyze video content
analysis = video_mgr.analyze_video_content(video_info["video_id"])
```

## Configuration

### Basic Configuration

Edit `config.py` to customize settings:

```python
from config import Config

# Modify default settings
Config.DEFAULT_MODEL = "gpt2"
Config.TRAINING_EPOCHS = 5
Config.MAX_MEMORY_CONTEXT = 200

# Create necessary directories
Config.create_directories()
```

### Environment Variables

Set environment variables for runtime configuration:

```bash
export SOMA_API_HOST=0.0.0.0
export SOMA_API_PORT=8000
export SOMA_LOG_LEVEL=DEBUG
```

## Troubleshooting

### Issue: Import errors

**Solution**: Make sure you've installed the package and dependencies:
```bash
pip install -e .
pip install -r requirements.txt
```

### Issue: Permission denied when saving files

**Solution**: Check directory permissions or configure a different storage path:
```python
aggregator = DataAggregator("user_id", storage_path=Path("/your/writable/path"))
```

### Issue: Module not found

**Solution**: Set PYTHONPATH:
```bash
export PYTHONPATH=/path/to/Soma/src:$PYTHONPATH
```

## Next Steps

1. **Explore the API**: Check `API.md` for detailed API documentation
2. **Read Architecture**: See `ARCHITECTURE.md` to understand the system design
3. **Review Examples**: Look at `examples/basic_usage.py` for more examples
4. **Run Tests**: Execute tests to ensure everything works: `python tests/test_basic.py`
5. **Contribute**: See `CONTRIBUTING.md` for contribution guidelines

## Getting Help

- **Documentation**: Check API.md and ARCHITECTURE.md
- **Issues**: Report bugs or request features on GitHub
- **Examples**: See examples/ directory for working code

## Resources

- [GitHub Repository](https://github.com/mzpatrick0529-mzyh/Soma)
- [API Documentation](API.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Contributing Guide](CONTRIBUTING.md)

Happy avatar building! 🤖
