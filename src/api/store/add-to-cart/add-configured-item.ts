import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  createCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { StoreAddToCartType } from "./validators"

const CURRENCY = "gbp"

export const CART_FIELDS = [
  "id",
  "currency_code",
  "region_id",
  "sales_channel_id",
  "customer_id",
  "metadata",
  "item_total",
  "subtotal",
  "tax_total",
  "discount_total",
  "total",
  "items.id",
  "items.title",
  "items.subtitle",
  "items.thumbnail",
  "items.quantity",
  "items.unit_price",
  "items.compare_at_unit_price",
  "items.is_tax_inclusive",
  "items.product_handle",
  "items.variant_sku",
  "items.variant_title",
  "items.metadata",
  "items.total",
]

export async function getCart(scope: MedusaContainer, cartId: string) {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: CART_FIELDS,
    filters: { id: cartId },
  })
  return data[0]
}

/**
 * Adds a configured (non-catalog) item to a cart, creating a GBP cart when
 * no cart_id is given. Returns the cart id.
 *
 * The item is stored as a custom line item: no Medusa product/variant is
 * required, and the unit price comes from the request. NOTE: the price is
 * trusted as sent by the frontend - validate it server-side before production.
 */
export async function addConfiguredItemToCart(
  scope: MedusaContainer,
  body: StoreAddToCartType,
  context: { salesChannelId?: string; customerId?: string }
): Promise<string> {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)

  if (body.product.designRef && !body.sku.startsWith(body.product.designRef)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `product.designRef "${body.product.designRef}" must match the start of sku "${body.sku}"`
    )
  }

  let cartId = body.cart_id
  let existingItems: any[] = []

  if (cartId) {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "currency_code",
        "items.id",
        "items.variant_id",
        "items.variant_sku",
        "items.unit_price",
        "items.quantity",
      ],
      filters: { id: cartId },
    })
    const cart = carts[0]
    if (!cart) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Cart with id "${cartId}" not found`
      )
    }
    if (cart.currency_code !== CURRENCY) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Cart currency is "${cart.currency_code}", expected "${CURRENCY}"`
      )
    }
    existingItems = cart.items ?? []
  } else {
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id"],
      filters: { currency_code: CURRENCY },
    })
    if (!regions.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "No GBP region configured. Create one in the admin under Settings > Regions."
      )
    }

    const { result } = await createCartWorkflow(scope).run({
      input: {
        region_id: regions[0].id,
        sales_channel_id: context.salesChannelId,
        customer_id: context.customerId,
        metadata: body.language ? { language: body.language } : undefined,
      },
    })
    cartId = result.id
  }

  // Same configured SKU at the same price -> increase quantity instead of adding a new line.
  const existing = existingItems.find(
    (i) =>
      !i.variant_id &&
      i.variant_sku === body.sku &&
      Number(i.unit_price) === body.pricing.price
  )

  if (existing) {
    await updateLineItemInCartWorkflow(scope).run({
      input: {
        cart_id: cartId,
        item_id: existing.id,
        update: { quantity: Number(existing.quantity) + body.quantity },
      },
    })
    return cartId
  }

  const { product, pricing, selectedOptions } = body

  await addToCartWorkflow(scope).run({
    input: {
      cart_id: cartId,
      items: [
        {
          title: product.name,
          subtitle: selectedOptions?.map((o) => o.value).join(", "),
          thumbnail: product.imageUrl,
          quantity: body.quantity,
          unit_price: pricing.price,
          compare_at_unit_price:
            pricing.listPrice && pricing.listPrice > pricing.price
              ? pricing.listPrice
              : undefined,
          is_tax_inclusive: true,
          // Custom items have no shipping profile; Medusa's checkout rejects
          // requires_shipping items without one.
          requires_shipping: false,
          product_title: product.name,
          product_description: product.description,
          product_handle: body.slug,
          variant_sku: body.sku,
          variant_title: selectedOptions
            ?.map((o) => `${o.name}: ${o.value}`)
            .join(" / "),
          metadata: {
            sku: body.sku,
            slug: body.slug,
            language: body.language,
            design_ref: product.designRef,
            category: product.category,
            sub_category: product.subCategory,
            ornament_type: product.ornamentType,
            selected_options: selectedOptions,
            pricing: {
              list_price: pricing.listPrice,
              currency: pricing.currency,
              discount_amount: pricing.discountAmount,
              promotion_code: pricing.promotionCode,
              promotion_description: pricing.promotionDescription,
              tax_rate: pricing.taxRate,
              tax_amount: pricing.taxAmount,
            },
            custom: body.metadata,
          },
        },
      ],
    },
  })

  return cartId
}
