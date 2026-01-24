using System.Collections.Concurrent;

namespace Contracts.Shared;

public static class Locks<T> 
    where T : notnull
{
    private static readonly ConcurrentDictionary<T, SemaphoreSlim> _locks = new();

    public static async Task<AsyncLock> Wait(T key)
    {
        SemaphoreSlim? semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();
        return new AsyncLock(semaphore);
    }

    public class AsyncLock : IDisposable
    {
        private readonly SemaphoreSlim _semaphoreSlim;

        public AsyncLock(SemaphoreSlim semaphoreSlim)
        {
            _semaphoreSlim = semaphoreSlim;
        }

        public void Dispose()
        {
            _semaphoreSlim.Release();
        }
    }
}