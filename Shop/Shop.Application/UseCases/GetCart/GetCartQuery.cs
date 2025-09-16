using Shop.Application.Common.Interfaces.Mediator;
using Shop.Domain.CartAggregate;

namespace Shop.Application.UseCases.GetCart
{
    public sealed record GetCartQuery(Guid UserId) : IQuery<Cart>;
}
