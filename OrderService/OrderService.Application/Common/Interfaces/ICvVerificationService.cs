namespace OrderService.Application.Common.Interfaces;

/// <summary>
/// Клиент CV-сервиса (Analytics API) для верификации заказов.
/// </summary>
public interface ICvVerificationService
{
    /// <summary>
    /// Проверяет комплектность заказа по фотографии.
    /// </summary>
    /// <param name="imageStream">Поток байт изображения (JPEG/PNG).</param>
    /// <param name="fileName">Имя файла (используется как MIME-hint).</param>
    /// <param name="orderItems">Список позиций заказа для сравнения.</param>
    /// <param name="cancellationToken"></param>
    /// <returns>Результат верификации.</returns>
    Task<CvVerificationResult> VerifyOrderCompletenessAsync(
        Stream imageStream,
        string fileName,
        IEnumerable<OrderItemDto> orderItems,
        CancellationToken cancellationToken = default);
}

/// <summary>Результат проверки CV-сервиса.</summary>
public record CvVerificationResult(
    bool Verified,
    string Message,
    int FoodObjectsDetected,
    int ExpectedTotal,
    int MissingCount);

/// <summary>DTO позиции заказа, отправляемое в CV-сервис.</summary>
public record OrderItemDto(string Name, int Quantity);
