using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;
using Shop.Domain.CartAggregate;

namespace Shop.Application.UseCases.GetCart
{
    internal sealed class GetCartQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetCartQuery, Cart>
    {
        public async Task<Cart> Handle(GetCartQuery query, CancellationToken cancellationToken)
        {
            var cart = await unitOfWork.CartRepository.GetByUserIdAsync(query.UserId, cancellationToken);

            cart ??= Cart.Create(query.UserId);

            return cart;
        }
    }
}
