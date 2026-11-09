"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, ChevronRight, Users } from "lucide-react";
import type { SummaryBillDto, SummaryItemDto } from "@/shared/dto";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceiptViewer } from "@/components/common/receipt-viewer";

type PersonAmount = { participantId: string; units: number; amount: number };

const fmtUnits = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Every bill as the owner set it up: receipt photo, each item with who shares
 * it (and how much each pays), the charges, and each person's total. Pure view,
 * shown on the owner's Summary and on the read-only shared page.
 */
export function BillBreakdown(props: {
  bills: SummaryBillDto[];
  name: (participantId: string) => string;
  money: (minor: number) => string;
  date: (iso: string | null) => string;
}) {
  const t = useTranslations("summary.bills");
  const tp = useTranslations("bills.preview");
  const tr = useTranslations("bills.receipt");
  const tb = useTranslations("bills");
  const { money, name } = props;
  if (props.bills.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {props.bills.map((b) => {
          // who pays what for each item, from the calculated per-person lines
          const byItem = new Map<string, PersonAmount[]>();
          for (const p of b.perPerson) {
            for (const it of p.items) {
              byItem.set(it.itemId, [...(byItem.get(it.itemId) ?? []), { participantId: p.participantId, units: it.units, amount: it.amount }]);
            }
          }
          const charges = [
            ["discount", -b.discount],
            ["service", b.service],
            ["tax", b.tax],
            ["rounding", b.rounding],
          ] as const;

          return (
            <details key={b.id} className="group rounded-lg border" data-testid="bill-breakdown">
              <summary className="flex cursor-pointer list-none items-center gap-2 p-3 [&::-webkit-details-marker]:hidden">
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{b.title}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[b.billDate && props.date(b.billDate), b.paidBy ? t("paidBy", { name: name(b.paidBy) }) : t("noPayer"), t("items", { count: b.items.length })]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <span className="font-semibold tabular-nums">{money(b.total)}</span>
              </summary>

              <div className="space-y-4 border-t p-3">
                {b.imageUrl && (
                  <ReceiptViewer
                    src={b.imageUrl}
                    alt={tb("receiptImage")}
                    className="h-96"
                    labels={{ zoomIn: tr("zoomIn"), zoomOut: tr("zoomOut"), fit: tr("fit"), rotate: tr("rotate"), openFull: tr("openFull") }}
                  />
                )}

                <ul className="divide-y">
                  {b.items.map((it) => (
                    <ItemRow key={it.id} item={it} shares={byItem.get(it.id) ?? []} name={name} money={money} />
                  ))}
                </ul>

                <dl className="space-y-1 border-t pt-3 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <dt>{tp("subtotal")}</dt>
                    <dd className="tabular-nums">{money(b.subtotal)}</dd>
                  </div>
                  {charges
                    .filter(([, v]) => v !== 0)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between text-muted-foreground">
                        <dt>{tp(k)}</dt>
                        <dd className="tabular-nums">{money(v)}</dd>
                      </div>
                    ))}
                  <div className="flex justify-between font-semibold">
                    <dt>{tp("total")}</dt>
                    <dd className="tabular-nums">{money(b.total)}</dd>
                  </div>
                </dl>

                {b.unassigned !== 0 && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertTriangle className="size-4" /> {t("unassigned", { amount: money(b.unassigned) })}
                  </p>
                )}

                <div className="rounded-md bg-muted/50 p-2 text-sm">
                  <div className="mb-1 font-medium">{t("perPerson")}</div>
                  <ul className="grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                    {b.perPerson
                      .filter((p) => p.total !== 0)
                      .map((p) => (
                        <li key={p.participantId} className="flex justify-between gap-2">
                          <span className="truncate">{name(p.participantId)}</span>
                          <span className="tabular-nums">{money(p.total)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </details>
          );
        })}
      </CardContent>
    </Card>
  );
}

/** One item: name, qty × price, total, and who shares it. */
function ItemRow(props: {
  item: SummaryItemDto;
  shares: PersonAmount[];
  name: (id: string) => string;
  money: (minor: number) => string;
}) {
  const t = useTranslations("summary.bills");
  const ts = useTranslations("bills.split"); // same words as the bill editor
  const { item: it, money } = props;
  const mode = it.splitMode === "even" ? ts("even") : it.splitMode === "custom" ? ts("custom") : ts("perUnit");
  const units = it.splitMode === "per_unit" ? groupByUnit(it) : [];

  return (
    <li className="space-y-1.5 py-2" data-testid="breakdown-item">
      <div className="flex items-baseline gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{it.name}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmtUnits(it.qty)} × {money(it.unitPrice)}
        </span>
        <span className="w-24 text-right tabular-nums">{money(it.total)}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="gap-1">
          {it.splitMode === "even" && <Users />} {mode}
        </Badge>
        {props.shares.length === 0 ? (
          <span className="text-xs text-destructive">{t("notAssigned")}</span>
        ) : (
          props.shares.map((s) => (
            <Badge key={s.participantId} variant="secondary" className="font-normal" data-testid="share-chip">
              {props.name(s.participantId)}
              {it.splitMode === "custom" && <span className="text-muted-foreground">×{fmtUnits(s.units)}</span>}
              <span className="tabular-nums">{money(s.amount)}</span>
            </Badge>
          ))
        )}
      </div>
      {units.length > 0 && (
        <ul className="space-y-0.5 pl-1 text-xs text-muted-foreground" data-testid="unit-lines">
          {units.map(([u, ids]) => (
            <li key={u}>
              <span className="font-medium text-foreground">{ts("unit", { n: u + 1 })}</span> {ids.map(props.name).join(", ")}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** per_unit allocations → [[unit, participantIds], …] in unit order. */
function groupByUnit(it: SummaryItemDto): [number, string[]][] {
  const m = new Map<number, string[]>();
  for (const a of it.allocations) {
    if (a.unit == null) continue;
    m.set(a.unit, [...(m.get(a.unit) ?? []), a.participantId]);
  }
  return [...m.entries()].sort(([a], [b]) => a - b);
}
