using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ChatClient.API.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("09b1e3f5-7b8c-0d2e-4f6a-9b1c3e5f7b8c"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("1a2c4e6f-8c9d-1e3f-5a7b-8c2d4e6f8c9d"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("2b3d5f7a-9d0e-2f4a-6b8c-9d3e5f7a9d0e"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("3c4e6a8b-0e1f-3a5b-7c9d-0e4f6a8b0e1f"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("a3d5e7f9-1b2c-4d6e-8f0a-9b3c5d7e9f01"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("b4e6f8a0-2c3d-5e7f-9a1b-4c6d8e0f2a3b"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("c5f7a9b1-3d4e-6f8a-0b2c-5d7f9a1c3d4e"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("d6f8b0c2-4e5f-7a9b-1c3d-6e8f0b2d4e5f"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("e7f9c1d3-5f6a-8b0c-2d4e-7f9a1c3e5f6a"));

            migrationBuilder.DeleteData(
                table: "Chunks",
                keyColumn: "Id",
                keyValue: new Guid("f8a0d2e4-6a7b-9c1d-3e5f-8a0b2d4f6a7b"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Chunks",
                columns: new[] { "Id", "Embedding1024", "ProductId", "ProductInfoDescription", "ProductInfoId", "ProductInfoName" },
                values: new object[,]
                {
                    { new Guid("09b1e3f5-7b8c-0d2e-4f6a-9b1c3e5f7b8c"), null, new Guid("09b1e3f5-7b8c-0d2e-4f6a-9b1c3e5f7b8c"), "Crispy chicken tenders with fries, coleslaw, and dipping sauce.", new Guid("09b1e3f5-7b8c-0d2e-4f6a-9b1c3e5f7b8c"), "Chicken Basket" },
                    { new Guid("1a2c4e6f-8c9d-1e3f-5a7b-8c2d4e6f8c9d"), null, new Guid("1a2c4e6f-8c9d-1e3f-5a7b-8c2d4e6f8c9d"), "Spicy chicken wings with celery, carrots, and blue cheese dressing.", new Guid("1a2c4e6f-8c9d-1e3f-5a7b-8c2d4e6f8c9d"), "Spicy Chicken Basket" },
                    { new Guid("2b3d5f7a-9d0e-2f4a-6b8c-9d3e5f7a9d0e"), null, new Guid("2b3d5f7a-9d0e-2f4a-6b8c-9d3e5f7a9d0e"), "Pizza with ham, pineapple, mozzarella, and tomato sauce.", new Guid("2b3d5f7a-9d0e-2f4a-6b8c-9d3e5f7a9d0e"), "Hawaiian Pizza" },
                    { new Guid("3c4e6a8b-0e1f-3a5b-7c9d-0e4f6a8b0e1f"), null, new Guid("3c4e6a8b-0e1f-3a5b-7c9d-0e4f6a8b0e1f"), "Plant-based patty with avocado, lettuce, tomato, and vegan mayo.", new Guid("3c4e6a8b-0e1f-3a5b-7c9d-0e4f6a8b0e1f"), "Veggie Burger" },
                    { new Guid("a3d5e7f9-1b2c-4d6e-8f0a-9b3c5d7e9f01"), null, new Guid("a3d5e7f9-1b2c-4d6e-8f0a-9b3c5d7e9f01"), "Classic Italian pizza with tomato sauce, fresh mozzarella, basil leaves, and olive oil. Thin crispy crust and authentic flavor.", new Guid("a3d5e7f9-1b2c-4d6e-8f0a-9b3c5d7e9f01"), "Margherita Pizza" },
                    { new Guid("b4e6f8a0-2c3d-5e7f-9a1b-4c6d8e0f2a3b"), null, new Guid("b4e6f8a0-2c3d-5e7f-9a1b-4c6d8e0f2a3b"), "Spicy pizza with pepperoni slices, double mozzarella cheese, tomato sauce, and Italian herbs.", new Guid("b4e6f8a0-2c3d-5e7f-9a1b-4c6d8e0f2a3b"), "Pepperoni Pizza" },
                    { new Guid("c5f7a9b1-3d4e-6f8a-0b2c-5d7f9a1c3d4e"), null, new Guid("c5f7a9b1-3d4e-6f8a-0b2c-5d7f9a1c3d4e"), "Pizza with grilled chicken, BBQ sauce, red onions, cilantro, and mozzarella cheese.", new Guid("c5f7a9b1-3d4e-6f8a-0b2c-5d7f9a1c3d4e"), "BBQ Chicken Pizza" },
                    { new Guid("d6f8b0c2-4e5f-7a9b-1c3d-6e8f0b2d4e5f"), null, new Guid("d6f8b0c2-4e5f-7a9b-1c3d-6e8f0b2d4e5f"), "Juicy beef patty with cheddar cheese, lettuce, tomato, onion, pickles, and special sauce.", new Guid("d6f8b0c2-4e5f-7a9b-1c3d-6e8f0b2d4e5f"), "Classic Cheeseburger" },
                    { new Guid("e7f9c1d3-5f6a-8b0c-2d4e-7f9a1c3e5f6a"), null, new Guid("e7f9c1d3-5f6a-8b0c-2d4e-7f9a1c3e5f6a"), "Beef burger with crispy bacon, American cheese, caramelized onions, and smoky BBQ sauce.", new Guid("e7f9c1d3-5f6a-8b0c-2d4e-7f9a1c3e5f6a"), "Bacon Burger" },
                    { new Guid("f8a0d2e4-6a7b-9c1d-3e5f-8a0b2d4f6a7b"), null, new Guid("f8a0d2e4-6a7b-9c1d-3e5f-8a0b2d4f6a7b"), "Crispy chicken fillet with spicy mayo, lettuce, tomato, and pickles.", new Guid("f8a0d2e4-6a7b-9c1d-3e5f-8a0b2d4f6a7b"), "Spicy Chicken Burger" }
                });
        }
    }
}
