import { MedusaService } from "@medusajs/framework/utils"
import Wishlist from "./models/wishlist"
import WishlistItem from "./models/wishlist-item"

// Generates CRUD methods: createWishlists, retrieveWishlist, listWishlistItems, deleteWishlistItems, ...
class WishlistModuleService extends MedusaService({
  Wishlist,
  WishlistItem,
}) {}

export default WishlistModuleService
