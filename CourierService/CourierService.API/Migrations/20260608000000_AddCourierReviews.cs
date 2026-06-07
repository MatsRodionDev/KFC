using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CourierService.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourierReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CourierReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CourierId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CourierReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CourierReviews_Couriers_CourierId",
                        column: x => x.CourierId,
                        principalTable: "Couriers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CourierReviews_CourierId",
                table: "CourierReviews",
                column: "CourierId");

            migrationBuilder.CreateIndex(
                name: "IX_CourierReviews_CourierId_OrderId",
                table: "CourierReviews",
                columns: new[] { "CourierId", "OrderId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "CourierReviews");
        }
    }
}
