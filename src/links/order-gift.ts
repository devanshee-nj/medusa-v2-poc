import { defineLink } from "@medusajs/framework/utils"
import OrderModule from "@medusajs/medusa/order"
import OrderGiftModule from "../modules/order-gift"

// Links Medusa's core Order to our OrderGift without touching the order tables.
// Queryable as `order.order_gift.*`.
export default defineLink(
  OrderModule.linkable.order,
  OrderGiftModule.linkable.orderGift
)
