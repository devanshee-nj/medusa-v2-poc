import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { getWishlistService, retrieveWishlist } from "../../../helpers"

// DELETE /store/wishlists/:id/items/:item_id
export async function DELETE(req: MedusaStoreRequest, res: MedusaResponse) {
  const { id, item_id } = req.params
  const customerId = req.auth_context?.actor_id

  const wishlist = await retrieveWishlist(req.scope, id, customerId)
  if (!wishlist.items.some((i) => i.id === item_id)) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Item "${item_id}" not found in wishlist "${id}"`
    )
  }

  await getWishlistService(req.scope).deleteWishlistItems(item_id)

  res.status(200).json({
    wishlist: await retrieveWishlist(req.scope, id, customerId),
  })
}
