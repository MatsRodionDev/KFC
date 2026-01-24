using System.ComponentModel.DataAnnotations;

namespace Contracts.Geo;

public class AddressGeocodeResponse
{
    [MaxLength(1024)] [Required] public string Address { get; set; }

    public AddressComponents Components { get; set; }
    public AddressCoordinates Coordinates { get; set; }

    public string Uri { get; set; }
}

public class AddressCoordinates
{
    [Required]
    public double Latitude { get; set; }

    [Required]
    public double Longitude { get; set; }
}

public class AddressComponents
{
    [MaxLength(250)]
    [Required]
    public string Country { get; set; }

    [MaxLength(2)]
    [Required]
    public string CountryCode { get; set; }

    [MaxLength(250)]
    public string Region { get; set; }

    [MaxLength(250)]
    public string City { get; set; }

    [MaxLength(250)]
    public string Street { get; set; }

    [MaxLength(16)]
    public string HouseNumber { get; set; }

    [MaxLength(16)]
    public string PostalCode { get; set; }
}

public class AddressPredictionRequest 
{
    [MinLength(3)]
    [MaxLength(1024)]
    [Required]
    public string Query { get; set; }
    
    public string City { get; set; }
}

public class AddressPredictionResponse
{
    [Required]
    public AddressPrediction[] Predictions { get; set; }

    [Required]
    [Range(0, 50)]
    public int Count { get; set; }
}

public class AddressPrediction
{
    [MaxLength(1024)]
    [Required]
    public string Address { get; set; }

    //public AddressComponents Components { get; set; }
    //public AddressCoordinates Coordinates { get; set; }
    [MaxLength(1024)]
    [Required]
    public StructuredFormatting Structured { get; set; }
    
    public string Uri { get; set; }
}

public class StructuredFormatting
{
    [MaxLength(1024)]
    public string MainText { get; set; }

    [MaxLength(1024)]
    public string SecondaryText { get; set; }
}

public class GeoStoreResponse
{
    public string Address { get; set; }
    
    public double? Distance { get; set; }
    
    public AddressCoordinates Coordinates { get; set; }
}

public record AddStoreAddressRequest(Guid StoreId, [MinLength(3)] string Address);

public class StoreInfo
{
    public Guid StoreId { get; set; }
    public AddressGeocodeResponse Address { get; set; }
}