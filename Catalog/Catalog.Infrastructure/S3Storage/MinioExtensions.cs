using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;

namespace Catalog.Infrastructure.S3Storage;

public static class MinioExtensions
{
    public static async Task<bool> CreateBucketIfNotExist(this IMinioClient minioClient, Func<MinioOptions> minioOptions)
    {
        var options = minioOptions();

        return await minioClient.CreateBucketIfNotExist(options);
    }

    public static async Task<bool> CreateBucketIfNotExist(this IMinioClient minioClient, MinioOptions options)
    {
        var isBuckExists = await minioClient
            .BucketExistsAsync(new BucketExistsArgs()
                .WithBucket(options.BucketName));
        
        if (isBuckExists)
        {
            return false;
        }

        await minioClient.MakeBucketAsync(new MakeBucketArgs()
            .WithBucket(options.BucketName));
        
        var args = new SetPolicyArgs()
            .WithBucket(options.BucketName)
            .WithPolicy(JsonSerializer.Serialize(options.PublicBucketPolicy));
        await minioClient.SetPolicyAsync(args);
        
        return true;
    }
}