namespace OrderService.Infrastructure.Workflows;

public class TemporalOptions
{
    public const string SectionName = "Temporal";

    public string Address { get; set; } = "localhost:7233";
    public string Namespace { get; set; } = "default";
    public string TaskQueue { get; set; } = "order-workflow-broker";
}