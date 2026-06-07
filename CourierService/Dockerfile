FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["CourierService.API/CourierService.API.csproj", "CourierService.API/"]
RUN dotnet restore "CourierService.API/CourierService.API.csproj"
COPY . .
WORKDIR "/src/CourierService.API"
RUN dotnet build "CourierService.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CourierService.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CourierService.API.dll"]
