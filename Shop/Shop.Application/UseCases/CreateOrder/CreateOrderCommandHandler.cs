using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.Notifiers;
using Shop.Application.Common.Interfaces.UoW;
using Shop.Domain.Exceptions;
using Shop.Domain.Services;

namespace Shop.Application.UseCases.CreateOrder
{
    internal sealed class CreateOrderCommandHandler(IUnitOfWork unitOfWork, IWorkerNotifier workerNotifier, OrderCreationService orderCreationService) : ICommandHandler<CreateOrderCommand>
    {
        public async Task Handle(CreateOrderCommand command, CancellationToken cancellationToken)
        {
            var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

            if (cart is null || cart.Items.Count == 0)
            {
                throw new DomainException("Cart is empty");
            }

            var order = await orderCreationService.CreateOrderFromCartAsync(cart, cancellationToken);

            await unitOfWork.OrderRepository.CreateAsync(order, cancellationToken);

            await unitOfWork.SaveChangesAsync(cancellationToken);

            await workerNotifier.NotifyNewOrderAsync(order, cancellationToken);
        }
    }
}
