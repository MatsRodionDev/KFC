using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;

namespace Shop.Application.UseCases.RemoveCartItem
{
    internal sealed class RemoveCartItemCommandHandler(IUnitOfWork unitOfWork) : ICommandHandler<RemoveCartItemCommand>
    {
        public async Task Handle(RemoveCartItemCommand command, CancellationToken cancellationToken)
        {
            var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

            if (cart is null)
            {
                return;
            }

            cart.RemoveItem(command.ItemId);


            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
