using ChatClient.API.Dtos;
using Microsoft.Agents.AI.Workflows;
using Microsoft.Agents.AI.Workflows.Reflection;

namespace ChatClient.API.Executors;

public class IncorrectOrderResponseExecutor() : ReflectingExecutor<IncorrectOrderResponseExecutor>("IncorrectOrderResponseExecutor"),
    IMessageHandler<OrderTextNormalizeResponse, OrderResponse>
{
    public ValueTask<OrderResponse> HandleAsync(OrderTextNormalizeResponse message, IWorkflowContext context,
        CancellationToken cancellationToken = new CancellationToken())
    {
        var messageResponse = $"""
                               Выша запрос "{message.Message}" не был идентифицирован как заказ.
                               Пожалуйста, уточните запрос.
                               """;
        var response = new OrderResponse { Comment = messageResponse, Products = [] };
        return new ValueTask<OrderResponse>(response);
    }
}