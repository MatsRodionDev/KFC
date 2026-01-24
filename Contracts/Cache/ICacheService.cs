namespace Contracts.Cache;

public interface ICacheService
{
    Task<T?> GetOrAddAsync<T>(string key, Func<Task<T>> factory, CancellationToken cancellationToken = default);
}