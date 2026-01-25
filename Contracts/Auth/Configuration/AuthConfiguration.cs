namespace Contracts.Auth.Configuration;

public class AuthConfiguration
{
    public const string SectionName = "Auth";
    
    public required string Authority { get; set; }
    public required string Audience { get; set; }
}
