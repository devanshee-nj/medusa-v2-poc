import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { getWishlistService, retrieveWishlist } from "../../../wishlists/helpers"

// GET /store/customers/me/wishlist - the logged-in customer's wishlist (or null).
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const [wishlist] = await getWishlistService(req.scope).listWishlists({
    customer_id: customerId,
  })

  res.status(200).json({
    wishlist: wishlist
      ? await retrieveWishlist(req.scope, wishlist.id, customerId)
      : null,
  })
}
