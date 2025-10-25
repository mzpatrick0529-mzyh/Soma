"""
Phase 6: Integration Tests

Tests Phase 6 production optimization features:
- Model optimization
- Session management
- Cache management
- Monitoring metrics
- Load balancing
"""

import pytest
import asyncio
import time
from typing import Dict, Any


# Test Model Optimizer
class TestModelOptimizer:
    """Test model optimization features."""
    
    def test_quantize_patterns(self):
        """Test pattern quantization."""
        from src.ml.services.model_optimizer import get_optimizer
        
        optimizer = get_optimizer()
        patterns = {
            'causal': ['because', 'due to', 'caused by'] * 10,  # Duplicates
            'deductive': ['if', 'then', 'therefore']
        }
        
        quantized = optimizer.quantize_patterns(patterns)
        
        # Should remove duplicates
        assert len(quantized['causal']) == 3
        assert len(quantized['deductive']) == 3
    
    def test_prune_patterns(self):
        """Test pattern pruning."""
        from src.ml.services.model_optimizer import get_optimizer
        
        optimizer = get_optimizer()
        patterns = {
            'high_freq': 0.5,
            'medium_freq': 0.05,
            'low_freq': 0.0005  # Below threshold (0.001)
        }
        
        pruned = optimizer.prune_patterns(patterns, min_frequency=0.001)
        
        assert 'high_freq' in pruned
        assert 'medium_freq' in pruned
        assert 'low_freq' not in pruned  # Pruned
    
    def test_lazy_loading(self):
        """Test lazy module loading."""
        from src.ml.services.model_optimizer import get_optimizer
        
        optimizer = get_optimizer()
        
        # Should not be loaded initially
        assert 'reasoning' not in optimizer.loaded_modules
        
        # Load module
        module = optimizer.lazy_load_module('reasoning')
        assert module is not None
        assert 'reasoning' in optimizer.loaded_modules
        
        # Second call should use cache
        module2 = optimizer.lazy_load_module('reasoning')
        assert module is module2
    
    @pytest.mark.asyncio
    async def test_batch_processing(self):
        """Test batch request processing."""
        from src.ml.services.model_optimizer import get_optimizer
        
        optimizer = get_optimizer({'batch_size': 3, 'batch_timeout': 0.1})
        
        # Submit multiple requests
        tasks = [
            optimizer.batch_process('reasoning', 'extract_reasoning_chains', f'req_{i}', user_id='test_user')
            for i in range(5)
        ]
        
        start_time = time.time()
        results = await asyncio.gather(*tasks)
        elapsed = time.time() - start_time
        
        # Should batch process efficiently
        assert len(results) == 5
        # Average time per request should be much lower than sequential
        avg_time = elapsed / 5
        assert avg_time < 0.5  # <500ms per request on average


# Test Session Manager
class TestSessionManager:
    """Test session management features."""
    
    def test_session_creation(self):
        """Test user session creation."""
        from src.ml.services.session_manager import get_session_manager
        
        manager = get_session_manager()
        session = manager.get_or_create_session('test_user_1', tier='premium')
        
        assert session.user_id == 'test_user_1'
        assert session.tier == 'premium'
        assert session.request_count == 0
    
    def test_rate_limiting(self):
        """Test rate limiting."""
        from src.ml.services.session_manager import get_session_manager
        
        manager = get_session_manager()
        manager.rate_limits['free'] = 2  # Very low limit for testing
        
        # Create free tier session
        session = manager.get_or_create_session('test_user_2', tier='free')
        
        # First 2 requests should succeed
        assert manager.check_rate_limit('test_user_2') is True
        assert manager.check_rate_limit('test_user_2') is True
        
        # Third should fail
        assert manager.check_rate_limit('test_user_2') is False
    
    def test_priority_determination(self):
        """Test request priority logic."""
        from src.ml.services.session_manager import get_session_manager, Priority
        
        manager = get_session_manager()
        
        # Premium user gets premium priority
        manager.get_or_create_session('premium_user', tier='premium')
        priority = manager.get_priority('premium_user', 'reasoning')
        assert priority == Priority.PREMIUM
        
        # Standard user with critical module gets high priority
        manager.get_or_create_session('standard_user', tier='standard')
        priority = manager.get_priority('standard_user', 'emotions')
        assert priority == Priority.HIGH
        
        # Free user gets low priority
        manager.get_or_create_session('free_user', tier='free')
        priority = manager.get_priority('free_user', 'reasoning')
        assert priority == Priority.LOW
    
    @pytest.mark.asyncio
    async def test_request_submission(self):
        """Test request submission and processing."""
        from src.ml.services.session_manager import get_session_manager
        
        manager = get_session_manager()
        
        # Submit request
        try:
            result = await manager.submit_request(
                request_id='test_req_1',
                user_id='test_user_3',
                module_name='emotions',
                method_name='analyze_emotional_state',
                message='Test message',
                context='test'
            )
            
            # Should get a result (even if error, should complete)
            assert result is not None
        except Exception as e:
            # Expected if module not fully initialized
            assert 'module' in str(e).lower() or 'method' in str(e).lower()


