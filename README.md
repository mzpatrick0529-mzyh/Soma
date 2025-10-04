# Soma

Soma is an emotionally interactive digital memory platform that creates personalized AI avatars through multimodal data aggregation and fine-tuning.

## Overview

Soma aggregates users' multimodal digital footprints (chat histories, audio/video, social media) to fine-tune open-source models, creating AI avatars that authentically replicate behavioral styles and proactive expression. Users interact through text and voice conversations, video sharing, and blog posts—the avatar initiates greetings in familiar tones, shares "updates," and sustains emotional bonds.

## Features

### 🤖 AI Avatar Creation
- **Behavioral Replication**: Authentically replicates user communication styles and patterns
- **Personality Modeling**: Learns from chat histories, social media, and interactions
- **Emotional Bonding**: Tracks and maintains relationship strength over time

### 💬 Multimodal Interaction
- **Text Conversations**: Natural text-based chat with personalized responses
- **Voice Conversations**: Audio input processing with speech synthesis
- **Video Sharing**: Upload, share, and analyze video content
- **Blog System**: Create and share posts from both user and avatar perspectives

### 🎯 Proactive Expression
- **Automated Greetings**: Context-aware greetings at different times of day
- **Check-ins**: Regular engagement to maintain emotional bonds
- **Memory Sharing**: References past interactions to strengthen connections
- **Milestone Celebrations**: Recognizes and celebrates relationship milestones

### 📊 Data Aggregation
- **Chat Histories**: Import and analyze text conversations
- **Audio/Video Files**: Process multimodal content
- **Social Media**: Aggregate posts and interactions from various platforms

### 🧠 Model Fine-Tuning
- **Custom Training**: Fine-tune open-source models on user data
- **Behavioral Patterns**: Learn communication styles and preferences
- **Continuous Learning**: Adapt based on ongoing interactions

## Installation

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Setup

1. Clone the repository:
```bash
git clone https://github.com/mzpatrick0529-mzyh/Soma.git
cd Soma
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install the package:
```bash
pip install -e .
```

## Quick Start

```python
from soma import AvatarEngine, TextConversation, DataAggregator, ModelTrainer

# 1. Aggregate user data
aggregator = DataAggregator("user_001")
aggregator.add_chat_history([
    {"content": "Hey, how are you?", "timestamp": "2024-01-01T10:00:00"}
])

# 2. Train the avatar model
trainer = ModelTrainer("user_001")
trainer.prepare_training_data(aggregator.get_aggregated_data())
trainer.load_base_model()

# 3. Create the avatar
avatar = AvatarEngine("user_001", avatar_name="MyAvatar")
avatar.initialize_personality(aggregator.get_aggregated_data())

# 4. Start conversing
conversation = TextConversation(avatar, "user_001")
response = conversation.send_message("Hello!")
print(response)
```

## Usage Examples

### Data Aggregation

```python
from soma import DataAggregator

# Initialize aggregator
aggregator = DataAggregator("user_001")

# Add chat histories
aggregator.add_chat_history([
    {"content": "Hello!", "timestamp": "2024-01-01T10:00:00"}
])

# Add social media data
aggregator.add_social_media_data("twitter", [
    {"text": "Great day today!", "timestamp": "2024-01-01"}
])

# Save aggregated data
aggregator.save_aggregated_data()
```

### Avatar Conversations

```python
from soma import AvatarEngine, TextConversation

# Create avatar
avatar = AvatarEngine("user_001", avatar_name="MyAvatar")

# Text conversation
text_chat = TextConversation(avatar, "user_001")
response = text_chat.send_message("How are you?")

# Voice conversation
from soma.conversation.voice_interface import VoiceConversation
voice_chat = VoiceConversation(avatar, "user_001")
result = voice_chat.process_audio_input("audio.wav")
```

### Proactive Engagement

```python
from soma.proactive_engagement.engagement_manager import ProactiveEngagement

engagement = ProactiveEngagement(avatar, "user_001")

# Schedule greetings
engagement.schedule_greeting("morning")

# Send updates
engagement.send_update("recent developments")

# Check in with user
engagement.check_in()
```

### Blog Management

```python
from soma.blog.blog_manager import BlogManager

blog = BlogManager("user_001", avatar)

# User creates a post
blog.create_post(
    title="My Journey",
    content="Today I started...",
    author="user"
)

# Avatar generates a post
blog.generate_avatar_post("friendship")
```

### Video Sharing

```python
from soma.media.video_manager import VideoManager

video_mgr = VideoManager("user_001")

# Upload video
video_info = video_mgr.upload_video("video.mp4")

# Share with others
video_mgr.share_video(video_info["video_id"], ["user_002", "user_003"])
```

## Project Structure

```
Soma/
├── src/soma/
│   ├── avatar/              # Avatar engine and personality management
│   ├── conversation/        # Text and voice conversation interfaces
│   ├── data_aggregation/    # Multimodal data collection
│   ├── model_training/      # Model fine-tuning system
│   ├── media/               # Video and audio management
│   ├── blog/                # Blog post system
│   ├── proactive_engagement/ # Proactive expression features
│   └── database/            # Database management
├── examples/                # Example usage scripts
├── config.py               # Configuration settings
├── requirements.txt        # Python dependencies
└── setup.py               # Package setup file
```

## Core Modules

### AvatarEngine
Manages the AI avatar, including personality traits, behavioral patterns, and emotional bonding.

### DataAggregator
Collects and organizes multimodal digital footprints from various sources.

### ModelTrainer
Handles fine-tuning of open-source models based on user data.

### TextConversation & VoiceConversation
Provides interfaces for text and voice-based interactions with the avatar.

### ProactiveEngagement
Manages proactive expression features like greetings, check-ins, and updates.

### BlogManager
Handles blog post creation from both user and avatar perspectives.

### VideoManager
Manages video uploads, sharing, and content analysis.

## Configuration

Configure Soma by modifying `config.py` or setting environment variables:

```python
# Environment variables
SOMA_API_HOST=0.0.0.0
SOMA_API_PORT=8000
SOMA_LOG_LEVEL=INFO
```

## Development

### Running Examples

```bash
cd examples
python basic_usage.py
```

### Running Tests

```bash
python -m pytest tests/
```

## Architecture

Soma uses a modular architecture with the following components:

1. **Data Layer**: Aggregates multimodal data from various sources
2. **Training Layer**: Fine-tunes models on user-specific data
3. **Avatar Layer**: Manages personality, memory, and emotional state
4. **Interaction Layer**: Handles conversations, media sharing, and blogs
5. **Engagement Layer**: Proactive expression and relationship maintenance

## Contributing

We welcome contributions! Please feel free to submit pull requests or open issues.

## License

See LICENSE file for details.

## Support

For questions and support, please open an issue on GitHub.

## Acknowledgments

Built with love for creating meaningful digital connections and preserving memories through AI.
