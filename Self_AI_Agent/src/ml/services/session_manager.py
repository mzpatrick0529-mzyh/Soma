"""
Phase 6: Session Manager

Manages multiple concurrent user sessions with:
- Request queuing and priority scheduling
- Resource allocation and rate limiting
- Session isolation
- User-specific resource limits

Supports 100+ concurrent users per instance.
"""

import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import time
import logging
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


class Priority(Enum):
    """Request priority levels."""
    LOW = 0
    STANDARD = 1
    HIGH = 2
    PREMIUM = 3


@dataclass
class UserSession:
    """Represents an active user session."""
    user_id: str
    created_at: datetime = field(default_factory=datetime.now)
    last_active: datetime = field(default_factory=datetime.now)
    request_count: int = 0
    total_processing_time: float = 0.0
    tier: str = "standard"  # free, standard, premium
    
    def update_activity(self):
        """Update last active timestamp."""
        self.last_active = datetime.now()
    
    def add_request(self, processing_time: float):
        """Record a completed request."""
        self.request_count += 1
        self.total_processing_time += processing_time
        self.update_activity()
    
    def avg_processing_time(self) -> float:
        """Get average processing time per request."""
        if self.request_count == 0:
            return 0.0
        return self.total_processing_time / self.request_count


@dataclass
class Request:
    """Represents a queued request."""
    request_id: str
    user_id: str
    module_name: str
    method_name: str
    kwargs: Dict[str, Any]
    priority: Priority
    created_at: datetime = field(default_factory=datetime.now)
    future: Optional[asyncio.Future] = None
    
    def age(self) -> float:
        """Get request age in seconds."""
        return (datetime.now() - self.created_at).total_seconds()


