import time
from typing import Dict, Tuple
from fastapi import HTTPException

class RateLimiter:
    """
    A simple in-memory rate limiter for code submissions.
    Supports tiered limits for correct vs failed attempts.
    """
    def __init__(self):
        # user_id -> [timestamps]
        self.submissions: Dict[int, list] = {}
        # user_id -> failure_count
        self.failure_penalties: Dict[int, int] = {}
        
        self.WINDOW_SECONDS = 60
        self.MAX_SUBMISSIONS_PER_WINDOW = 5
        self.FAILURE_THRESHOLD = 3
        self.PENALTY_COOLDOWN_SECONDS = 300 # 5 minutes

    def check_rate_limit(self, user_id: int):
        now = time.time()
        
        # Clean up old timestamps
        if user_id in self.submissions:
            self.submissions[user_id] = [t for t in self.submissions[user_id] if now - t < self.WINDOW_SECONDS]
        else:
            self.submissions[user_id] = []

        # Check standard limit
        if len(self.submissions[user_id]) >= self.MAX_SUBMISSIONS_PER_WINDOW:
            raise HTTPException(
                status_code=429,
                detail=f"Too many submissions. Please wait {self.WINDOW_SECONDS} seconds between batches."
            )

        # Check failure penalty
        if self.failure_penalties.get(user_id, 0) >= self.FAILURE_THRESHOLD:
            # Check if last submission was more than penalty time ago
            if self.submissions[user_id]:
                last_sub = self.submissions[user_id][-1]
                if now - last_sub < self.PENALTY_COOLDOWN_SECONDS:
                    wait_time = int(self.PENALTY_COOLDOWN_SECONDS - (now - last_sub))
                    raise HTTPException(
                        status_code=429,
                        detail=f"Repeated failures detected. Cooldown active for {wait_time} more seconds."
                    )
                else:
                    # Cooldown expired, reset failures
                    self.failure_penalties[user_id] = 0

        # Log this attempt
        self.submissions[user_id].append(now)

    def log_result(self, user_id: int, success: bool):
        if success:
            # Reset failure count on success
            self.failure_penalties[user_id] = 0
        else:
            self.failure_penalties[user_id] = self.failure_penalties.get(user_id, 0) + 1

# Singleton instance
submission_limiter = RateLimiter()
