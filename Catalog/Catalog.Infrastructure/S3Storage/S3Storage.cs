using Catalog.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace Catalog.Infrastructure.S3Storage;

public class S3Storage(IMinioClient minioClient, IOptions<MinioOptions> minioOptions) : IS3Storage
{
    private readonly MinioOptions _minioOptions = minioOptions.Value;

    public async Task RemoveFileAsync(string objName, CancellationToken cancellationToken = default)
    {
        await minioClient.RemoveObjectAsync(
            new RemoveObjectArgs()
            .WithBucket(_minioOptions.BucketName)
            .WithObject(objName), 
            cancellationToken);
    }

    public async Task<string> UploadFileAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        var stream = file.OpenReadStream();

        await minioClient.PutObjectAsync(new PutObjectArgs()
            .WithBucket(_minioOptions.BucketName)
            .WithObject(fileName)
            .WithStreamData(stream)
            .WithObjectSize(stream.Length)
            .WithContentType("application/octet-stream"), cancellationToken);

        return fileName;
    }
}
