import redis.asyncio as redis
from config.settings import settings

class RedisClient:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
    
    async def get(self, key: str):
        return await self.redis.get(key)
    
    async def set(self, key: str, value: str, ex: int = None):
        return await self.redis.set(key, value, ex=ex)
    
    async def delete(self, key: str):
        return await self.redis.delete(key)
    
    async def exists(self, key: str):
        return await self.redis.exists(key)

redis_client = RedisClient()