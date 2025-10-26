namespace Contracts.Shared.Pagination;

public record PagedList<T>(List<T> Items, int PageNumber, int PageSize, int TotalCount);