using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Courier.Controllers;

[Controller]
[Route("api/courier")]
public class CourierController(ApplicationDbContext context) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> CreateCourier([FromBody] CreateCourierRequest  createCourierRequest)
    {
        var isCourierExist = await context.Couriers.AnyAsync(c => c.Id == createCourierRequest.Id);

        if (isCourierExist)
        {
            throw new Exception("Courier already exist");
        }

        var courier = new Courier
        {
            Id = createCourierRequest.Id,
            Name = createCourierRequest.Name,
            PhoneNumber = createCourierRequest.PhoneNumber,
        };
        await context.Couriers.AddAsync(courier);
        await context.SaveChangesAsync();
        
        return Ok(courier);
    }
}

public record CreateCourierRequest(string Id, string Name, string PhoneNumber);
