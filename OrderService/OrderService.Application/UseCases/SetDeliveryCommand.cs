using Contracts.Mediator;
using Medallion.Threading;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record SetDeliveryCommand(Guid UserId, string Address) : ICommand<Guid>;

public sealed class SetDeliveryCommandHandler(
    IUnitOfWork unitOfWork, 
    ICoordinatesApi coordinatesApi,
    IDistributedLockProvider distributedLockProvider) 
    : BaseCommandHandler<SetDeliveryCommand, Guid>(distributedLockProvider)
{
    protected override async Task<Guid> InternalHandle(SetDeliveryCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(command.Address))
        {
            throw new Exception("Address cannot be null or empty");
        }

        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (cart is null)
        {
            cart = new Cart {UserId = command.UserId};
            await unitOfWork.CartRepository.AddAsync(cart, cancellationToken);
        }
        
        Delivery currentDelivery = cart.Delivery;

        if (currentDelivery.Address == command.Address)
        {
            return cart.Id;
        }
        
        currentDelivery.ServiceType = ServiceType.Delivery;
        currentDelivery.Address = command.Address;
        currentDelivery.Coordinates = (await coordinatesApi.SearchAsync(command.Address!, cancellationToken: cancellationToken))
            .FirstOrDefault()?
            .ToDomainModel();

        if (currentDelivery.Coordinates is null)
        {
            throw new Exception("The delivery coordinate is incorrect");
        }
        
        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        
        return cart.Id;
    }
    
    protected override Guid? GetUserId(SetDeliveryCommand command)
    {
        return command.UserId;
    }
}
