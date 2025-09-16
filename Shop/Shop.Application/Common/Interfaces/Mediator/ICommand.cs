namespace Shop.Application.Common.Interfaces.Mediator
{
    public interface ICommand
    {
    }

    public interface ICommandHandler<TCommand> 
        where TCommand : ICommand
    { 
        Task Handle(TCommand command, CancellationToken cancellationToken);
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
