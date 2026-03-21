using Contracts.Mediator;
using OrderService.Application.Common.Interfaces;
using OrderService.Domain.Models;

namespace OrderService.Application.UseCases;

public sealed record GetCartQuery(string UserId) 
    : IQuery<Cart>;

internal sealed class GetCartQueryHandler(IUnitOfWork unitOfWork) : IQueryHandler<GetCartQuery, Cart>
{
    public async Task<Cart> Handle(GetCartQuery query, CancellationToken cancellationToken)
    {
        var cart = await unitOfWork.CartRepository.GetByUserIdAsync(query.UserId, cancellationToken);
        cart ??= new Cart { UserId = query.UserId };
        return cart;
    }
} 