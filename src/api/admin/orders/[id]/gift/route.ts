import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { OrderGiftSchema } from "../../../../store/checkout/validators"
import { upsertOrderGiftWorkflow } from "../../../../../workflows/upsert-order-gift"

async function getGift(req: AuthenticatedMedusaRequest, orderId: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "order_gift.*"],
    filters: { id: orderId },
  })
  if (!data[0]) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Order with id "${orderId}" not found`
    )
  }
  return (data[0] as any).order_gift ?? null
}

// GET /admin/orders/:id/gift
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  res.status(200).json({ gift: await getGift(req, req.params.id) })
}

// POST /admin/orders/:id/gift
export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof OrderGiftSchema>>,
  res: MedusaResponse
) {
  await upsertOrderGiftWorkflow(req.scope).run({
    input: { order_id: req.params.id, ...req.validatedBody },
  })
  res.status(200).json({ gift: await getGift(req, req.params.id) })
}
