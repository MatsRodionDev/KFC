FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Contracts (общий проект)
COPY Contracts/ ./Contracts/

# Сервис
COPY Catalog/ ./Catalog/

RUN dotnet publish Catalog/Catalog.API/Catalog.API.csproj -c Release -o /app/publish --no-self-contained

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "Catalog.API.dll"]
