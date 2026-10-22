import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { retrieveWishlist } from "../helpers"

// GET /store/wishlists/:id
export async function GET(req: MedusaStoreRequest, res: MedusaResponse) {
  res.status(200).json({
    wishlist: await retrieveWishlist(
      req.scope,
      req.params.id,
      req.auth_context?.actor_id
    ),
  })
}
