using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using OrderService.Application.Common.Interfaces;

namespace OrderService.Infrastructure.CvVerification;

/// <summary>
/// HTTP-клиент к Analytics API (Python/FastAPI).
/// Отправляет фото и состав заказа, получает результат CV-верификации.
/// </summary>
public sealed class CvVerificationService(
    HttpClient httpClient,
    ILogger<CvVerificationService> logger) : ICvVerificationService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<CvVerificationResult> VerifyOrderCompletenessAsync(
        Stream imageStream,
        string fileName,
        IEnumerable<OrderItemDto> orderItems,
        CancellationToken cancellationToken = default)
    {
        var itemsJson = JsonSerializer.Serialize(
            orderItems.Select(i => new { name = i.Name, quantity = i.Quantity }),
            JsonOptions);

        using var content = new MultipartFormDataContent();

        var imageContent = new StreamContent(imageStream);
        imageContent.Headers.ContentType = MediaTypeHeaderValue.Parse(
            GetMimeType(fileName));
        content.Add(imageContent, "image", fileName);
        content.Add(new StringContent(itemsJson), "order_items");

        logger.LogInformation(
            "Отправка запроса верификации комплектности. Позиций: {Count}, файл: {File}",
            orderItems.Count(), fileName);

        HttpResponseMessage response;
        try
        {
            response = await httpClient.PostAsync(
                "/order/verify-completeness", content, cancellationToken);
        }
        catch (Exception ex) when (ex is HttpRequestException
                                     || ex is TaskCanceledException
                                     || ex is OperationCanceledException)
        {
            logger.LogError(ex, "CV-сервис недоступен или не ответил вовремя");
            return new CvVerificationResult(
                Verified: false,
                Message: "CV-сервис недоступен. Запустите Analytics API (python start_api.py) и повторите.",
                FoodObjectsDetected: 0,
                ExpectedTotal: 0,
                MissingCount: -1);
        }

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "CV-сервис вернул {Status}: {Body}", response.StatusCode, responseBody);
            return new CvVerificationResult(
                Verified: false,
                Message: $"CV-сервис ответил ошибкой ({(int)response.StatusCode}): {responseBody}",
                FoodObjectsDetected: 0,
                ExpectedTotal: 0,
                MissingCount: -1);
        }

        var dto = JsonSerializer.Deserialize<CvCompletenessResponseDto>(responseBody, JsonOptions)
                  ?? throw new InvalidOperationException("Пустой ответ от CV-сервиса.");

        logger.LogInformation(
            "Верификация заказа: verified={Verified}, detected={Detected}, expected={Expected}",
            dto.Verified, dto.FoodObjectsDetected, dto.ExpectedTotal);

        return new CvVerificationResult(
            Verified: dto.Verified,
            Message: dto.Message,
            FoodObjectsDetected: dto.FoodObjectsDetected,
            ExpectedTotal: dto.ExpectedTotal,
            MissingCount: dto.MissingCount);
    }

    // ── helpers ────────────────────────────────────────────────────────────

    private static string GetMimeType(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            _ => "image/jpeg",
        };

    // ── inner DTO ──────────────────────────────────────────────────────────

    private sealed record CvCompletenessResponseDto(
        bool Verified,
        int FoodObjectsDetected,
        int ExpectedTotal,
        int MissingCount,
        string Message);
}
