using Contracts.Mediator;
using OrderService.Application.Common.Clients;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record SetDeliveryCommand(Guid UserId) : Delivery, ICommand<Guid>;

public sealed class SetDeliveryCommandHandler(IUnitOfWork unitOfWork, ICoordinatesApi coordinatesApi) : ICommandHandler<SetDeliveryCommand, Guid>
{
    public async Task<Guid> Handle(SetDeliveryCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(command.Address))
        {
            throw new Exception("Пустой адресс");
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
            throw new Exception("Неправильно указанныей адрес");
        }
        
        await unitOfWork.SaveChangesAsync(cancellationToken: cancellationToken);
        
        return cart.Id;
    }
}
