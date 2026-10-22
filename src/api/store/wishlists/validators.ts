import { z } from "@medusajs/framework/zod"
import { StoreAddToCartSchema } from "../add-to-cart/validators"

// Same item payload as add-to-cart, without cart-only fields.
export const StoreAddWishlistItemSchema = StoreAddToCartSchema.omit({
  cart_id: true,
  quantity: true,
}).extend({
  // Omit to start a new wishlist; send the returned wishlist.id on later calls.
  wishlist_id: z.string().optional(),
})

export type StoreAddWishlistItemType = z.infer<typeof StoreAddWishlistItemSchema>

export const StoreMoveToCartSchema = z.object({
  cart_id: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  remove_from_wishlist: z.boolean().default(true),
})

export type StoreMoveToCartType = z.infer<typeof StoreMoveToCartSchema>
