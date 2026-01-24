namespace Catalog.Infrastructure.S3Storage;

public class MinioOptions
{
    public string Endpoint { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;

    public S3Policy PublicBucketPolicy => 
        new ()
        {
            Version = "2012-10-17",
            Statement =
            [
                new Statement
                {
                    Effect = "Allow",
                    Principal = new Principal
                    {
                        AWS = ["*"]
                    },
                    Action =
                    [
                        "s3:GetBucketLocation",
                        "s3:ListBucket",
                        "s3:GetObject"
                    ],
                    Resource =
                    [
                        $"arn:aws:s3:::{BucketName}",
                        $"arn:aws:s3:::{BucketName}/*"
                    ]
                }
            ]
        };
    
}

public class S3Policy
{
    public string Version { get; set; }
    public List<Statement> Statement { get; set; }
}

public class Statement
{
    public string Effect { get; set; }
    public Principal Principal { get; set; }
    public List<string> Action { get; set; }
    public List<string> Resource { get; set; }
}

public class Principal
{
    public List<string> AWS { get; set; } = [];
}