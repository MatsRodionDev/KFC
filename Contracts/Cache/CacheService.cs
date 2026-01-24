using AsyncKeyedLock;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Contracts.Cache;

public class CacheService(IMemoryCache cache, ILogger<CacheService> logger) : ICacheService
{
    private class CacheValue<TValue>
    {
        public TValue? Value { get; set; }
        public DateTime ExpireUtc { get; set; }
    }
    
    private class AsyncLazy<T> : Lazy<Task<T>>
    {
        public AsyncLazy(Func<T> valueFactory) :
            base(() => Task.Factory.StartNew(valueFactory))
        { }

        public AsyncLazy(Func<Task<T>> taskFactory) :
            base(() => Task.Factory.StartNew(() => taskFactory()).Unwrap())
        { }
    }
    
    private const int AbsoluteExpirationSeconds = 60;
    
    private static readonly AsyncKeyedLocker<string> AsyncKeyedLocker = new();
    
    public async Task<T?> GetOrAddAsync<T>(string key, Func<Task<T>> factory, CancellationToken cancellationToken = default)
    {
        var wasCreated = false;
        
        if (!cache.TryGetValue<AsyncLazy<CacheValue<T>>>(key, out var value))
        {
            wasCreated = true;
            
            value = new AsyncLazy<CacheValue<T>>(async () => await GetValue(factory, cancellationToken));
            
            var cacheOptions = new MemoryCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromSeconds(AbsoluteExpirationSeconds));
            
            cache.Set(key, value, cacheOptions);
        }
        
        var result = await value!.Value;

        if (wasCreated)
        {
            return result.Value;
        }

        if (result.ExpireUtc < DateTime.UtcNow.AddSeconds(AbsoluteExpirationSeconds / 4))
        {
            _ = UpdateValue(key, factory, cancellationToken);
        }
        
        return result.Value;
    }

    private async Task<CacheValue<T>> GetValue<T>(Func<Task<T>> factory, 
        CancellationToken cancellationToken)
    {
        T? value;

        try
        {
            value = await factory();
        }
        catch(Exception ex)
        {
            logger.LogWarning("Get cache value error {Message}", ex.Message);
            value = default;
        }

        var cacheValue = new CacheValue<T>
        {
            Value = value,
            ExpireUtc = DateTime.UtcNow.AddSeconds(AbsoluteExpirationSeconds)
        };
        
        return cacheValue;
    }

    private async Task UpdateValue<T>(string key, 
        Func<Task<T>> factory, 
        CancellationToken cancellationToken = default)
    {
        using var keyedLock = await AsyncKeyedLocker.LockOrNullAsync(key, 0, cancellationToken);

        if (keyedLock is null)
            return;
                
        var value = new AsyncLazy<CacheValue<T>>(async () => await GetValue(factory, cancellationToken));

        var cacheOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(TimeSpan.FromSeconds(AbsoluteExpirationSeconds));

        cache.Set(key, value, cacheOptions);
    }
}