"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { SummaryDto, TransferDto } from "@/shared/dto";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type SettlementMode = SummaryDto["event"]["settlementMode"];

/**
 * The whole summary: who pays whom, per-person totals and item details.
 * Pure view, used by the owner page AND the public share page (read-only).
 * `onCaptureEl` receives the element that is exported as an image.
 */
export function SummaryView({ onCaptureEl, ...props }: {
  summary: SummaryDto;
  mode: SettlementMode;
  onModeChange: (mode: SettlementMode) => void;
  money: (minor: number) => string;
  date: (iso: string | null) => string;
  actions?: ReactNode;
  onCaptureEl?: (el: HTMLDivElement | null) => void;
}) {
  const t = useTranslations("summary");
  const { summary: s, money } = props;
  const name = (id: string) => s.participants.find((p) => p.id === id)?.name ?? "?";
  const billTitle = (id?: string) => s.bills.find((b) => b.id === id)?.title ?? "";
  const transfers = props.mode === "nett" ? s.nettTransfers : s.perBillTransfers;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={props.mode} onValueChange={(v) => props.onModeChange(v as SettlementMode)}>
          <TabsList>
            <TabsTrigger value="nett">{t("mode.nett")}</TabsTrigger>
            <TabsTrigger value="per_bill">{t("mode.perBill")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-1 flex-wrap justify-end gap-2">{props.actions}</div>
      </div>

      <div ref={onCaptureEl} className="space-y-4 bg-muted/30 p-1">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-2xl font-semibold">{s.event.name}</h1>
          <span className="text-sm text-muted-foreground">
            {t("grandTotal")}: <strong className="text-foreground tabular-nums">{money(s.grandTotal)}</strong>
          </span>
        </div>

        {s.billsWithoutPayer.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>
              {t("warnNoPayer", { bills: s.billsWithoutPayer.map((id) => billTitle(id)).join(", ") })}
            </AlertDescription>
          </Alert>
        )}
        {s.unassigned !== 0 && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{t("warnUnassigned", { amount: money(s.unassigned) })}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("transfers")}</CardTitle>
            <p className="text-sm text-muted-foreground">{props.mode === "nett" ? t("mode.nettHint") : t("mode.perBillHint")}</p>
          </CardHeader>
          <CardContent>
            <TransferList transfers={transfers} name={name} billTitle={billTitle} money={money} empty={t("settled")} />
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2">
          {s.people.map((p) => (
            <Card key={p.participantId} size="sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{name(p.participantId)}</span>
                  <Badge variant={p.balance > 0 ? "default" : p.balance < 0 ? "destructive" : "secondary"}>
                    {p.balance > 0
                      ? t("getsBack", { amount: money(p.balance) })
                      : p.balance < 0
                        ? t("owes", { amount: money(-p.balance) })
                        : t("even")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("consumed")}</span>
                  <span className="tabular-nums">{money(p.owed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("paid")}</span>
                  <span className="tabular-nums">{money(p.paid)}</span>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-primary">{t("details")}</summary>
                  <div className="mt-2 space-y-2">
                    {s.bills.map((b) => {
                      const mine = b.perPerson.find((x) => x.participantId === p.participantId);
                      if (!mine) return null;
                      return (
                        <div key={b.id} className="rounded-md border p-2">
                          <div className="flex justify-between font-medium">
                            <span className="truncate">{b.title}</span>
                            <span className="tabular-nums">{money(mine.total)}</span>
                          </div>
                          <ul className="text-muted-foreground">
                            {mine.items.map((it) => (
                              <li key={it.itemId} className="flex justify-between gap-2">
                                <span className="truncate">
                                  {it.name} <span className="text-xs">×{Math.round(it.units * 100) / 100}</span>
                                </span>
                                <span className="tabular-nums">{money(it.amount)}</span>
                              </li>
                            ))}
                            {mine.service + mine.tax - mine.discount + mine.rounding !== 0 && (
                              <li className="flex justify-between gap-2">
                                <span>{t("charges")}</span>
                                <span className="tabular-nums">{money(mine.service + mine.tax - mine.discount + mine.rounding)}</span>
                              </li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransferList(props: {
  transfers: TransferDto[];
  name: (id: string) => string;
  billTitle: (id?: string) => string;
  money: (n: number) => string;
  empty: string;
}) {
  if (props.transfers.length === 0) return <p className="text-sm text-muted-foreground">{props.empty}</p>;
  return (
    <ul className="divide-y">
      {props.transfers.map((x, i) => (
        <li key={i} className="flex items-center gap-2 py-2">
          <span className="font-medium">{props.name(x.from)}</span>
          <ArrowRight className="size-4 text-muted-foreground" />
          <span className="flex-1 font-medium">{props.name(x.to)}</span>
          {x.billId && <span className="hidden text-xs text-muted-foreground sm:inline">{props.billTitle(x.billId)}</span>}
          <span className="font-semibold tabular-nums">{props.money(x.amount)}</span>
        </li>
      ))}
    </ul>
  );
}
