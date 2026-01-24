using Microsoft.AspNetCore.Http;

namespace Catalog.Application.Common.Interfaces;

public interface IS3Storage
{
    Task RemoveFileAsync(string objName, CancellationToken cancellationToken = default);
    Task<string> UploadFileAsync(IFormFile file, CancellationToken cancellationToken = default);
}