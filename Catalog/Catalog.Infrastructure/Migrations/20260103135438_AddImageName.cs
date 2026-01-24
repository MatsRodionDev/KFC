using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddImageName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageName",
                table: "Toppings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageName",
                table: "ProductIngredient",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageName",
                table: "Ingredients",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageName",
                table: "DrinkTopping",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImageName",
                table: "Drinks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageName",
                table: "Toppings");

            migrationBuilder.DropColumn(
                name: "ImageName",
                table: "ProductIngredient");

            migrationBuilder.DropColumn(
                name: "ImageName",
                table: "Ingredients");

            migrationBuilder.DropColumn(
                name: "ImageName",
                table: "DrinkTopping");

            migrationBuilder.DropColumn(
                name: "ImageName",
                table: "Drinks");
        }
    }
}
