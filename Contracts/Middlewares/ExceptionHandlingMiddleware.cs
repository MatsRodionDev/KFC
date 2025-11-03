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

public class ErrorResponse
{
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
    public List<ErrorViewModel> Errors { get; set; } = [];
}

public class ValidationException : Exception
{
    public List<ErrorViewModel> Errors { get; set; }
}

public class ExceptionHandlingMiddleware(ILogger<ExceptionHandlingMiddleware> logger, RequestDelegate next)
{
    private const int ErrorDefaultStatusCode = StatusCodes.Status500InternalServerError;
    private const int ValidationErrorStatusCode = StatusCodes.Status400BadRequest;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException ex)
        {
            await HandleException(context, ex, ErrorCodesConstants.ValidationErrorCode, ValidationErrorStatusCode);
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

        var errorResponse = new ErrorResponse
        {
            ErrorCode = errorCode
        };

        if (ex is ValidationException validationException)
        {
            errorResponse.Message = validationException.Errors.Any() 
                ? validationException.Errors.First().Message
                : validationException.Message;
            errorResponse.Errors = validationException.Errors;
        }
        else
        {
            errorResponse.Message = ex.Message;
        }

        var errorJson = JsonSerializer.Serialize(errorResponse);
        await context.Response.WriteAsync(errorJson);
    }

    private void LogException(HttpContext context, Exception ex)
    {
        logger.LogWarning(ex, "{ExMessage}", ex.Message);
        logger.LogWarning(ex, "Exception in query: {RequestPath}", context.Request.Path);
    }

    private static void SetResponseParameters(HttpContext context, int statusCode)
    {
        context.Response.ContentType = ApiConstants.JsonContentType;
        context.Response.StatusCode = statusCode;
    }
}