class SessionManager:
    """
    Manages user sessions and request scheduling.
    
    Features:
    - Priority-based request queue
    - Per-user rate limiting
    - Resource allocation
    - Session cleanup
    """
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.sessions: Dict[str, UserSession] = {}
        self.request_queues: Dict[Priority, deque] = {
            p: deque() for p in Priority
        }
        self.active_requests: Dict[str, Request] = {}
        
        # Rate limiting
        self.rate_limits = {
            'free': 10,      # 10 req/min
            'standard': 60,  # 60 req/min
            'premium': 300   # 300 req/min
        }
        self.rate_windows: Dict[str, deque] = defaultdict(deque)
        
        # Resource limits
        self.max_concurrent_per_user = config.get('max_concurrent_per_user', 5)
        self.max_total_concurrent = config.get('max_total_concurrent', 100)
        self.session_timeout = config.get('session_timeout', 1800)  # 30 min
        
        # Start background tasks
        asyncio.create_task(self._cleanup_task())
        asyncio.create_task(self._process_queue_task())
        
        logger.info(f"SessionManager initialized (max concurrent: {self.max_total_concurrent})")
    
    def get_or_create_session(self, user_id: str, tier: str = "standard") -> UserSession:
        """
        Get existing session or create new one.
        
        Args:
            user_id: User identifier
            tier: User tier (free, standard, premium)
        
        Returns:
            UserSession object
        """
        if user_id not in self.sessions:
            self.sessions[user_id] = UserSession(user_id=user_id, tier=tier)
            logger.info(f"Created new session for user {user_id} (tier: {tier})")
        
        session = self.sessions[user_id]
        session.update_activity()
        return session
    
    def check_rate_limit(self, user_id: str) -> bool:
        """
        Check if user has exceeded rate limit.
        
        Uses sliding window rate limiting.
        
        Returns:
            True if request is allowed, False if rate limited
        """
        session = self.get_or_create_session(user_id)
        tier = session.tier
        limit = self.rate_limits.get(tier, 10)
        
        now = time.time()
        window = 60  # 1 minute window
        
        # Clean old timestamps
        user_window = self.rate_windows[user_id]
        while user_window and user_window[0] < now - window:
            user_window.popleft()
        
        # Check limit
        if len(user_window) >= limit:
            logger.warning(f"Rate limit exceeded for user {user_id} (tier: {tier}, limit: {limit}/min)")
            return False
        
        # Record timestamp
        user_window.append(now)
        return True
    
    def get_priority(self, user_id: str, module_name: str) -> Priority:
        """
        Determine request priority based on user tier and module.
        
        Premium users get higher priority.
        Critical modules (emotions, narrative) get priority boost.
        """
        session = self.get_or_create_session(user_id)
        
        # Base priority from tier
        tier_priority = {
            'free': Priority.LOW,
            'standard': Priority.STANDARD,
            'premium': Priority.PREMIUM
        }
        priority = tier_priority.get(session.tier, Priority.STANDARD)
        
        # Boost for critical modules
        if module_name in ['emotions', 'narrative'] and priority.value < Priority.HIGH.value:
            priority = Priority.HIGH
        
        return priority
    
    async def submit_request(
        self,
        request_id: str,
        user_id: str,
        module_name: str,
        method_name: str,
        **kwargs
    ) -> Any:
        """
        Submit a request for processing.
        
        Request is queued and processed asynchronously.
        
        Args:
            request_id: Unique request identifier
            user_id: User making the request
            module_name: Cognitive module to use
            method_name: Method to call
            **kwargs: Method arguments
        
        Returns:
            Result from processing
        
        Raises:
            RateLimitError: If user exceeded rate limit
            ResourceLimitError: If too many concurrent requests
        """
        # Check rate limit
        if not self.check_rate_limit(user_id):
            raise RateLimitError(f"Rate limit exceeded for user {user_id}")
        
        # Check concurrent request limit
        user_active = sum(1 for r in self.active_requests.values() if r.user_id == user_id)
        if user_active >= self.max_concurrent_per_user:
            raise ResourceLimitError(f"Too many concurrent requests for user {user_id}")
        
        # Check global concurrent limit
        if len(self.active_requests) >= self.max_total_concurrent:
            raise ResourceLimitError("System at capacity, please retry later")
        
        # Determine priority
        priority = self.get_priority(user_id, module_name)
        
        # Create request
        future = asyncio.Future()
        request = Request(
            request_id=request_id,
            user_id=user_id,
            module_name=module_name,
            method_name=method_name,
            kwargs=kwargs,
            priority=priority,
            future=future
        )
        
        # Add to queue
        self.request_queues[priority].append(request)
        logger.debug(f"Request {request_id} queued (user: {user_id}, priority: {priority.name})")
        
        # Wait for result
        result = await future
        return result
    
    async def _process_queue_task(self):
        """
        Background task to process queued requests.
        
        Processes requests by priority: PREMIUM > HIGH > STANDARD > LOW
        """
        while True:
            try:
                # Find highest priority non-empty queue
                request = None
                for priority in [Priority.PREMIUM, Priority.HIGH, Priority.STANDARD, Priority.LOW]:
                    if self.request_queues[priority]:
                        request = self.request_queues[priority].popleft()
                        break
                
                if request is None:
                    # No requests, wait a bit
                    await asyncio.sleep(0.01)
                    continue
                
                # Process request
                await self._process_request(request)
            
            except Exception as e:
                logger.error(f"Error in queue processing: {e}")
                await asyncio.sleep(1)
    
    async def _process_request(self, request: Request):
        """
        Process a single request.
        
        Loads module, executes method, records metrics.
        """
        start_time = time.time()
        
        try:
            # Mark as active
            self.active_requests[request.request_id] = request
            
            logger.info(f"Processing request {request.request_id} (user: {request.user_id}, "
                       f"module: {request.module_name}, age: {request.age():.2f}s)")
            
            # Load module and execute
            from .model_optimizer import get_optimizer
            optimizer = get_optimizer()
            module = optimizer.lazy_load_module(request.module_name)
            method = getattr(module, request.method_name)
            
            result = method(**request.kwargs)
            
            # Set result
            request.future.set_result(result)
            
            # Record metrics
            processing_time = time.time() - start_time
            session = self.get_or_create_session(request.user_id)
            session.add_request(processing_time)
            
            logger.info(f"Request {request.request_id} completed in {processing_time*1000:.1f}ms")
        
        except Exception as e:
            logger.error(f"Request {request.request_id} failed: {e}")
            request.future.set_exception(e)
        
        finally:
            # Remove from active
            if request.request_id in self.active_requests:
                del self.active_requests[request.request_id]
    
    async def _cleanup_task(self):
        """
        Background task to cleanup inactive sessions.
        
        Runs every 5 minutes, removes sessions inactive for >30 minutes.
        """
        while True:
            try:
                await asyncio.sleep(300)  # 5 minutes
                
                now = datetime.now()
                timeout = timedelta(seconds=self.session_timeout)
                
                # Find inactive sessions
                inactive = [
                    user_id for user_id, session in self.sessions.items()
                    if now - session.last_active > timeout
                ]
                
                # Remove inactive sessions
                for user_id in inactive:
                    del self.sessions[user_id]
                    if user_id in self.rate_windows:
                        del self.rate_windows[user_id]
                    logger.info(f"Cleaned up inactive session: {user_id}")
                
                if inactive:
                    logger.info(f"Cleaned up {len(inactive)} inactive sessions")
            
            except Exception as e:
                logger.error(f"Error in cleanup task: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get current session manager statistics.
        
        Returns:
            Dict with active sessions, queue sizes, etc.
        """
        queue_sizes = {p.name: len(q) for p, q in self.request_queues.items()}
        
        tier_counts = defaultdict(int)
        for session in self.sessions.values():
            tier_counts[session.tier] += 1
        
        return {
            'active_sessions': len(self.sessions),
            'active_requests': len(self.active_requests),
            'queue_sizes': queue_sizes,
            'total_queued': sum(queue_sizes.values()),
            'tier_distribution': dict(tier_counts),
            'config': {
                'max_concurrent_per_user': self.max_concurrent_per_user,
                'max_total_concurrent': self.max_total_concurrent,
                'session_timeout': self.session_timeout
            }
        }
    
    def get_user_stats(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get statistics for a specific user.
        
        Returns:
            Dict with session info, or None if no session
        """
        if user_id not in self.sessions:
            return None
        
        session = self.sessions[user_id]
        user_active = sum(1 for r in self.active_requests.values() if r.user_id == user_id)
        
        return {
            'user_id': user_id,
            'tier': session.tier,
            'created_at': session.created_at.isoformat(),
            'last_active': session.last_active.isoformat(),
            'request_count': session.request_count,
            'avg_processing_time': session.avg_processing_time(),
            'active_requests': user_active,
            'rate_limit': self.rate_limits[session.tier]
        }


# Custom exceptions
class RateLimitError(Exception):
    """Raised when rate limit is exceeded."""
    pass


class ResourceLimitError(Exception):
    """Raised when resource limit is exceeded."""
    pass


# Singleton instance
_session_manager = None

def get_session_manager(config: Optional[Dict[str, Any]] = None) -> SessionManager:
    """Get or create SessionManager singleton."""
    global _session_manager
    if _session_manager is None:
        _session_manager = SessionManager(config or {})
    return _session_manager
