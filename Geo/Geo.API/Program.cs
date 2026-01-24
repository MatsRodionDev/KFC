using Geo.API.Clients;
using Microsoft.Extensions.Http.Logging;
using Refit;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddRedis(builder.Configuration);
builder.Services.AddSingleton<LoggingHttpMessageHandler>(sp =>
{
    var logger = sp.GetRequiredService<ILogger<LoggingHttpMessageHandler>>();
    return new LoggingHttpMessageHandler(logger);
});

builder.Services
    .AddRefitClient<IYandexGeocoderApi>()
    .ConfigureHttpClient(c =>
    {
        c.BaseAddress = new Uri("https://geocode-maps.yandex.ru/");
    });

var app = builder.Build();

app.MapControllers();
app.MapGet("/", () => "Hello World!");

app.Run();

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddRedis(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<IConnectionMultiplexer>(x =>
        {
            var connectionString = configuration.GetConnectionString("Redis");
            ConnectionMultiplexer? redis = ConnectionMultiplexer.Connect(connectionString);
            return redis;
        });

        services.AddTransient<IDatabaseAsync>(sp =>
        {
            IConnectionMultiplexer connection = sp.GetRequiredService<IConnectionMultiplexer>();
            return connection.GetDatabase();
        });

        return services;
    }
}