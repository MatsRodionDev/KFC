using Contracts.Middlewares.Extensions;
using VenueService.BLL.DI;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddBusinessLayerDependencies(builder.Configuration);

var app = builder.Build();

app.UseCustomExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

await app.RunAsync();