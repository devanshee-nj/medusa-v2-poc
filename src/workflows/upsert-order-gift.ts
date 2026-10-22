import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ORDER_GIFT_MODULE } from "../modules/order-gift"
import OrderGiftModuleService from "../modules/order-gift/service"

export type UpsertOrderGiftInput = {
  order_id: string
  gift_message?: string | null
  engraving_text?: string | null
  gift_wrap?: boolean
}

type Compensation =
  | { created_id: string; order_id: string }
  | { previous: Record<string, unknown> & { id: string } }

/**
 * Creates the order's gift record and links it to the order, or updates the
 * existing one. The compensation function undoes either case if a later step
 * in the workflow fails.
 */
const upsertOrderGiftStep = createStep(
  "upsert-order-gift",
  async (input: UpsertOrderGiftInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const service = container.resolve<OrderGiftModuleService>(ORDER_GIFT_MODULE)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "order_gift.*"],
      filters: { id: input.order_id },
    })
    if (!orders[0]) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order with id "${input.order_id}" not found`
      )
    }

    const { order_id, ...fields } = input
    const existing = (orders[0] as any).order_gift

    if (existing) {
      const updated = await service.updateOrderGifts({ id: existing.id, ...fields })
      return new StepResponse<any, Compensation>(updated, {
        previous: {
          id: existing.id,
          gift_message: existing.gift_message,
          engraving_text: existing.engraving_text,
          gift_wrap: existing.gift_wrap,
        },
      })
    }

    const created = await service.createOrderGifts(fields)
    await link.create({
      [Modules.ORDER]: { order_id },
      [ORDER_GIFT_MODULE]: { order_gift_id: created.id },
    })
    return new StepResponse<any, Compensation>(created, {
      created_id: created.id,
      order_id,
    })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service = container.resolve<OrderGiftModuleService>(ORDER_GIFT_MODULE)

    if ("previous" in compensation) {
      await service.updateOrderGifts(compensation.previous)
      return
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK)
    await link.dismiss({
      [Modules.ORDER]: { order_id: compensation.order_id },
      [ORDER_GIFT_MODULE]: { order_gift_id: compensation.created_id },
    })
    await service.deleteOrderGifts(compensation.created_id)
  }
)

export const upsertOrderGiftWorkflow = createWorkflow(
  "upsert-order-gift",
  (input: UpsertOrderGiftInput) => {
    const gift = upsertOrderGiftStep(input)
    return new WorkflowResponse(gift)
  }
)
