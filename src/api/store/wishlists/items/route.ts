import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { getWishlistService, retrieveWishlist } from "../helpers"
import { StoreAddWishlistItemType } from "../validators"

/**
 * POST /store/wishlists/items
 * Adds an item to a wishlist, creating the wishlist when no wishlist_id is
 * given. Adding a SKU that is already saved updates it instead of duplicating.
 */
export async function POST(
  req: MedusaStoreRequest<StoreAddWishlistItemType>,
  res: MedusaResponse
) {
  const service = getWishlistService(req.scope)
  const customerId = req.auth_context?.actor_id
  const { wishlist_id, ...item } = req.validatedBody

  if (item.product.designRef && !item.sku.startsWith(item.product.designRef)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `product.designRef "${item.product.designRef}" must match the start of sku "${item.sku}"`
    )
  }

  let wishlist = wishlist_id
    ? await retrieveWishlist(req.scope, wishlist_id, customerId)
    : undefined

  // Logged-in customers without an id get their existing wishlist.
  if (!wishlist && customerId) {
    ;[wishlist] = await service.listWishlists(
      { customer_id: customerId },
      { relations: ["items"] }
    )
  }

  if (!wishlist) {
    wishlist = await service.createWishlists({ customer_id: customerId ?? null })
    wishlist.items = []
  } else if (customerId && !wishlist.customer_id) {
    // A guest wishlist used while logged in becomes the customer's.
    await service.updateWishlists({ id: wishlist.id, customer_id: customerId })
  }

  const fields = {
    sku: item.sku,
    slug: item.slug,
    name: item.product.name,
    image_url: item.product.imageUrl ?? null,
    price: item.pricing.price,
    currency_code: "gbp",
    data: item as Record<string, unknown>,
  }

  const existing = wishlist.items.find((i) => i.sku === item.sku)
  if (existing) {
    await service.updateWishlistItems({ id: existing.id, ...fields })
  } else {
    await service.createWishlistItems({ ...fields, wishlist_id: wishlist.id })
  }

  res.status(200).json({
    wishlist: await retrieveWishlist(req.scope, wishlist.id, customerId),
  })
}
