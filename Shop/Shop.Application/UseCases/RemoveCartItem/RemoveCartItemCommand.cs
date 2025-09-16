using Shop.Application.Common.Interfaces.Mediator;

namespace Shop.Application.UseCases.RemoveCartItem
{
    public sealed record RemoveCartItemCommand(Guid UserId, Guid ItemId) : ICommand;
}
