import { Module } from "@medusajs/framework/utils"
import OrderGiftModuleService from "./service"

export const ORDER_GIFT_MODULE = "order_gift"

export default Module(ORDER_GIFT_MODULE, {
  service: OrderGiftModuleService,
})
