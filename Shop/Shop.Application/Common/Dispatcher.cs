using Microsoft.Extensions.DependencyInjection;
using Shop.Application.Common.Interfaces.Mediator;
using System.Collections.Concurrent;

namespace Shop.Application.Common
{
    public interface IDispatcher
    {
        Task<TResponse> Dispatch<TResponse>(IQuery<TResponse> query, CancellationToken cancellationToken)
            where TResponse : class;
        Task Dispatch(ICommand command, CancellationToken cancellationToken);
    }

    internal sealed class Dispatcher(IServiceProvider serviceProvider) : IDispatcher
    {
        private static readonly ConcurrentDictionary<Type, Type> handlerTypes = new();
        private static readonly ConcurrentDictionary<Type, Type> wrapperTypeDictionary = new();

        public async Task<TResponse> Dispatch<TResponse>(IQuery<TResponse> query, CancellationToken cancellationToken)
            where TResponse : class
        {
            await using var scope = serviceProvider.CreateAsyncScope();

            var handlerType = handlerTypes.GetOrAdd(query.GetType(),
                type => typeof(IQueryHandler<,>).MakeGenericType(type, typeof(TResponse)));
            var handler = scope.ServiceProvider.GetRequiredService(handlerType);

            if (handler is null)
            {
                throw new NotImplementedException();
            }

            var handlerWrapper = QueryHandlerWrapper<TResponse>.Create(handler, query);

            return await handlerWrapper.Handle(query, cancellationToken);
        }

        private abstract class QueryHandlerWrapper<TResponse> where TResponse : class
        {
            public abstract Task<TResponse> Handle(IQuery<TResponse> query, CancellationToken cancellationToken);

            public static QueryHandlerWrapper<TResponse> Create(object handler, IQuery<TResponse> query)
            {
                var wrapperType = wrapperTypeDictionary.GetOrAdd(query.GetType(),
                    qt => typeof(QueryHandlerWrapper<,>).MakeGenericType(qt, typeof(TResponse)));

                return (QueryHandlerWrapper<TResponse>)Activator.CreateInstance(wrapperType, handler)!;
            }
        }

        private sealed class QueryHandlerWrapper<TQuery, TResponse>(object handler)
            : QueryHandlerWrapper<TResponse>
            where TQuery : IQuery<TResponse>
            where TResponse : class
        {
            private readonly IQueryHandler<TQuery, TResponse> handler = (IQueryHandler<TQuery, TResponse>)handler;

            public override async Task<TResponse> Handle(IQuery<TResponse> query, CancellationToken cancellationToken)
            {
                return await handler.Handle((TQuery)query, cancellationToken);
            }
        }

        public async Task Dispatch(ICommand command, CancellationToken cancellationToken)
        {
            await using var scope = serviceProvider.CreateAsyncScope();

            var handlerType = handlerTypes.GetOrAdd(command.GetType(),
                type => typeof(ICommandHandler<>).MakeGenericType(type));
            var handler = scope.ServiceProvider.GetRequiredService(handlerType);

            if (handler is null)
            {
                throw new NotImplementedException();
            }

            var handlerWrapper = CommandHandlerWrapper.Create(handler, command);

            await handlerWrapper.Handle(command, cancellationToken);
        }

        private abstract class CommandHandlerWrapper
        {
            public abstract Task Handle(ICommand command, CancellationToken cancellationToken);

            public static CommandHandlerWrapper Create(object handler, ICommand command)
            {
                var wrapperType = wrapperTypeDictionary.GetOrAdd(command.GetType(),
                    qt => typeof(CommandHandlerWrapper<>).MakeGenericType(qt));

                return (CommandHandlerWrapper)Activator.CreateInstance(wrapperType, handler)!;
            }
        }

        private sealed class CommandHandlerWrapper<TCommand>(object handler)
            : CommandHandlerWrapper
            where TCommand : ICommand
        {
            private readonly ICommandHandler<TCommand> handler = (ICommandHandler<TCommand>)handler;

            public override async Task Handle(ICommand command, CancellationToken cancellationToken)
            {
                await handler.Handle((TCommand)command, cancellationToken);
            }
        }

    }
}
