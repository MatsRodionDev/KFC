﻿namespace Catalog.Infrastructure.Persistence.Outbox
{
    public sealed class Outbox
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Type { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public string Error { get; set; } = string.Empty;
    }
}
