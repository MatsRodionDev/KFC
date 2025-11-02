using Contracts.Middlewares.Extensions;
using Microsoft.EntityFrameworkCore;
using VenueService.BLL.Hubs;
using VenueService.DAL;
using VenueService.DI;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddPresentationDependencies(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseCustomExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Catalog Service API V1");
    });
    
    await using var scope = app.Services.CreateAsyncScope();
    var context = scope.ServiceProvider.GetRequiredService<VenueDbContext>();
    await context.Database.MigrateAsync();
}

app.MapControllers();

app.MapHub<OrderNotificationHub>("order-hub");

await app.RunAsync();