using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Shop.Domain.DomainEvents;
using Shop.Infrastructure.Persistence;
using System.Collections.Concurrent;
using System.Text.Json;

namespace Shop.Infrastructure.BackgroundServices
{
    public sealed class OutboxProcessingBackgroundService(IServiceProvider serviceProvider) : BackgroundService
    {
        private const int BATCH_SIZE = 100;

        private readonly ConcurrentDictionary<string, Type> _typeDictionary = [];

        protected async override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                using var transaction = await context.Database.BeginTransactionAsync(System.Data.IsolationLevel.ReadCommitted, stoppingToken);

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
                        LIMIT {BATCH_SIZE}
                        """).ToListAsync(stoppingToken);

                    foreach (var outbox in outboxes)
                    {
                        try
                        {
                            var type = _typeDictionary.GetOrAdd(outbox.Type, type =>
                                typeof(DomainEvent).Assembly.GetType(type)!);

                            var domainEvent = JsonSerializer.Deserialize(outbox.Content, type);

                            //Brocker logic
                            Console.WriteLine($"Domain event with id {((DomainEvent)domainEvent!).Id} was processed");

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
