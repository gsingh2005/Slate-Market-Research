from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request

WINDOW_SECONDS = 60
MAX_REQUESTS = 60
_requests: dict[str, deque[float]] = defaultdict(deque)


def analysis_rate_limit(request: Request) -> None:
    """Guard expensive demo endpoints; use a shared limiter in multi-instance production."""
    client = request.client.host if request.client else "unknown"
    now = monotonic()
    history = _requests[client]
    while history and history[0] <= now - WINDOW_SECONDS:
        history.popleft()
    if len(history) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429, detail="Analysis request limit reached. Try again shortly."
        )
    history.append(now)
