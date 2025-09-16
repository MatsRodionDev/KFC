using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;
using System.Reflection.Metadata.Ecma335;

namespace Shop.Application.UseCases.DecreaseCartItemQuantity
{
    public sealed record UpdateCartItemQuantityCommand(Guid UserId, Guid ItemId, int Quantity) : ICommand;

    internal sealed class UpdateCartItemQuantityCommandHandler(IUnitOfWork unitOfWork) : ICommandHandler<UpdateCartItemQuantityCommand>
    {
        public async Task Handle(UpdateCartItemQuantityCommand command, CancellationToken cancellationToken)
        {
            var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

            if (cart == null)
            {
                throw new Exception();
            }

            cart.UpdateItemQuantity(command.ItemId, command.Quantity);

            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
