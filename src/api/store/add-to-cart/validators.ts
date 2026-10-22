import { z } from "@medusajs/framework/zod"

export const StoreAddToCartSchema = z.object({
  // Omit to start a new cart; send the returned cart.id on later calls.
  cart_id: z.string().optional(),

  sku: z.string().min(1),
  slug: z.string().min(1),
  quantity: z.number().int().min(1),
  language: z.string().optional(),

  product: z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    imageUrl: z.string().optional(),
    designRef: z.string().optional(),
    category: z.string().optional(),
    subCategory: z.string().optional(),
    ornamentType: z.string().optional(),
  }),

  pricing: z.object({
    price: z.number().positive(),
    listPrice: z.number().positive().optional(),
    currency: z.literal("GBP").optional(),
    discountAmount: z.number().optional(),
    promotionCode: z.string().optional(),
    promotionDescription: z.string().optional(),
    taxRate: z.number().optional(),
    taxAmount: z.number().optional(),
  }),

  selectedOptions: z
    .array(
      z.object({
        featureId: z.string().optional(),
        name: z.string().min(1),
        valueCode: z.string().optional(),
        value: z.string().min(1),
      })
    )
    .optional(),

  metadata: z.record(z.string(), z.unknown()).optional(),
})

export type StoreAddToCartType = z.infer<typeof StoreAddToCartSchema>
