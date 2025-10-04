# API Documentation

## Core Classes

### DataAggregator

**Purpose**: Aggregates users' multimodal digital footprints.

#### Constructor
```python
DataAggregator(user_id: str, storage_path: Optional[Path] = None)
```

#### Methods

##### add_chat_history
```python
add_chat_history(chat_data: Union[Dict, List[Dict]]) -> None
```
Add chat history data to the aggregator.

**Parameters**:
- `chat_data`: Dictionary or list of dictionaries containing chat messages

##### add_audio_file
```python
add_audio_file(audio_path: Union[str, Path]) -> None
```
Add audio file to the aggregator.

##### add_video_file
```python
add_video_file(video_path: Union[str, Path]) -> None
```
Add video file to the aggregator.

##### add_social_media_data
```python
add_social_media_data(platform: str, data: Union[Dict, List[Dict]]) -> None
```
Add social media data to the aggregator.

##### get_aggregated_data
```python
get_aggregated_data() -> Dict
```
Get all aggregated data for the user.

##### save_aggregated_data
```python
save_aggregated_data() -> Path
```
Save aggregated data to disk.

---

### ModelTrainer

**Purpose**: Fine-tunes open-source models based on user data.

#### Constructor
```python
ModelTrainer(user_id: str, model_name: str = "gpt2", output_path: Optional[Path] = None)
```

#### Methods

##### prepare_training_data
```python
prepare_training_data(aggregated_data: Dict) -> None
```
Prepare training data from aggregated user footprints.

##### load_base_model
```python
load_base_model() -> None
```
Load the base model for fine-tuning.

##### fine_tune
```python
fine_tune(epochs: int = 3, batch_size: int = 8, learning_rate: float = 5e-5) -> None
```
Fine-tune the model on user data.

##### save_model
```python
save_model() -> Path
```
Save the fine-tuned model to disk.

---

### AvatarEngine

**Purpose**: Manages the AI avatar with behavioral replication and emotional bonding.

#### Constructor
```python
AvatarEngine(user_id: str, avatar_name: Optional[str] = None)
```

#### Methods

##### initialize_personality
```python
initialize_personality(training_data: Dict) -> None
```
Initialize the avatar's personality based on training data.

##### generate_greeting
```python
generate_greeting() -> str
```
Generate a personalized greeting based on the avatar's personality.

##### generate_proactive_message
```python
generate_proactive_message(context: Optional[str] = None) -> str
```
Generate a proactive message or update.

##### update_emotional_bond
```python
update_emotional_bond(interaction_quality: float) -> None
```
Update the emotional bond strength based on interaction quality.

##### get_emotional_state
```python
get_emotional_state() -> Dict
```
Get the current emotional state and bond strength.

##### add_to_memory
```python
add_to_memory(interaction: Dict) -> None
```
Add an interaction to the avatar's memory context.

##### save_avatar_state
```python
save_avatar_state(output_path: Optional[Path] = None) -> Path
```
Save the avatar's current state to disk.

---

### TextConversation

**Purpose**: Handles text-based conversations with the AI avatar.

#### Constructor
```python
TextConversation(avatar_engine, user_id: str)
```

#### Methods

##### send_message
```python
send_message(message: str) -> str
```
Send a text message to the avatar and get a response.

##### get_conversation_history
```python
get_conversation_history(limit: Optional[int] = None) -> List[Dict]
```
Get the conversation history.

##### export_conversation
```python
export_conversation(output_path: str) -> None
```
Export conversation history to a file.

---

### VoiceConversation

**Purpose**: Handles voice-based conversations with the AI avatar.

#### Constructor
```python
VoiceConversation(avatar_engine, user_id: str)
```

#### Methods

##### process_audio_input
```python
process_audio_input(audio_path: str) -> Dict
```
Process audio input from the user.

**Returns**: Dictionary containing:
- `transcription`: Transcribed text
- `text_response`: Avatar's text response
- `audio_response_path`: Path to synthesized audio response

