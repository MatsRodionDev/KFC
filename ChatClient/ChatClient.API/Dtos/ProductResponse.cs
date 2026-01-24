namespace ChatClient.API.Dtos;

public class OrderResponse
{
    public List<OrderDto> Products { get; set; } = [];
    public string? Comment { get; set; }
}

public class OrderWfResponse
{
    public List<OrderResponseDto> Products { get; set; } = [];
    public string? Comment { get; set; }
}