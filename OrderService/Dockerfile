FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Contracts (общий проект)
COPY Contracts/ ./Contracts/

# Сервис
COPY OrderService/ ./OrderService/

RUN dotnet publish OrderService/OrderService.API/OrderService.API.csproj -c Release -o /app/publish --no-self-contained

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "OrderService.API.dll"]
