using Shop.Application.Common.Dtos;
using Shop.Application.Common.Interfaces.Mediator;
using Shop.Application.Common.Interfaces.UoW;
using Shop.Domain.Enums;
using Shop.Domain.IngredientAggregate;
using Shop.Domain.ProductAggregate;

namespace Shop.Application.UseCases.CreateProduct
{
    public sealed record CreateProductCommand(
        string Name,
        string Description,
        decimal Price,
        ProductCategory ProductCategory,
        AddIngredientToProductDto? BaseIngredientId,
        List<AddIngredientToProductDto> IngredintsIds) : ICommand;

    public sealed class CreateProductCommandHandler(IUnitOfWork unitOfWork) : ICommandHandler<CreateProductCommand>
    {
        public async Task Handle(CreateProductCommand command, CancellationToken cancellationToken)
        {
            var product = Product.Create(
                command.Name,
                command.Description,
                command.Price,
                command.ProductCategory,
                null);

            await unitOfWork.ProductRepository.AddAsync(product, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
    }
}
