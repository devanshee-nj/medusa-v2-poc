import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  completeCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { upsertOrderGiftWorkflow } from "../../../workflows/upsert-order-gift"
import { StoreCheckoutType } from "./validators"

// Medusa's built-in test provider: authorizes immediately, no real money moves.
const PAYMENT_PROVIDER_ID = "pp_system_default"

/**
 * One-call checkout: sets email/addresses, initializes payment and
 * completes the cart, which turns it into an order.
 */
export async function POST(
  req: MedusaStoreRequest<StoreCheckoutType>,
  res: MedusaResponse
) {
  const { cart_id, email, shipping_address, billing_address, gift } =
    req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const getCart = async () => {
    const { data } = await query.graph({
      entity: "cart",
      fields: ["id", "completed_at", "payment_collection.id"],
      filters: { id: cart_id },
    })
    if (!data[0]) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Cart with id "${cart_id}" not found`
      )
    }
    return data[0]
  }

  if ((await getCart()).completed_at) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Cart "${cart_id}" is already completed`
    )
  }

  await updateCartWorkflow(req.scope).run({
    input: {
      id: cart_id,
      email,
      shipping_address,
      billing_address: billing_address ?? shipping_address,
    },
  })

  let paymentCollectionId = (await getCart()).payment_collection?.id
  if (!paymentCollectionId) {
    await createPaymentCollectionForCartWorkflow(req.scope).run({
      input: { cart_id },
    })
    paymentCollectionId = (await getCart()).payment_collection!.id
  }

  await createPaymentSessionsWorkflow(req.scope).run({
    input: {
      payment_collection_id: paymentCollectionId,
      provider_id: PAYMENT_PROVIDER_ID,
    },
  })

  const { result } = await completeCartWorkflow(req.scope).run({
    input: { id: cart_id },
  })

  if (gift) {
    await upsertOrderGiftWorkflow(req.scope).run({
      input: { order_id: result.id, ...gift },
    })
  }

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "status",
      "email",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "discount_total",
      "item_total",
      "created_at",
      // Order totals are only calculated when tax lines and adjustments are loaded.
      "items.*",
      "items.tax_lines.*",
      "items.adjustments.*",
      "items.detail.*",
      "shipping_address.*",
      "billing_address.*",
      "order_gift.*",
    ],
    filters: { id: result.id },
  })

  res.status(200).json({ order: orders[0] })
}
