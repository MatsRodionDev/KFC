using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;
using Shop.Domain.CartAggregate;
using Shop.Domain.Services;

namespace Shop.Application.UseCases.AddItemToCart
{
    internal sealed class AddItemToCartCommandHandler(
        IUnitOfWork unitOfWork, 
        CartProductAdditionService cartProductAdditionService) : ICommandHandler<AddItemToCartCommand>
    {
        public async Task Handle(AddItemToCartCommand command, CancellationToken cancellationToken)
        {
            var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

            if (cart is null)
            {
                cart = Cart.Create(command.UserId);

                await unitOfWork.CartRepository.CreateAsync(cart, cancellationToken);
            }

            var product = await unitOfWork.ProductRepository.GetByIdAsync(command.ProductId, cancellationToken);

            if (product is null)
            {
                throw new Exception();
            }

            var cartItem = cartProductAdditionService.AddProduct(cart, product, command.Quantity);
    
            await unitOfWork.CartItemRepository.AddAsync(cartItem, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
