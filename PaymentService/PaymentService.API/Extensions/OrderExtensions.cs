using System.Text;
using Contracts.Order;
using PaymentService.Handlers;
using PaymentService.Models;
using PaymentService.Worlflows;
using Stripe.Checkout;

namespace PaymentService.Extensions;

public static class OrderExtensions
{
    public static SessionLineItemOptions ToSessionLineItemOptions(this OrderItem item)
    {
        return new SessionLineItemOptions
        {
            PriceData = new SessionLineItemPriceDataOptions
            {
                Currency = "usd",
                UnitAmount = (long)item.Price * 100,
                ProductData = new SessionLineItemPriceDataProductDataOptions
                {
                    Name = item.Name,
                    Description = item.GetDescription(),
                    Metadata = new Dictionary<string, string>
                    {
                        { "ItemId", item.Id.ToString() }
                    }
                }
            },
            Quantity = item.Quantity
        };
    }

    public static PaymentWorkflowInput ToPaymentWorkflowInput(this Session session, Guid orderId)
    {
        return new PaymentWorkflowInput
        {
            OrderId = orderId,
            SessionId = session.Id,
            CustomerId = session.CustomerId,
            CustomerEmail = session.CustomerEmail,
            AmountTotal = session.AmountTotal ?? 0,
            Currency = session.Currency ?? "usd"
        };
    }
    
    public static CreateCustomOrderRequest ToCreateCustomOrderRequest(this CreateSessionCommand command, List<OrderItem> Items)
    {
        return new CreateCustomOrderRequest
        {
            OrderId = command.OrderId,
            CustomerId = command.CustomerId,
            Items = Items,
            SuccessUrl = command.SuccessUrl,
            CancelUrl = command.CancelUrl
        };
    }

    public static string GetDescription(this OrderItem item)
    {
        var descriptionBuilder = new StringBuilder();
        descriptionBuilder.Append(item.Name);

        if (item.ItemIngredients?.Any() == true)
        {
            descriptionBuilder.Append(" ");
    
            foreach (var ingredient in item.ItemIngredients)
            {
                descriptionBuilder
                    .Append('+')
                    .Append(ingredient.Quantity)
                    .Append(' ')
                    .Append(ingredient.Name)
                    .Append(", ");
            }
            
            if (descriptionBuilder.Length > 0 && 
                descriptionBuilder[descriptionBuilder.Length - 2] == ',' && 
                descriptionBuilder[descriptionBuilder.Length - 1] == ' ')
            {
                descriptionBuilder.Length -= 2;
            }
        }

        return descriptionBuilder.ToString();
    }
}