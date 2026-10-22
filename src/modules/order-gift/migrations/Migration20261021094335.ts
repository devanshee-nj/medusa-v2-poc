import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261021094335 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "order_gift" ("id" text not null, "gift_message" text null, "engraving_text" text null, "gift_wrap" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "order_gift_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_order_gift_deleted_at" ON "order_gift" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "order_gift" cascade;`);
  }

}
