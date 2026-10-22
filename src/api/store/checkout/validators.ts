import { z } from "@medusajs/framework/zod"

const AddressSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().optional(),
  address_1: z.string().optional(),
  address_2: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  province: z.string().optional(),
  country_code: z.string().optional(), // ISO-2, must belong to the cart's region, e.g. "gb"
  phone: z.string().optional(),
})

export const OrderGiftSchema = z.object({
  gift_message: z.string().max(500).nullable().optional(),
  engraving_text: z.string().max(50).nullable().optional(),
  gift_wrap: z.boolean().optional(),
})

export const StoreCheckoutSchema = z.object({
  cart_id: z.string().min(1),
  email: z.string().email(),
  shipping_address: AddressSchema.optional(),
  billing_address: AddressSchema.optional(), // defaults to shipping_address
  gift: OrderGiftSchema.optional(), // stored on the order via the order_gift link
})

export type StoreCheckoutType = z.infer<typeof StoreCheckoutSchema>
