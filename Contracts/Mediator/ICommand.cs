namespace Contracts.Mediator
{
    public interface ICommand<TResponse>
    {
    }

    public interface ICommandHandler<TCommand, TResponse> 
        where TCommand : ICommand<TResponse>
    { 
        Task<TResponse> Handle(TCommand command, CancellationToken cancellationToken);
    }

    public interface IQuery<TResponse>
    {
    }

    public interface IQueryHandler<TQuery, TResponse>
        where TQuery : IQuery<TResponse>
    {
        Task<TResponse> Handle(TQuery query, CancellationToken cancellationToken);
    }
}
