import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { addConfiguredItemToCart, getCart } from "./add-configured-item"
import { StoreAddToCartType } from "./validators"

export async function POST(
  req: MedusaStoreRequest<StoreAddToCartType>,
  res: MedusaResponse
) {
  const cartId = await addConfiguredItemToCart(req.scope, req.validatedBody, {
    salesChannelId: req.publishable_key_context?.sales_channel_ids?.[0],
    customerId: req.auth_context?.actor_id,
  })

  res.status(200).json({ cart: await getCart(req.scope, cartId) })
}
