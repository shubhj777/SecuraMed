"""
Rate Limiting & Anti-Flooding Protection Module
Implements sliding-window counter rate limiting to defend against Denial-of-Service and packet flooding attacks.
"""

import time
import threading
from typing import Dict, List, Tuple
from backend.app.config import settings

class RateLimiter:
    def __init__(self, default_limit_per_minute: int = 60):
        self.default_limit = default_limit_per_minute
        self._lock = threading.Lock()
        # client_id -> list of timestamps (float seconds)
        self._requests: Dict[str, List[float]] = {}

    def is_allowed(self, identifier: str, limit: int = None, window_seconds: float = 60.0) -> Tuple[bool, int, float]:
        """
        Checks if the request rate for the identifier is within limits.
        Returns: (allowed: bool, current_count: int, retry_after: float)
        """
        max_limit = limit if limit is not None else self.default_limit
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._requests.get(identifier, [])
            # Filter timestamps outside the sliding window
            valid_timestamps = [t for t in timestamps if t > cutoff]
            
            if len(valid_timestamps) >= max_limit:
                oldest_in_window = valid_timestamps[0]
                retry_after = max(0.1, round((oldest_in_window + window_seconds) - now, 2))
                self._requests[identifier] = valid_timestamps
                return False, len(valid_timestamps), retry_after

            valid_timestamps.append(now)
            self._requests[identifier] = valid_timestamps
            return True, len(valid_timestamps), 0.0

    def reset(self, identifier: str = None):
        """Resets rate limiting state (useful for test resets)."""
        with self._lock:
            if identifier:
                self._requests.pop(identifier, None)
            else:
                self._requests.clear()

rate_limiter = RateLimiter(default_limit_per_minute=settings.RATE_LIMIT_PER_MINUTE)
