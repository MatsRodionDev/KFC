using System.Text.Json;
using System.Text.Json.Serialization;
using Contracts.Auth.Extensions;
using Contracts.Broker.Extensions;
using Contracts.Mediator;
using Contracts.Mediator.Extensions;
using PaymentService.Clients;
using PaymentService.Configuration;
using PaymentService.Handlers;
using PaymentService.Middleware;
using PaymentService.Services;
using PaymentService.Workers;
using Refit;
using Stripe;
using Stripe.Checkout;
using Temporalio.Client;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services
    .AddCommonMassTransit(builder.Configuration, "PaymentService")
    .AddCommonEventBus();
builder.Services
    .AddMediatorDispatcher()
    .AddScoped<ICommandHandler<CreateSessionCommand, Session>, CreateSessionHandler>()
    .AddScoped<ICommandHandler<ProcessWebhookEventCommand, bool>, ProcessWebhookEventHandler>();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Version = "v1",
        Title = "Payment Service API",
        Description = "Микросервис для работы с платежной системой Stripe. Предоставляет REST API для управления продуктами, платежами, клиентами и обработки webhook'ов.",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Payment Service",
            Email = "support@example.com"
        }
    });

    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (System.IO.File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    options.EnableAnnotations();
});

builder.Services.Configure<StripeOptions>(
    builder.Configuration.GetSection(StripeOptions.SectionName));

builder.Services.Configure<TemporalOptions>(
    builder.Configuration.GetSection(TemporalOptions.SectionName));

var stripeOptions = builder.Configuration.GetSection(StripeOptions.SectionName).Get<StripeOptions>();
if (stripeOptions == null || string.IsNullOrWhiteSpace(stripeOptions.ApiKey))
{
    throw new InvalidOperationException("Stripe API key is not configured. Please set 'Stripe:ApiKey' in appsettings.json");
}

StripeConfiguration.ApiKey = stripeOptions.ApiKey;

var temporalOptions = builder.Configuration.GetSection(TemporalOptions.SectionName).Get<TemporalOptions>();
if (temporalOptions == null)
{
    temporalOptions = new TemporalOptions();
}

builder.Services.AddSingleton<ITemporalClient>(serviceProvider =>
{
    var logger = serviceProvider.GetRequiredService<ILogger<Program>>();
    var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();
    
    logger.LogInformation(
        "Connecting to Temporal server at {Address}, Namespace: {Namespace}",
        temporalOptions.Address,
        temporalOptions.Namespace);

    try
    {
        var client = TemporalClient.ConnectAsync(new(temporalOptions.Address)
        {
            Namespace = temporalOptions.Namespace,
            LoggerFactory = loggerFactory
        }).GetAwaiter().GetResult();
        
        logger.LogInformation("Successfully connected to Temporal server");
        return client;
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to connect to Temporal server at {Address}", temporalOptions.Address);
        throw new InvalidOperationException(
            $"Failed to connect to Temporal server at {temporalOptions.Address}. " +
            "Make sure Temporal server is running.", ex);
    }
});

builder.Services.AddScoped<ProductService>();
builder.Services.AddScoped<PriceService>();
builder.Services.AddScoped<PaymentIntentService>();
builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<SessionService>();

builder.Services.AddScoped<IStripeCustomerService, StripeCustomerService>();
builder.Services.AddScoped<IStripeCheckoutService, StripeCheckoutService>();
builder.Services.AddScoped<IStripeWebhookService, StripeWebhookService>();

builder.Services.AddRefitClient<IOrderServiceClient>(new RefitSettings()
    {
        ContentSerializer = new SystemTextJsonContentSerializer(new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        })
    })
    .ConfigureHttpClient(c => c.BaseAddress = new Uri("http://localhost:5046"));

builder.Services.AddScoped<PaymentService.Activities.SendPaymentEventActivity>();
builder.Services.AddScoped<PaymentService.Activities.SendOrderEventActivity>();
builder.Services.AddScoped<PaymentService.Activities.ExpireCheckoutSessionActivity>();

builder.Services.AddHostedService<TemporalWorkerService>();

builder.Services.AddAuth0Authentication(builder.Configuration);

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Payment Service API v1");
    options.RoutePrefix = string.Empty;
    options.DisplayRequestDuration();
    options.EnableDeepLinking();
    options.EnableFilter();
    options.EnableValidator();
});

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseAuthorization();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();