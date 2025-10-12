using Catalog.Application.Common.Interfaces;
using Catalog.Application.Common.Mediator;
using Catalog.Domain.ToppingAggregate;
using Shop.Domain.Enums;

namespace Catalog.Application.ProductUseCases;

public sealed record AddToppingCommand(
    string Name,
    decimal Price,
    List<DrinkType> AvailableForTypes) : ICommand<Guid>;

internal sealed class AddToppingCommandHandler(IUnitOfWork unitOfWork) : ICommandHandler<AddToppingCommand, Guid>
{
    public async Task<Guid> Handle(AddToppingCommand command, CancellationToken cancellationToken)
    {
        var topping = Topping.Create(
            command.Name, 
            command.Price, 
            command.AvailableForTypes);
        
        await unitOfWork.ToppingRepository.AddAsync(topping, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        
        return topping.Id;      
    }
}