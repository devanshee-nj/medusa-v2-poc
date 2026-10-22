import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { StoreAddToCartSchema } from "./store/add-to-cart/validators"
import {
  OrderGiftSchema,
  StoreCheckoutSchema,
} from "./store/checkout/validators"
import {
  StoreAddWishlistItemSchema,
  StoreMoveToCartSchema,
} from "./store/wishlists/validators"

// Optional: identifies a logged-in customer, but guests are allowed too.
const optionalCustomerAuth = authenticate("customer", ["session", "bearer"], {
  allowUnauthenticated: true,
})

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/add-to-cart",
      method: "POST",
      middlewares: [
        optionalCustomerAuth,
        validateAndTransformBody(StoreAddToCartSchema),
      ],
    },
    {
      matcher: "/store/checkout",
      method: "POST",
      middlewares: [validateAndTransformBody(StoreCheckoutSchema)],
    },
    {
      matcher: "/store/wishlists*",
      middlewares: [optionalCustomerAuth],
    },
    {
      matcher: "/store/wishlists/items",
      method: "POST",
      middlewares: [validateAndTransformBody(StoreAddWishlistItemSchema)],
    },
    {
      matcher: "/store/wishlists/:id/items/:item_id/move-to-cart",
      method: "POST",
      middlewares: [validateAndTransformBody(StoreMoveToCartSchema)],
    },
    {
      matcher: "/store/customers/me/wishlist",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/admin/orders/:id/gift",
      method: "POST",
      middlewares: [validateAndTransformBody(OrderGiftSchema)],
    },
  ],
})
