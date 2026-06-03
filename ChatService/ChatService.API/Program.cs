using ChatService.API.Hubs;
using ChatService.API.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddDbContext<ChatDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("ChatDb")));

builder.Services.AddSignalR()
    .AddJsonProtocol(opt =>
    {
        opt.PayloadSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddCors(opt =>
{
    opt.AddDefaultPolicy(policy =>
    {
        policy
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();

        if (builder.Environment.IsDevelopment())
        {
            // Dev: Vite, Expo Go, courier-app по LAN (192.168.x.x)
            policy.SetIsOriginAllowed(_ => true);
        }
        else
        {
            policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8081",
                "http://localhost:19006");
        }
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    // Автомиграция при старте
    using var scope = app.Services.CreateScope();
    var ctx = scope.ServiceProvider.GetRequiredService<ChatDbContext>();
    await ctx.Database.MigrateAsync();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();

// WebSocket-хаб для чата
app.MapHub<ChatHub>("/hubs/chat");

await app.RunAsync();
