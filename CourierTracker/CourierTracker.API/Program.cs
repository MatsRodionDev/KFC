using Contracts.Broker.Extensions;
using CourierTracker.API.Consumers;
using CourierTracker.API.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddDistributedRedisCache(options => options.Configuration = "localhost:6380");
builder.Services
    .AddCommonMassTransit(builder.Configuration, "courier-tracker", cfg =>
    {
        cfg.AddConsumer<LocationChangedConsumer>();
    });

builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapHub<TrackerHub>("order-tracker");

app.Run();