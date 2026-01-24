using ChatClient.API.Clients;
using ChatClient.API.Dtos;
using ChatClient.API.Executors;
using ChatClient.API.Factories;
using Contracts.Cache;
using Microsoft.Agents.AI.Workflows;
using Microsoft.AspNetCore.Mvc;
using static Microsoft.Agents.AI.Workflows.InProcessExecution;

namespace ChatClient.API.Controllers;

[Controller]
[Route("api/workflows")]
public class WorkFlowController(Workflow workflow) : ControllerBase
{
    [HttpPost("start")]
    public async Task<IActionResult> StartWorkFlow([FromBody] string request, CancellationToken cancellationToken)
    {
        var workflowResult = await RunAsync(workflow, request, 
            cancellationToken: cancellationToken);
        
        var result = workflowResult.OutgoingEvents
            .OfType<WorkflowOutputEvent>()
            .FirstOrDefault()?.Data;
        
        return Ok(result);
    }
}