---

### VideoManager

**Purpose**: Manages video sharing and processing.

#### Constructor
```python
VideoManager(user_id: str, storage_path: Optional[Path] = None)
```

#### Methods

##### upload_video
```python
upload_video(video_path: str, metadata: Optional[Dict] = None) -> Dict
```
Upload and process a video file.

##### share_video
```python
share_video(video_id: str, recipients: List[str]) -> Dict
```
Share a video with specified recipients.

##### list_videos
```python
list_videos(limit: Optional[int] = None) -> List[Dict]
```
List all videos for the user.

##### analyze_video_content
```python
analyze_video_content(video_id: str) -> Dict
```
Analyze video content to extract behavioral patterns.

---

### BlogManager

**Purpose**: Manages blog posts for user and avatar-generated content.

#### Constructor
```python
BlogManager(user_id: str, avatar_engine=None)
```

#### Methods

##### create_post
```python
create_post(title: str, content: str, author: str = "user", tags: Optional[List[str]] = None) -> Dict
```
Create a new blog post.

##### generate_avatar_post
```python
generate_avatar_post(topic: Optional[str] = None) -> Dict
```
Generate a blog post from the avatar's perspective.

##### list_posts
```python
list_posts(author: Optional[str] = None, limit: Optional[int] = None) -> List[Dict]
```
List blog posts.

##### search_posts
```python
search_posts(query: str) -> List[Dict]
```
Search blog posts by title or content.

---

### ProactiveEngagement

**Purpose**: Manages proactive engagement strategies for the avatar.

#### Constructor
```python
ProactiveEngagement(avatar_engine, user_id: str)
```

#### Methods

##### schedule_greeting
```python
schedule_greeting(time_of_day: str = "morning") -> Dict
```
Schedule a proactive greeting.

##### send_update
```python
send_update(context: Optional[str] = None) -> Dict
```
Send a proactive update from the avatar.

##### check_in
```python
check_in() -> Dict
```
Send a check-in message to maintain emotional bond.

##### share_memory
```python
share_memory(memory_topic: Optional[str] = None) -> Dict
```
Share a memory or past interaction.

##### celebrate_milestone
```python
celebrate_milestone(milestone_type: str, details: Optional[Dict] = None) -> Dict
```
Celebrate a milestone in the relationship.

---

## Configuration

### Config Class

Located in `config.py`, provides configuration settings.

#### Attributes

- `BASE_DIR`: Base directory path
- `DATA_DIR`: Data storage directory
- `MODELS_DIR`: Model storage directory
- `AVATARS_DIR`: Avatar state storage directory
- `DATABASE_PATH`: Database file path
- `DEFAULT_MODEL`: Default model name (default: "gpt2")
- `TRAINING_EPOCHS`: Training epochs (default: 3)
- `MAX_MEMORY_CONTEXT`: Maximum memory context (default: 100)
- `CHECK_IN_FREQUENCY_DAYS`: Check-in frequency (default: 3)

---

## Usage Patterns

### Complete Workflow

```python
from soma import AvatarEngine, TextConversation, DataAggregator, ModelTrainer
from soma.proactive_engagement.engagement_manager import ProactiveEngagement

# 1. Aggregate data
aggregator = DataAggregator("user_001")
aggregator.add_chat_history([{"content": "Hello"}])

# 2. Train model
trainer = ModelTrainer("user_001")
trainer.prepare_training_data(aggregator.get_aggregated_data())
trainer.load_base_model()

# 3. Create avatar
avatar = AvatarEngine("user_001")
avatar.initialize_personality(aggregator.get_aggregated_data())

# 4. Interact
conversation = TextConversation(avatar, "user_001")
response = conversation.send_message("Hi!")

# 5. Proactive engagement
engagement = ProactiveEngagement(avatar, "user_001")
engagement.check_in()
```
