using Contracts.Product;

namespace ChatClient.API.Dtos;

public record OrderDto(Guid ProductId, string Name, int Quantity, List<CustomIngredient>? CustomIngredients);

public record OrderResponseDto(Guid ProductId, string Name, int Quantity, List<CustomIngredient>? CustomIngredients, ProductResponse? Product);