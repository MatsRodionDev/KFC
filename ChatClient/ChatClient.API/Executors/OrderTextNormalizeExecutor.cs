using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.Json.Serialization.Metadata;
using Microsoft.Agents.AI;
using Microsoft.Agents.AI.Workflows;
using Microsoft.Agents.AI.Workflows.Reflection;
using Microsoft.Extensions.AI;

namespace ChatClient.API.Executors;

public class OrderTextNormalizeExecutor(AIAgent agent)
    : ReflectingExecutor<OrderTextNormalizeExecutor>("OrderTextNormalizeExecutors"),
        IMessageHandler<string, OrderTextNormalizeResponse>
{
    public async ValueTask<OrderTextNormalizeResponse> HandleAsync(string message, IWorkflowContext context,
        CancellationToken cancellationToken = new CancellationToken())
    {
        var chatMessage = new ChatMessage(ChatRole.User, message);
        var response = await agent.RunAsync(chatMessage, cancellationToken: cancellationToken);
        var result = response.Deserialize<OrderTextNormalizeResponse>(new JsonSerializerOptions()
        {
            PropertyNameCaseInsensitive = true,
            TypeInfoResolver = new DefaultJsonTypeInfoResolver(),
            Converters = { new JsonStringEnumConverter() }
        })!;
        
        if (!result.IsOrderRequest && string.IsNullOrEmpty(result.Message))
            result.Message = message;
        
        return result;
    }
}

public class OrderTextNormalizeResponse
{
    public bool IsOrderRequest { get; set; }
    public string Message { get; set; }
}