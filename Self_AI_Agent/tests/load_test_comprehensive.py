"""
Comprehensive Load Testing with Locust - Phase 7C.1

测试目标:
- 1000并发用户支持
- p95响应时间 < 200ms
- 错误率 < 0.1%

测试场景:
1. Emotion Analysis (情感分析)
2. Reasoning Extraction (推理提取)
3. Full Profile Generation (完整画像生成)

使用方法:
```bash
# 安装依赖
pip install locust

# 运行负载测试
locust -f tests/load_test_comprehensive.py --host=http://localhost:8000

# 或使用命令行模式
locust -f tests/load_test_comprehensive.py \
    --host=http://localhost:8000 \
    --users 1000 \
    --spawn-rate 50 \
    --run-time 5m \
    --headless \
    --html=load_test_report.html
```

性能目标:
- 1000并发用户
- p95 < 200ms
- p99 < 500ms
- 错误率 < 0.1%
- 吞吐量 > 500 req/s
"""

from locust import HttpUser, task, between, events
import random
import json
import time
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)


# ==================== 测试数据生成器 ====================

class TestDataGenerator:
    """生成测试数据"""
    
    # 情感分析测试文本
    EMOTION_TEXTS = [
        "I'm so happy today! Everything is going great!",
        "This is absolutely terrible and frustrating.",
        "I feel anxious about the upcoming presentation.",
        "That movie was incredible, I loved every minute!",
        "I'm disappointed with the results, but I'll try again.",
        "Feeling grateful for all the support from friends.",
        "This situation makes me really angry and upset.",
        "I'm excited about the new opportunities ahead!",
        "Feeling lonely and isolated lately.",
        "The sunset was so beautiful, it brought me peace.",
        "I can't believe this happened, I'm shocked!",
        "Feeling proud of what I've accomplished today.",
        "This is boring and uninteresting.",
        "I'm scared about what might happen next.",
        "Feeling confused about the situation.",
        "This is hilarious, I can't stop laughing!",
        "I trust you completely with this.",
        "Feeling nostalgic about the good old days.",
        "This is so annoying and irritating.",
        "I'm optimistic about the future."
    ]
    
    # 推理提取测试文本
    REASONING_TEXTS = [
        "Because it was raining, I decided to stay home and read a book.",
        "Since the traffic was heavy, I took the subway instead of driving.",
        "The project failed because we didn't have enough resources.",
        "She studied hard, so she passed the exam with flying colors.",
        "If we invest in renewable energy, we can reduce carbon emissions.",
        "The company grew rapidly due to innovative marketing strategies.",
        "He missed the meeting because his flight was delayed.",
        "The restaurant was crowded, therefore we had to wait 30 minutes.",
        "Since prices increased, customers started looking for alternatives.",
        "The team won because they worked well together.",
        "If temperatures rise, ice caps will melt faster.",
        "She became a doctor because she wanted to help people.",
        "The economy improved as a result of new policies.",
        "Since he was tired, he went to bed early.",
        "The product succeeded because it solved a real problem.",
        "If we don't act now, the situation will worsen.",
        "The experiment failed due to contamination.",
        "She was promoted because of her excellent performance.",
        "The event was canceled since not enough people registered.",
        "If you practice daily, you'll improve quickly."
    ]
    
    # 用户ID池
    USER_IDS = [f"user_{i:04d}" for i in range(1, 101)]
    
    @classmethod
    def get_emotion_request(cls) -> Dict[str, Any]:
        """生成情感分析请求"""
        return {
            "user_id": random.choice(cls.USER_IDS),
            "text": random.choice(cls.EMOTION_TEXTS),
            "context": random.choice(["message", "post", "comment", "review"])
        }
    
    @classmethod
    def get_reasoning_request(cls) -> Dict[str, Any]:
        """生成推理提取请求"""
        return {
            "user_id": random.choice(cls.USER_IDS),
            "text": random.choice(cls.REASONING_TEXTS),
            "extract_causal": True,
            "extract_counterfactual": random.choice([True, False])
        }
    
    @classmethod
    def get_profile_request(cls) -> Dict[str, Any]:
        """生成完整画像请求"""
        return {
            "user_id": random.choice(cls.USER_IDS),
            "include_emotions": True,
            "include_reasoning": True,
            "include_knowledge_graph": random.choice([True, False]),
            "time_window_days": random.choice([7, 14, 30])
        }


