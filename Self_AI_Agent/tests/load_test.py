"""
Phase 6: Load Testing with Locust

Simulates 100+ concurrent users to validate production performance.

Run:
    locust -f load_test.py --host=http://localhost:8787

Open browser:
    http://localhost:8089
"""

from locust import HttpUser, task, between
import random
import json

class SomaMLUser(HttpUser):
    """
    Simulates a user interacting with Soma ML API.
    
    User behavior:
    - Extract reasoning (weight: 3)
    - Build value hierarchy (weight: 2)
    - Analyze emotion (weight: 4)
    - Build mental model (weight: 2)
    - Extract narrative (weight: 1)
    """
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between requests
    
    def on_start(self):
        """Initialize user session."""
        self.user_id = f"test_user_{random.randint(1000, 9999)}"
        self.conversations = self._generate_conversations()
    
    def _generate_conversations(self):
        """Generate sample conversation data."""
        return [
            {
                "id": f"conv_{i}",
                "message": f"Test message {i} about {random.choice(['work', 'family', 'health', 'relationships'])}",
                "timestamp": "2025-10-24T12:00:00Z"
            }
            for i in range(10)
        ]
    
    @task(3)
    def extract_reasoning(self):
        """Test reasoning chain extraction."""
        with self.client.post(
            "/api/self-agent/cognitive/reasoning/extract",
            json={"userId": self.user_id},
            catch_response=True,
            name="Reasoning: Extract"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "chains" in data:
                    response.success()
                else:
                    response.failure("Missing chains in response")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def build_value_hierarchy(self):
        """Test value hierarchy building."""
        with self.client.post(
            "/api/self-agent/cognitive/values/build",
            json={"userId": self.user_id},
            catch_response=True,
            name="Values: Build"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "hierarchy" in data:
                    response.success()
                else:
                    response.failure("Missing hierarchy in response")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(4)
    def analyze_emotion(self):
        """Test emotion analysis."""
        message = random.choice(self.conversations)["message"]
        
        with self.client.post(
            "/api/self-agent/cognitive/emotions/analyze",
            json={
                "userId": self.user_id,
                "message": message,
                "context": "test"
            },
            catch_response=True,
            name="Emotions: Analyze"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "emotion_type" in data:
                    response.success()
                else:
                    response.failure("Missing emotion_type in response")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def build_mental_model(self):
        """Test theory of mind."""
        target_person = random.choice(["friend", "colleague", "family_member"])
        
        with self.client.post(
            "/api/self-agent/cognitive/tom/build",
            json={
                "userId": self.user_id,
                "targetPerson": target_person
            },
            catch_response=True,
            name="ToM: Build"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "mental_model" in data:
                    response.success()
                else:
                    response.failure("Missing mental_model in response")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(1)
    def extract_narrative(self):
        """Test narrative extraction."""
        with self.client.post(
            "/api/self-agent/cognitive/narrative/extract",
            json={"userId": self.user_id},
            catch_response=True,
            name="Narrative: Extract"
        ) as response:
            if response.status_code == 200:
                data = response.json()
                if "events" in data:
                    response.success()
                else:
                    response.failure("Missing events in response")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(1)
    def health_check(self):
        """Test health endpoint."""
        with self.client.get(
            "/api/self-agent/cognitive/health",
            catch_response=True,
            name="Health Check"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")


# Performance thresholds
# - Latency p95: <200ms
# - Error rate: <1%
# - Throughput: >100 req/s (across all instances)
