using Shop.API.Extensions;
using Shop.Application.Common.DependencyInjection;
using Shop.Infrastructure.DependencyInjection;
using Shop.Infrastructure.SignalR;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddInfrastructureLayer(builder.Configuration);
builder.Services.AddApplicationLayer();
builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.AddMigrations();
}
else
{
    app.UseHttpsRedirection();
}

//app.UseCors("AllowAll");

app.MapHub<WorkerHub>("/hubs/worker");

app.UseAuthorization();

app.MapControllers();

app.Run();
