using System.Text.Json;
using Contracts.Shared.Constants;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace Contracts.Middlewares;

public class ErrorViewModel
{
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }

}
public class ExceptionHandlingMiddleware(ILogger<ExceptionHandlingMiddleware> logger, RequestDelegate next)
{
    private const int ErrorDefaultStatusCode = StatusCodes.Status500InternalServerError;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleException(context, ex, ErrorCodesConstants.InternalServerErrorCode, ErrorDefaultStatusCode);
        }
    }

    private async Task HandleException(HttpContext context, Exception ex, string errorCode, int statusCode)
    {
        SetResponseParameters(context, statusCode);
        LogException(context, ex);

        var errorViewModel = new ErrorViewModel
        {
            ErrorCode = errorCode,
            Message = ex.Message
        };

        var errorJson = JsonSerializer.Serialize(errorViewModel);
        await context.Response.WriteAsync(errorJson);
    }

    private void LogException(HttpContext context, Exception ex)
    {
        logger.LogWarning(ex, $"{ex.Message}");
        logger.LogWarning(ex, $"Exception in query: {context.Request.Path}");
    }

    private static void SetResponseParameters(HttpContext context, int statusCode)
    {
        context.Response.ContentType = ApiConstants.JsonContentType;
        context.Response.StatusCode = statusCode;
    }
}