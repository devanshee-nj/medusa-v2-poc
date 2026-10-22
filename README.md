# medusa-v2-poc

Proof of concept for **Medusa v2 (2.18.0)**, built to compare against Vendure. A Storyblok frontend calls the Store API for cart, checkout and wishlist.

## Setup

Requires Node 20+ and PostgreSQL.

```bash
node .yarn/releases/yarn-4.12.0.cjs install
cp .env.template .env        # then set DATABASE_URL and STORE_CORS (frontend origins)
npx medusa db:setup --db medusa_v2
npx medusa user -e admin@example.com -p <password>
npx medusa develop
```

- Admin dashboard: http://localhost:9000/app
- Store API: http://localhost:9000/store/... (needs header `x-publishable-api-key`, found in admin under Settings > Publishable API Keys)

Carts need a **GBP region**. Create one in the admin under Settings > Regions, with country GB and payment provider `pp_system_default`.

No seed/demo data is used.

## Custom Store API

| Method | Path | Purpose |
|---|---|---|
| POST | `/store/add-to-cart` | Add a configured item (SKU, price and options from the frontend). Creates a cart when `cart_id` is omitted. |
| POST | `/store/checkout` | Email, address, test payment and an optional `gift`, then completes the cart into an order. |
| POST | `/store/wishlists/items` | Add an item to a wishlist; creates the wishlist when `wishlist_id` is omitted. |
| GET | `/store/wishlists/:id` | Get a wishlist. |
| DELETE | `/store/wishlists/:id/items/:item_id` | Remove a wishlist item. |
| POST | `/store/wishlists/:id/items/:item_id/move-to-cart` | Move a wishlist item to the cart. |
| GET | `/store/customers/me/wishlist` | Logged-in customer's wishlist. |

## Customizations

- `src/modules/wishlist`: custom wishlist module (guest + customer)
- `src/modules/order-gift` + `src/links/order-gift.ts`: gift message, engraving and gift wrap, linked to the core Order
- `src/workflows/upsert-order-gift.ts`: workflow with rollback
- `src/api/admin/orders/[id]/gift`: admin read/update of gift details
- `src/admin/widgets/order-gift.tsx`: "Gift & engraving" panel on the admin order page

## POC limitations

- Prices come from the frontend and aren't validated on the server.
- Line items are custom (no Medusa product), so there is no inventory tracking and no shipping step.
- Payment is the built-in test provider only, and Redis is not used (in-memory modules).
