import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  addConfiguredItemToCart,
  getCart,
} from "../../../../../add-to-cart/add-configured-item"
import { StoreAddToCartSchema } from "../../../../../add-to-cart/validators"
import { getWishlistService, retrieveWishlist } from "../../../../helpers"
import { StoreMoveToCartType } from "../../../../validators"

/**
 * POST /store/wishlists/:id/items/:item_id/move-to-cart
 * Replays the saved item through the same logic as /store/add-to-cart.
 */
export async function POST(
  req: MedusaStoreRequest<StoreMoveToCartType>,
  res: MedusaResponse
) {
  const { id, item_id } = req.params
  const { cart_id, quantity, remove_from_wishlist } = req.validatedBody
  const customerId = req.auth_context?.actor_id

  const wishlist = await retrieveWishlist(req.scope, id, customerId)
  const item = wishlist.items.find((i) => i.id === item_id)
  if (!item) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Item "${item_id}" not found in wishlist "${id}"`
    )
  }

  const cartId = await addConfiguredItemToCart(
    req.scope,
    StoreAddToCartSchema.parse({ ...(item.data as object), cart_id, quantity }),
    {
      salesChannelId: req.publishable_key_context?.sales_channel_ids?.[0],
      customerId,
    }
  )

  if (remove_from_wishlist) {
    await getWishlistService(req.scope).deleteWishlistItems(item.id)
  }

  res.status(200).json({
    cart: await getCart(req.scope, cartId),
    wishlist: await retrieveWishlist(req.scope, id, customerId),
  })
}
