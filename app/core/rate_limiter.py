from slowapi import Limiter
from slowapi.util import get_remote_address

# Default IP-based rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
