import { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { WISHLIST_MODULE } from "../../../modules/wishlist"
import WishlistModuleService from "../../../modules/wishlist/service"

export function getWishlistService(scope: MedusaContainer) {
  return scope.resolve<WishlistModuleService>(WISHLIST_MODULE)
}

/**
 * Loads a wishlist with its items (newest first). A wishlist owned by a
 * customer is only visible to that customer; guest wishlists are visible to
 * anyone holding the id.
 */
export async function retrieveWishlist(
  scope: MedusaContainer,
  id: string,
  customerId?: string
) {
  const [wishlist] = await getWishlistService(scope).listWishlists(
    { id },
    { relations: ["items"] }
  )

  if (!wishlist || (wishlist.customer_id && wishlist.customer_id !== customerId)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wishlist with id "${id}" not found`
    )
  }

  wishlist.items.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  return wishlist
}
