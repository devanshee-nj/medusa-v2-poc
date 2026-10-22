import { model } from "@medusajs/framework/utils"
import WishlistItem from "./wishlist-item"

const Wishlist = model.define("wishlist", {
  id: model.id({ prefix: "wl" }).primaryKey(),
  // Null for guest wishlists; set once a logged-in customer uses it.
  customer_id: model.text().nullable(),
  items: model.hasMany(() => WishlistItem, { mappedBy: "wishlist" }),
}).cascades({
  delete: ["items"],
})

export default Wishlist
