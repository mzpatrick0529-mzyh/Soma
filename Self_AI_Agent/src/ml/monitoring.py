"""
Phase 6: Monitoring Service

Implements Prometheus metrics, structured logging, and health checks.

Metrics:
- Request latency (histogram)
- Throughput (counter)
- Error rate (counter)
- Resource usage (gauge)
- Cache hit rate (gauge)

Integrates with Prometheus + Grafana for observability.
"""

import time
import logging
from typing import Dict, Any, Optional
from dataclasses import dataclass, field
from collections import defaultdict, deque
from datetime import datetime
import json

logger = logging.getLogger(__name__)


@dataclass
class MetricSnapshot:
    """A single metric data point."""
    name: str
    value: float
    labels: Dict[str, str] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)
    
    def to_prometheus(self) -> str:
        """
        Format metric in Prometheus exposition format.
        
        Example:
        http_requests_total{method="GET",status="200"} 1027
        """
        labels_str = ",".join(f'{k}="{v}"' for k, v in self.labels.items())
        if labels_str:
            return f"{self.name}{{{labels_str}}} {self.value}"
        return f"{self.name} {self.value}"


class MetricsCollector:
    """
    Collects and exposes Prometheus-compatible metrics.
    
    Metric types:
    - Counter: Monotonically increasing (requests, errors)
    - Gauge: Can go up/down (memory, active users)
    - Histogram: Distribution of values (latency)
    """
    
    def __init__(self):
        self.counters: Dict[str, float] = defaultdict(float)
        self.gauges: Dict[str, float] = {}
        self.histograms: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        
        # Track metric metadata
        self.metric_help = {}
        self.metric_type = {}
        
        self._register_default_metrics()
        logger.info("MetricsCollector initialized")
    
    def _register_default_metrics(self):
        """Register standard metrics."""
        # Request metrics
        self.register_metric(
            "ml_requests_total",
            "counter",
            "Total number of ML service requests"
        )
        self.register_metric(
            "ml_request_duration_seconds",
            "histogram",
            "ML request latency in seconds"
        )
        self.register_metric(
            "ml_errors_total",
            "counter",
            "Total number of errors"
        )
        
        # Resource metrics
        self.register_metric(
            "ml_active_sessions",
            "gauge",
            "Number of active user sessions"
        )
        self.register_metric(
            "ml_queue_size",
            "gauge",
            "Number of requests in queue"
        )
        self.register_metric(
            "ml_loaded_modules",
            "gauge",
            "Number of loaded cognitive modules"
        )
        
        # Cache metrics
        self.register_metric(
            "ml_cache_hits_total",
            "counter",
            "Total cache hits"
        )
        self.register_metric(
            "ml_cache_misses_total",
            "counter",
            "Total cache misses"
        )
        self.register_metric(
            "ml_cache_hit_rate",
            "gauge",
            "Cache hit rate (0-1)"
        )
    
    def register_metric(self, name: str, metric_type: str, help_text: str):
        """Register a new metric."""
        self.metric_type[name] = metric_type
        self.metric_help[name] = help_text
    
    def inc_counter(self, name: str, value: float = 1.0, labels: Optional[Dict[str, str]] = None):
        """Increment a counter metric."""
        key = self._make_key(name, labels)
        self.counters[key] += value
    
    def set_gauge(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Set a gauge metric value."""
        key = self._make_key(name, labels)
        self.gauges[key] = value
    
    def observe_histogram(self, name: str, value: float, labels: Optional[Dict[str, str]] = None):
        """Add observation to histogram."""
        key = self._make_key(name, labels)
        self.histograms[key].append(value)
    
    def _make_key(self, name: str, labels: Optional[Dict[str, str]]) -> str:
        """Create unique key from name and labels."""
        if not labels:
            return name
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"
    
    def get_prometheus_metrics(self) -> str:
        """
        Export all metrics in Prometheus text format.
        
        Returns:
            Prometheus exposition format string
        """
        lines = []
        
        # Export counters
        for key, value in self.counters.items():
            name, labels = self._parse_key(key)
            if name in self.metric_help:
                lines.append(f"# HELP {name} {self.metric_help[name]}")
                lines.append(f"# TYPE {name} counter")
            lines.append(MetricSnapshot(name, value, labels).to_prometheus())
        
        # Export gauges
        for key, value in self.gauges.items():
            name, labels = self._parse_key(key)
            if name in self.metric_help:
                lines.append(f"# HELP {name} {self.metric_help[name]}")
                lines.append(f"# TYPE {name} gauge")
            lines.append(MetricSnapshot(name, value, labels).to_prometheus())
        
        # Export histograms (with percentiles)
        for key, values in self.histograms.items():
            if not values:
                continue
            
            name, labels = self._parse_key(key)
            if name in self.metric_help:
                lines.append(f"# HELP {name} {self.metric_help[name]}")
                lines.append(f"# TYPE {name} histogram")
            
            sorted_values = sorted(values)
            count = len(sorted_values)
            total = sum(sorted_values)
            
            # Percentiles
            p50 = sorted_values[int(count * 0.5)]
            p95 = sorted_values[int(count * 0.95)]
            p99 = sorted_values[int(count * 0.99)]
            
            # Histogram buckets
            buckets = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0, 2.0, 5.0, 10.0]
            cumulative = 0
            for bucket in buckets:
                cumulative += sum(1 for v in sorted_values if v <= bucket)
                bucket_labels = {**labels, 'le': str(bucket)}
                lines.append(MetricSnapshot(f"{name}_bucket", cumulative, bucket_labels).to_prometheus())
            
            # +Inf bucket
            inf_labels = {**labels, 'le': '+Inf'}
            lines.append(MetricSnapshot(f"{name}_bucket", count, inf_labels).to_prometheus())
            
            # Sum and count
            lines.append(MetricSnapshot(f"{name}_sum", total, labels).to_prometheus())
            lines.append(MetricSnapshot(f"{name}_count", count, labels).to_prometheus())
        
        return "\n".join(lines)
    
    def _parse_key(self, key: str) -> tuple[str, Dict[str, str]]:
        """Parse metric key back into name and labels."""
        if '{' not in key:
            return key, {}
        
        name, labels_str = key.split('{', 1)
        labels_str = labels_str.rstrip('}')
        
        labels = {}
        for pair in labels_str.split(','):
            if '=' in pair:
                k, v = pair.split('=', 1)
                labels[k] = v
        
        return name, labels
    
    def get_summary(self) -> Dict[str, Any]:
        """Get human-readable metrics summary."""
        summary = {
            'counters': dict(self.counters),
            'gauges': dict(self.gauges),
            'histograms': {}
        }
        
        for key, values in self.histograms.items():
            if values:
                sorted_values = sorted(values)
                summary['histograms'][key] = {
                    'count': len(values),
                    'sum': sum(values),
                    'min': sorted_values[0],
                    'max': sorted_values[-1],
                    'p50': sorted_values[int(len(values) * 0.5)],
                    'p95': sorted_values[int(len(values) * 0.95)],
                    'p99': sorted_values[int(len(values) * 0.99)]
                }
        
        return summary


class StructuredLogger:
    """
    Structured JSON logger for better log aggregation.
    
    Each log includes:
    - Timestamp
    - Level
    - Message
    - Context (user_id, request_id, etc.)
    - Metrics (latency, etc.)
    """
    
    def __init__(self, name: str):
        self.name = name
        self.logger = logging.getLogger(name)
    
    def log(
        self,
        level: str,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        metrics: Optional[Dict[str, float]] = None
    ):
        """
        Log a structured message.
        
        Args:
            level: Log level (INFO, WARNING, ERROR)
            message: Log message
            context: Contextual information
            metrics: Metric values
        """
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'level': level,
            'service': 'ml-service',
            'component': self.name,
            'message': message,
        }
        
        if context:
            log_entry['context'] = context
        
        if metrics:
            log_entry['metrics'] = metrics
        
        log_str = json.dumps(log_entry)
        
        if level == 'ERROR':
            self.logger.error(log_str)
        elif level == 'WARNING':
            self.logger.warning(log_str)
        else:
            self.logger.info(log_str)
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        self.log('INFO', message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.log('WARNING', message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message."""
        self.log('ERROR', message, **kwargs)


class HealthChecker:
    """
    Health check system for monitoring service status.
    
    Checks:
    - Database connectivity
    - Cache availability
    - Module loading
    - Resource usage
    """
    
    def __init__(self):
        self.checks = {}
        self.last_check_time = None
        self.last_check_results = {}
    
    def register_check(self, name: str, check_func):
        """Register a health check function."""
        self.checks[name] = check_func
    
    async def run_checks(self) -> Dict[str, Any]:
        """
        Run all health checks.
        
        Returns:
            Dict with status and individual check results
        """
        self.last_check_time = datetime.now()
        results = {}
        all_healthy = True
        
        for name, check_func in self.checks.items():
            try:
                start = time.time()
                is_healthy = await check_func()
                duration = time.time() - start
                
                results[name] = {
                    'status': 'healthy' if is_healthy else 'unhealthy',
                    'duration_ms': duration * 1000
                }
                
                if not is_healthy:
                    all_healthy = False
            
            except Exception as e:
                results[name] = {
                    'status': 'error',
                    'error': str(e)
                }
                all_healthy = False
        
        self.last_check_results = results
        
        return {
            'status': 'healthy' if all_healthy else 'unhealthy',
            'timestamp': self.last_check_time.isoformat(),
            'checks': results
        }
    
    def get_status(self) -> str:
        """Get current health status (without running checks)."""
        if not self.last_check_results:
            return 'unknown'
        
        all_healthy = all(
            check.get('status') == 'healthy'
            for check in self.last_check_results.values()
        )
        
        return 'healthy' if all_healthy else 'unhealthy'


# Global instances
_metrics_collector = MetricsCollector()
_health_checker = HealthChecker()


def get_metrics_collector() -> MetricsCollector:
    """Get global metrics collector."""
    return _metrics_collector


def get_health_checker() -> HealthChecker:
    """Get global health checker."""
    return _health_checker


def get_structured_logger(name: str) -> StructuredLogger:
    """Create a structured logger for a component."""
    return StructuredLogger(name)
