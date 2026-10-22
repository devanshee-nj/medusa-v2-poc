import { model } from "@medusajs/framework/utils"
import Wishlist from "./wishlist"

const WishlistItem = model
  .define("wishlist_item", {
    id: model.id({ prefix: "wli" }).primaryKey(),
    sku: model.text(),
    slug: model.text(),
    name: model.text(),
    image_url: model.text().nullable(),
    price: model.bigNumber().nullable(),
    currency_code: model.text().nullable(),
    // Full add-to-cart payload (product, pricing, selectedOptions, ...) so
    // "move to cart" can replay it unchanged.
    data: model.json(),
    wishlist: model.belongsTo(() => Wishlist, { mappedBy: "items" }),
  })
  .indexes([
    {
      on: ["wishlist_id", "sku"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default WishlistItem