# ==================== 负载测试用户 ====================

class EmotionAnalysisUser(HttpUser):
    """
    情感分析负载测试
    
    模拟用户对情感分析API的访问
    """
    wait_time = between(1, 3)  # 用户请求间隔1-3秒
    weight = 3  # 权重3 (30%的用户执行此任务)
    
    @task(5)
    def analyze_emotion(self):
        """情感分析 (权重5)"""
        payload = TestDataGenerator.get_emotion_request()
        
        with self.client.post(
            "/api/emotions/analyze",
            json=payload,
            catch_response=True,
            name="Emotion Analysis"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if "emotions" in data and len(data["emotions"]) > 0:
                        response.success()
                    else:
                        response.failure("No emotions returned")
                except Exception as e:
                    response.failure(f"Invalid response: {e}")
            elif response.status_code == 429:
                response.failure("Rate limited")
            else:
                response.failure(f"Status {response.status_code}")
    
    @task(2)
    def batch_analyze(self):
        """批量情感分析 (权重2)"""
        texts = [random.choice(TestDataGenerator.EMOTION_TEXTS) for _ in range(5)]
        payload = {
            "user_id": random.choice(TestDataGenerator.USER_IDS),
            "texts": texts
        }
        
        with self.client.post(
            "/api/emotions/batch",
            json=payload,
            catch_response=True,
            name="Batch Emotion Analysis"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}")
    
    @task(1)
    def get_emotion_history(self):
        """获取情感历史 (权重1)"""
        user_id = random.choice(TestDataGenerator.USER_IDS)
        
        with self.client.get(
            f"/api/emotions/history/{user_id}",
            catch_response=True,
            name="Emotion History"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}")


class ReasoningExtractionUser(HttpUser):
    """
    推理提取负载测试
    
    模拟用户对推理提取API的访问
    """
    wait_time = between(1, 4)
    weight = 2  # 权重2 (20%的用户)
    
    @task(4)
    def extract_reasoning(self):
        """推理提取 (权重4)"""
        payload = TestDataGenerator.get_reasoning_request()
        
        with self.client.post(
            "/api/reasoning/extract",
            json=payload,
            catch_response=True,
            name="Reasoning Extraction"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if "causal_chains" in data or "reasoning_graph" in data:
                        response.success()
                    else:
                        response.failure("No reasoning extracted")
                except Exception as e:
                    response.failure(f"Invalid response: {e}")
            else:
                response.failure(f"Status {response.status_code}")
    
    @task(1)
    def get_reasoning_graph(self):
        """获取推理图谱 (权重1)"""
        user_id = random.choice(TestDataGenerator.USER_IDS)
        
        with self.client.get(
            f"/api/reasoning/graph/{user_id}",
            catch_response=True,
            name="Reasoning Graph"
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status {response.status_code}")


class FullProfileUser(HttpUser):
    """
    完整画像生成负载测试
    
    模拟用户对完整画像API的访问 (最重的操作)
    """
    wait_time = between(2, 5)
    weight = 1  # 权重1 (10%的用户)
    
    @task(3)
    def generate_profile(self):
        """生成完整画像 (权重3)"""
        payload = TestDataGenerator.get_profile_request()
        
        with self.client.post(
            "/api/profile/generate",
            json=payload,
            catch_response=True,
            name="Full Profile Generation"
        ) as response:
            if response.status_code == 200:
                try:
                    data = response.json()
                    if "user_id" in data and "profile" in data:
                        response.success()
                    else:
                        response.failure("Incomplete profile")
                except Exception as e:
                    response.failure(f"Invalid response: {e}")
            else:
                response.failure(f"Status {response.status_code}")
    
    @task(1)
    def get_profile(self):
        """获取现有画像 (权重1)"""
        user_id = random.choice(TestDataGenerator.USER_IDS)
        
        with self.client.get(
            f"/api/profile/{user_id}",
            catch_response=True,
            name="Get Profile"
        ) as response:
            if response.status_code == 200:
                response.success()
            elif response.status_code == 404:
                response.success()  # 404也算正常
            else:
                response.failure(f"Status {response.status_code}")


class MixedWorkloadUser(HttpUser):
    """
    混合负载测试
    
    模拟真实用户的混合操作模式
    """
    wait_time = between(1, 3)
    weight = 4  # 权重4 (40%的用户)
    
    @task(5)
    def emotion_analysis(self):
        """情感分析"""
        payload = TestDataGenerator.get_emotion_request()
        self.client.post("/api/emotions/analyze", json=payload, name="Mixed: Emotion")
    
    @task(3)
    def reasoning_extraction(self):
        """推理提取"""
        payload = TestDataGenerator.get_reasoning_request()
        self.client.post("/api/reasoning/extract", json=payload, name="Mixed: Reasoning")
    
    @task(1)
    def profile_generation(self):
        """画像生成"""
        payload = TestDataGenerator.get_profile_request()
        self.client.post("/api/profile/generate", json=payload, name="Mixed: Profile")
    
    @task(2)
    def health_check(self):
        """健康检查"""
        self.client.get("/health", name="Mixed: Health")


# ==================== 压力测试用户 (峰值场景) ====================

class PeakLoadUser(HttpUser):
    """
    峰值负载测试
    
    模拟系统峰值时的极限压力
    """
    wait_time = between(0.1, 0.5)  # 极短间隔
    weight = 0  # 默认不启用,需要手动指定
    
    @task
    def rapid_fire(self):
        """快速连续请求"""
        payload = TestDataGenerator.get_emotion_request()
        self.client.post("/api/emotions/analyze", json=payload, name="Peak: Rapid")


# ==================== 事件监听器 (性能指标收集) ====================

class PerformanceMetrics:
    """性能指标收集器"""
    
    def __init__(self):
        self.response_times = []
        self.errors = []
        self.success_count = 0
        self.failure_count = 0
    
    def record_success(self, response_time: float):
        """记录成功请求"""
        self.response_times.append(response_time)
        self.success_count += 1
    
    def record_failure(self, error: str):
        """记录失败请求"""
        self.errors.append(error)
        self.failure_count += 1
    
    def get_percentile(self, percentile: float) -> float:
        """计算百分位响应时间"""
        if not self.response_times:
            return 0.0
        sorted_times = sorted(self.response_times)
        index = int(len(sorted_times) * percentile / 100)
        return sorted_times[min(index, len(sorted_times) - 1)]
    
    def get_error_rate(self) -> float:
        """计算错误率"""
        total = self.success_count + self.failure_count
        return self.failure_count / total if total > 0 else 0.0
    
    def get_summary(self) -> Dict[str, Any]:
        """获取性能摘要"""
        return {
            "total_requests": self.success_count + self.failure_count,
            "success_count": self.success_count,
            "failure_count": self.failure_count,
            "error_rate": self.get_error_rate(),
            "p50": self.get_percentile(50),
            "p95": self.get_percentile(95),
            "p99": self.get_percentile(99),
            "avg": sum(self.response_times) / len(self.response_times) if self.response_times else 0
        }


# 全局性能指标
performance_metrics = PerformanceMetrics()


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, exception, **kwargs):
    """请求完成事件监听"""
    if exception:
        performance_metrics.record_failure(str(exception))
    else:
        performance_metrics.record_success(response_time)


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """测试结束事件监听"""
    summary = performance_metrics.get_summary()
    
    print("\n" + "="*80)
    print("📊 LOAD TEST PERFORMANCE SUMMARY".center(80))
    print("="*80)
    print(f"\n📈 Request Statistics:")
    print(f"   Total Requests:    {summary['total_requests']:,}")
    print(f"   Success:           {summary['success_count']:,}")
    print(f"   Failures:          {summary['failure_count']:,}")
    print(f"   Error Rate:        {summary['error_rate']:.2%}")
    
    print(f"\n⏱️  Response Times:")
    print(f"   Average (p50):     {summary['p50']:.1f} ms")
    print(f"   p95:               {summary['p95']:.1f} ms")
    print(f"   p99:               {summary['p99']:.1f} ms")
    
    print(f"\n🎯 Performance Goals:")
    p95_pass = "✅ PASS" if summary['p95'] < 200 else "❌ FAIL"
    error_pass = "✅ PASS" if summary['error_rate'] < 0.001 else "❌ FAIL"
    
    print(f"   p95 < 200ms:       {p95_pass} ({summary['p95']:.1f} ms)")
    print(f"   Error < 0.1%:      {error_pass} ({summary['error_rate']:.2%})")
    
    print("\n" + "="*80 + "\n")
    
    # 判断测试是否通过
    if summary['p95'] < 200 and summary['error_rate'] < 0.001:
        print("🎉 LOAD TEST PASSED! All performance goals met.")
    else:
        print("⚠️  LOAD TEST FAILED! Some goals not met.")
    
    print("="*80 + "\n")


# ==================== 自定义形状 (负载曲线) ====================

from locust import LoadTestShape

class StepLoadShape(LoadTestShape):
    """
    阶梯式负载
    
    逐步增加并发用户,测试系统在不同负载下的表现
    """
    
    step_time = 60  # 每阶段60秒
    step_load = 100  # 每阶段增加100用户
    spawn_rate = 10
    time_limit = 600  # 总时长10分钟
    
    def tick(self):
        run_time = self.get_run_time()
        
        if run_time > self.time_limit:
            return None
        
        current_step = int(run_time // self.step_time)
        return (current_step + 1) * self.step_load, self.spawn_rate


class SpikeLoadShape(LoadTestShape):
    """
    峰值负载
    
    模拟流量突增场景
    """
    
    def tick(self):
        run_time = self.get_run_time()
        
        if run_time < 60:
            return 100, 10  # 预热
        elif run_time < 120:
            return 1000, 50  # 突增
        elif run_time < 180:
            return 100, 10  # 恢复
        elif run_time < 240:
            return 1000, 50  # 再次突增
        else:
            return None


# ==================== 使用说明 ====================

"""
运行方式:

1. 基础测试 (默认场景):
   locust -f load_test_comprehensive.py --host=http://localhost:8000

2. 命令行模式 (1000用户):
   locust -f load_test_comprehensive.py \
       --host=http://localhost:8000 \
       --users 1000 \
       --spawn-rate 50 \
       --run-time 5m \
       --headless

3. 生成HTML报告:
   locust -f load_test_comprehensive.py \
       --host=http://localhost:8000 \
       --users 1000 \
       --spawn-rate 50 \
       --run-time 5m \
       --headless \
       --html=reports/load_test_report.html

4. 阶梯式负载:
   locust -f load_test_comprehensive.py \
       --host=http://localhost:8000 \
       --headless \
       --shape=StepLoadShape

5. 峰值负载测试:
   locust -f load_test_comprehensive.py \
       --host=http://localhost:8000 \
       --headless \
       --shape=SpikeLoadShape

性能目标:
- 1000并发用户
- p95响应时间 < 200ms
- p99响应时间 < 500ms
- 错误率 < 0.1%
- 吞吐量 > 500 req/s
"""
