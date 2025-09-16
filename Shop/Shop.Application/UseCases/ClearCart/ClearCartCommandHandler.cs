using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;

namespace Shop.Application.UseCases.ClearCart
{
    internal sealed class ClearCartCommandHandler(IUnitOfWork unitOfWork) : ICommandHandler<ClearCartCommand>
    {
        public async Task Handle(ClearCartCommand command, CancellationToken cancellationToken)
        {
            var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

            if(cart is null)
            {
                return;
            }

            cart.Clear();

            unitOfWork.CartRepository.Update(cart);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
