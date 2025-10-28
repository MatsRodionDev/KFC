using Contracts.Middlewares.Extensions;
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
}

app.MapControllers();

await app.RunAsync();