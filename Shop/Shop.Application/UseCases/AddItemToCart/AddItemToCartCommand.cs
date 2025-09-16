using Shop.Application.Common.Interfaces.Mediator;

namespace Shop.Application.UseCases.AddItemToCart
{
    public sealed record AddItemToCartCommand(
        Guid UserId,
        Guid ProductId,
        int Quantity) : ICommand;
}
