using System.Collections.Concurrent;
using System.Text.Json;
using Contracts.Broker.EventBus;
using Contracts.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Catalog.Infrastructure.Persistence.OutboxPattern
{
    public sealed class OutboxProcessingBackgroundService(IServiceProvider serviceProvider,
        IEventBus eventBus) : BackgroundService
    {
        private const int BatchSize = 100;

        private readonly ConcurrentDictionary<string, Type> _typeDictionary = [];

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await using var transaction = await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted, stoppingToken);

                try
                {
                    var outboxes = await context.Outboxes
                        .FromSqlInterpolated(
                        $"""
                        SELECT *
                        FROM "Outboxes"
                        WHERE "ProcessedAt" IS NULL
                        ORDER BY "CreatedAt"
                        FOR UPDATE
                        SKIP LOCKED
                        LIMIT {BatchSize}
                        """).ToListAsync(stoppingToken);

                    foreach (var outbox in outboxes)
                    {
                        try
                        {
                            var type = _typeDictionary.GetOrAdd(outbox.Type, type =>
                                typeof(IEvent).Assembly.GetType(type)!);

                            var serviceEvent = JsonSerializer.Deserialize(outbox.Content, type);

                            if (serviceEvent is null)
                            {
                                throw new InvalidOperationException($"Outbox {outbox.Type} was not found");
                            }

                            await eventBus.PublishAsync(serviceEvent, stoppingToken);

                            outbox.ProcessedAt = DateTime.UtcNow;
                        }
                        catch (Exception ex)
                        {
                            outbox.Error = ex.Message;
                        }
                    }

                    context.Outboxes.UpdateRange(outboxes);

                    await context.SaveChangesAsync(stoppingToken);
                    await transaction.CommitAsync(stoppingToken);
                }
                catch(Exception)
                {
                    await transaction.RollbackAsync(stoppingToken);
                }

                await Task.Delay(10000, stoppingToken);
            }
        }
    }
}
