using Contracts.Auth.Extensions;
using Contracts.Middlewares.Extensions;
using Microsoft.EntityFrameworkCore;
using OrderService.Application.Common;
using OrderService.Infrastructure;
using OrderService.Infrastructure.Hubs;
using OrderService.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services
    .AddInfrastructure(builder.Configuration)
    .AddApplicationLayer();

builder.Services.AddAuth0Authentication(builder.Configuration);

var app = builder.Build();

app.UseCustomExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Order Service API V1");
    });
    
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();
}

app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapHub<OrderStatusHub>("order-status");

await app.RunAsync();
