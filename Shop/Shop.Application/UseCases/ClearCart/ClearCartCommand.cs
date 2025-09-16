using Shop.Application.Common.Interfaces.Mediator;

namespace Shop.Application.UseCases.ClearCart
{
    public sealed record ClearCartCommand(Guid UserId) : ICommand;
}
