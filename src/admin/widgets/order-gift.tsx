import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

type Gift = {
  gift_message: string | null
  engraving_text: string | null
  gift_wrap: boolean
}

const EMPTY: Gift = { gift_message: null, engraving_text: null, gift_wrap: false }

const OrderGiftWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [gift, setGift] = useState<Gift | null>(null)
  const [form, setForm] = useState<Gift>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/admin/orders/${order.id}/gift`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setGift(d.gift))
      .finally(() => setLoading(false))
  }, [order.id])

  const startEdit = () => {
    setForm(gift ?? EMPTY)
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/orders/${order.id}/gift`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gift_message: form.gift_message || null,
          engraving_text: form.engraving_text || null,
          gift_wrap: form.gift_wrap,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message)
      }
      setGift(data.gift)
      setEditing(false)
      toast.success("Gift details saved")
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Gift & engraving</Heading>
        {!loading && !editing && (
          <Button size="small" variant="secondary" onClick={startEdit}>
            {gift ? "Edit" : "Add"}
          </Button>
        )}
      </div>

      {loading ? (
        <Text size="small" className="text-ui-fg-subtle px-6 py-4">
          Loading...
        </Text>
      ) : editing ? (
        <div className="flex flex-col gap-y-4 px-6 py-4">
          <div className="flex flex-col gap-y-2">
            <Label size="small">Engraving text (max 50)</Label>
            <Input
              maxLength={50}
              value={form.engraving_text ?? ""}
              onChange={(e) => setForm({ ...form, engraving_text: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label size="small">Gift message (max 500)</Label>
            <Textarea
              maxLength={500}
              value={form.gift_message ?? ""}
              onChange={(e) => setForm({ ...form, gift_message: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-x-2">
            <Switch
              id="gift-wrap"
              checked={form.gift_wrap}
              onCheckedChange={(v) => setForm({ ...form, gift_wrap: v })}
            />
            <Label size="small" htmlFor="gift-wrap">
              Gift wrap
            </Label>
          </div>
          <div className="flex justify-end gap-x-2">
            <Button size="small" variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button size="small" onClick={save} isLoading={saving}>
              Save
            </Button>
          </div>
        </div>
      ) : gift ? (
        <div className="flex flex-col gap-y-3 px-6 py-4">
          <Row label="Engraving" value={gift.engraving_text} />
          <Row label="Gift message" value={gift.gift_message} />
          <Row label="Gift wrap" value={gift.gift_wrap ? "Yes" : "No"} />
        </div>
      ) : (
        <Text size="small" className="text-ui-fg-subtle px-6 py-4">
          No gift details for this order.
        </Text>
      )}
    </Container>
  )
}

const Row = ({ label, value }: { label: string; value: string | null }) => (
  <div className="grid grid-cols-2 items-start gap-x-4">
    <Text size="small" weight="plus" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text size="small" className="whitespace-pre-wrap break-words">
      {value || "-"}
    </Text>
  </div>
)

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderGiftWidget
