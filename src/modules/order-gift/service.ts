import { MedusaService } from "@medusajs/framework/utils"
import OrderGift from "./models/order-gift"

class OrderGiftModuleService extends MedusaService({
  OrderGift,
}) {}

export default OrderGiftModuleService
