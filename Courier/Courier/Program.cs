using Contracts.Broker.Extensions;
using Contracts.Middlewares.Extensions;
using Courier;
using Courier.Consumers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args); 

builder.Services.AddControllers();
builder.Services.AddDbContext<ApplicationDbContext>(options
    =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(nameof(ApplicationDbContext))
    );
});
builder.Services.AddSwaggerGen();

builder.Services
    .AddCommonEventBus()
    .AddCommonMassTransit(builder.Configuration, "courier-service", cfg =>
    {
        cfg.AddConsumer<SendOrderToCourierConsumer>();
        cfg.AddConsumer<OrderReadyConsumer>();
    });

var app = builder.Build();

app.UseCustomExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Catalog Service API V1");
    });
    
    using var serviceScope =  app.Services.CreateScope();
    var context = serviceScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.EnsureCreatedAsync();
}

app.MapControllers();
app.MapGet("/", () => "Hello World!");

app.Run();
