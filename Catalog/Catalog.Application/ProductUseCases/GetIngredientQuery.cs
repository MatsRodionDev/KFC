using Catalog.Application.Common.Interfaces;
using Catalog.Domain.Exceptions;
using Catalog.Domain.IngredientAggregate;
using Contracts.Mediator;

namespace Catalog.Application.ProductUseCases;

public sealed record GetIngredientQuery(Guid IngredientId) : IQuery<Ingredient>;

internal sealed class GetIngredientQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetIngredientQuery, Ingredient>
{
    public async Task<Ingredient> Handle(GetIngredientQuery query, CancellationToken cancellationToken)
    {
        return await unitOfWork.IngredientRepository.GetByIdAsync(query.IngredientId, cancellationToken)
            ?? throw new DomainException($"Ingredient with {query.IngredientId} not found");
    }
}