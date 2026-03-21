using Contracts.Mediator;
using Medallion.Threading;

namespace OrderService.Application.UseCases;

public abstract class BaseCommandHandler<TCommand, TResponse>(IDistributedLockProvider distributedLockProvider) 
    : ICommandHandler<TCommand, TResponse>
where TCommand : ICommand<TResponse>
{
    private readonly string? newUserId = null;
    protected virtual string? GetUserId(TCommand command) => newUserId; 
    
    public async Task<TResponse> Handle(TCommand command, CancellationToken cancellationToken)
    {
        var userId = GetUserId(command);
        
        await using var locker = userId is null ? null
            : await distributedLockProvider.TryAcquireLockAsync(GetRedisLockKey(userId)
                , TimeSpan.FromSeconds(45), cancellationToken);
        
        if (userId is not null && locker is null)
        {
            throw new TimeoutException($"Failed to acquire lock for cart {userId} for 45 sec");
        }
        
        return await InternalHandle(command, cancellationToken); 
    }

    protected abstract Task<TResponse> InternalHandle(TCommand command, CancellationToken cancellationToken);
    
    private static string GetRedisLockKey(string userId) => $"CartService:Lock:{userId}";
}