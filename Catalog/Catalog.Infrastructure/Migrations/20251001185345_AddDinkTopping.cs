using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDinkTopping : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Toppings_Toppings_ToppingId",
                table: "Toppings");

            migrationBuilder.DropIndex(
                name: "IX_Toppings_ToppingId",
                table: "Toppings");

            migrationBuilder.DropColumn(
                name: "ToppingId",
                table: "Toppings");

            migrationBuilder.AddColumn<int[]>(
                name: "AvailableForTypes",
                table: "Toppings",
                type: "integer[]",
                nullable: false,
                defaultValue: new int[0]);

            migrationBuilder.CreateTable(
                name: "DrinkTopping",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false),
                    ToppingId = table.Column<Guid>(type: "uuid", nullable: false),
                    DrinkId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DrinkTopping", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DrinkTopping_Drinks_DrinkId",
                        column: x => x.DrinkId,
                        principalTable: "Drinks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DrinkTopping_DrinkId",
                table: "DrinkTopping",
                column: "DrinkId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DrinkTopping");

            migrationBuilder.DropColumn(
                name: "AvailableForTypes",
                table: "Toppings");

            migrationBuilder.AddColumn<Guid>(
                name: "ToppingId",
                table: "Toppings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Toppings_ToppingId",
                table: "Toppings",
                column: "ToppingId");

            migrationBuilder.AddForeignKey(
                name: "FK_Toppings_Toppings_ToppingId",
                table: "Toppings",
                column: "ToppingId",
                principalTable: "Toppings",
                principalColumn: "Id");
        }
    }
}
