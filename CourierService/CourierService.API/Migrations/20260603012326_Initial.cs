using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourierService.API.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Couriers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Phone = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    IsOnline = table.Column<bool>(type: "boolean", nullable: false),
                    ShownAchievementsJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Couriers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CourierOrders",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourierId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ClientName = table.Column<string>(type: "text", nullable: false),
                    ClientPhone = table.Column<string>(type: "text", nullable: false),
                    AddressA = table.Column<string>(type: "text", nullable: false),
                    AddressB = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    Distance = table.Column<string>(type: "text", nullable: false),
                    PickupLatitude = table.Column<double>(type: "double precision", nullable: false),
                    PickupLongitude = table.Column<double>(type: "double precision", nullable: false),
                    DestinationLatitude = table.Column<double>(type: "double precision", nullable: false),
                    DestinationLongitude = table.Column<double>(type: "double precision", nullable: false),
                    ItemsJson = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourierOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourierOrders_Couriers_CourierId",
                        column: x => x.CourierId,
                        principalTable: "Couriers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourierOrders_CourierId_OrderId",
                table: "CourierOrders",
                columns: new[] { "CourierId", "OrderId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CourierOrders_CourierId_Status",
                table: "CourierOrders",
                columns: new[] { "CourierId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_Phone",
                table: "Couriers",
                column: "Phone",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CourierOrders");

            migrationBuilder.DropTable(
                name: "Couriers");
        }
    }
}