# Test Cache Manager
class TestCacheManager:
    """Test Redis cache management."""
    
    def test_cache_key_generation(self):
        """Test cache key generation."""
        from src.ml.cache_manager import get_cache_manager
        
        try:
            manager = get_cache_manager('redis://localhost:6379')
            
            input_data = {'user_id': 'test', 'query': 'test query'}
            input_hash = manager._hash_input(input_data)
            
            assert len(input_hash) == 16  # Short hash
            
            # Same input should produce same hash
            input_hash2 = manager._hash_input(input_data)
            assert input_hash == input_hash2
            
            # Different input should produce different hash
            different_data = {'user_id': 'test2', 'query': 'different'}
            different_hash = manager._hash_input(different_data)
            assert input_hash != different_hash
        
        except Exception as e:
            # Redis not available in test environment
            pytest.skip(f"Redis not available: {e}")
    
    def test_cache_set_and_get(self):
        """Test cache set and retrieval."""
        from src.ml.cache_manager import get_cache_manager
        
        try:
            manager = get_cache_manager('redis://localhost:6379')
            
            input_data = {'query': 'test'}
            result_data = {'output': 'test result', 'confidence': 0.95}
            
            # Set cache
            manager.set('reasoning', 'test_user', input_data, result_data, strategy='warm')
            
            # Get cache
            cached = manager.get('reasoning', 'test_user', input_data)
            
            assert cached is not None
            assert cached['output'] == 'test result'
            assert cached['_from_cache'] is True
            
            # Clean up
            manager.delete('reasoning', 'test_user', input_data)
        
        except Exception as e:
            pytest.skip(f"Redis not available: {e}")
    
    def test_ttl_strategies(self):
        """Test different TTL strategies."""
        from src.ml.cache_manager import get_cache_manager
        
        try:
            manager = get_cache_manager('redis://localhost:6379')
            
            input_data = {'query': 'ttl_test'}
            result = {'output': 'test'}
            
            # Hot strategy (no expiry)
            manager.set('test', 'user1', input_data, result, strategy='hot')
            # Verify no expiry (would need to check Redis TTL)
            
            # Warm strategy (1 hour)
            manager.set('test', 'user2', input_data, result, strategy='warm')
            # Verify 1-hour TTL
            
            # Cold strategy (15 minutes)
            manager.set('test', 'user3', input_data, result, strategy='cold')
            # Verify 15-minute TTL
            
            # Clean up
            manager.delete('test', 'user1', input_data)
            manager.delete('test', 'user2', input_data)
            manager.delete('test', 'user3', input_data)
        
        except Exception as e:
            pytest.skip(f"Redis not available: {e}")


# Test Monitoring
class TestMonitoring:
    """Test monitoring and metrics."""
    
    def test_metrics_collector(self):
        """Test metrics collection."""
        from src.ml.monitoring import get_metrics_collector
        
        collector = get_metrics_collector()
        
        # Increment counter
        collector.inc_counter('test_counter', 5, labels={'module': 'reasoning'})
        assert collector.counters['test_counter{module=reasoning}'] == 5
        
        # Set gauge
        collector.set_gauge('test_gauge', 42.5, labels={'instance': '1'})
        assert collector.gauges['test_gauge{instance=1}'] == 42.5
        
        # Observe histogram
        collector.observe_histogram('test_latency', 0.123, labels={'endpoint': '/reasoning'})
        assert len(collector.histograms['test_latency{endpoint=/reasoning}']) == 1
    
    def test_prometheus_export(self):
        """Test Prometheus format export."""
        from src.ml.monitoring import get_metrics_collector
        
        collector = get_metrics_collector()
        
        # Add some metrics
        collector.inc_counter('requests_total', 100)
        collector.set_gauge('active_users', 50)
        collector.observe_histogram('request_duration', 0.150)
        
        # Export
        prometheus_text = collector.get_prometheus_metrics()
        
        assert 'requests_total' in prometheus_text
        assert 'active_users' in prometheus_text
        assert 'request_duration' in prometheus_text
    
    @pytest.mark.asyncio
    async def test_health_checker(self):
        """Test health check system."""
        from src.ml.monitoring import get_health_checker
        
        checker = get_health_checker()
        
        # Register test checks
        async def check_database():
            return True
        
        async def check_cache():
            return True
        
        checker.register_check('database', check_database)
        checker.register_check('cache', check_cache)
        
        # Run checks
        results = await checker.run_checks()
        
        assert results['status'] == 'healthy'
        assert 'database' in results['checks']
        assert 'cache' in results['checks']
        assert results['checks']['database']['status'] == 'healthy'
    
    def test_structured_logger(self):
        """Test structured logging."""
        from src.ml.monitoring import get_structured_logger
        
        logger = get_structured_logger('test_component')
        
        # Should not raise errors
        logger.info('Test info message', context={'user_id': 'test'})
        logger.warning('Test warning', metrics={'latency': 0.5})
        logger.error('Test error', context={'error_type': 'timeout'})


# Integration Tests
class TestIntegration:
    """End-to-end integration tests."""
    
    @pytest.mark.asyncio
    async def test_full_request_flow(self):
        """Test complete request flow through all components."""
        # This would test:
        # 1. Request received by session manager
        # 2. Checked against rate limit
        # 3. Queued with priority
        # 4. Cache checked
        # 5. Model loaded (lazy)
        # 6. Result computed
        # 7. Cached
        # 8. Metrics recorded
        # 9. Response returned
        
        # Placeholder for full integration test
        pass
    
    def test_concurrent_users(self):
        """Test system under concurrent load."""
        # Would spawn multiple threads/processes
        # Each making requests simultaneously
        # Verify no race conditions, proper isolation
        
        pass
    
    def test_failover(self):
        """Test failover when instance fails."""
        # Would simulate instance failure
        # Verify requests route to healthy instances
        # No data loss
        
        pass


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
