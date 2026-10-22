import { model } from "@medusajs/framework/utils"

const OrderGift = model.define("order_gift", {
  id: model.id({ prefix: "ogift" }).primaryKey(),
  gift_message: model.text().nullable(),
  engraving_text: model.text().nullable(),
  gift_wrap: model.boolean().default(false),
})

export default OrderGift
