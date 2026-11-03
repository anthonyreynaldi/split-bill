import { AlertTriangle } from "lucide-react";
import type { BillCalculation } from "@/domain/bill-calc";
import type { ParticipantDto } from "@/shared/dto";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

/** Live totals for the bill being edited. Pure view. */
export function BillPreview(props: {
  calc: BillCalculation;
  participants: ParticipantDto[];
  money: (minor: number) => string;
  /** Total printed on the receipt (from OCR), to compare with. */
  receiptTotal?: number | null;
  labels: {
    title: string;
    subtotal: string;
    discount: string;
    service: string;
    tax: string;
    total: string;
    perPerson: string;
    unassigned: (amount: string) => string;
    receiptMismatch: (receipt: string) => string;
  };
}) {
  const { calc, money, labels } = props;
  const name = (id: string) => props.participants.find((p) => p.id === id)?.name ?? "?";
  const row = (label: string, value: string, strong = false) => (
    <div className={`flex justify-between ${strong ? "font-semibold" : "text-sm text-muted-foreground"}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );

  return (
    <div className="space-y-3" aria-live="polite">
      <h3 className="font-semibold">{labels.title}</h3>
      <div className="space-y-1">
        {row(labels.subtotal, money(calc.subtotal))}
        {calc.discount > 0 && row(labels.discount, `− ${money(calc.discount)}`)}
        {calc.service > 0 && row(labels.service, money(calc.service))}
        {calc.tax > 0 && row(labels.tax, money(calc.tax))}
        {row(labels.total, money(calc.total), true)}
      </div>
      {props.receiptTotal != null && props.receiptTotal !== calc.total && (
        <Alert>
          <AlertTriangle />
          <AlertDescription>{labels.receiptMismatch(money(props.receiptTotal))}</AlertDescription>
        </Alert>
      )}
      <Separator />
      <h4 className="text-sm font-medium">{labels.perPerson}</h4>
      <ul className="space-y-1">
        {calc.perPerson.map((p) => (
          <li key={p.participantId} className="flex justify-between text-sm">
            <span>{name(p.participantId)}</span>
            <span className="tabular-nums">{money(p.total)}</span>
          </li>
        ))}
      </ul>
      {calc.unassigned !== 0 && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertDescription>{labels.unassigned(money(calc.unassigned))}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
