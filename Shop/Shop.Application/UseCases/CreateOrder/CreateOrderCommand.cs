using Shop.Application.Common.Interfaces.Mediator;

namespace Shop.Application.UseCases.CreateOrder
{
    public sealed record CreateOrderCommand(Guid UserId) : ICommand;
}
