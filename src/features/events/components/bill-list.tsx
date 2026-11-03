import { ChevronRight } from "lucide-react";
import type { BillListItemDto } from "@/shared/dto";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";

/** Bills of an event with payer and total. Pure view. */
export function BillList(props: {
  eventId: string;
  bills: BillListItemDto[];
  participantName: (id: string | null) => string | null;
  money: (minor: number) => string;
  date: (iso: string | null) => string;
  labels: { empty: string; paidBy: (name: string) => string; noPayer: string; items: (n: number) => string };
}) {
  if (props.bills.length === 0) {
    return <p className="text-sm text-muted-foreground">{props.labels.empty}</p>;
  }
  return (
    <ul className="divide-y">
      {props.bills.map((b) => {
        const payer = props.participantName(b.paidBy);
        return (
          <li key={b.id}>
            <Link
              href={`/events/${props.eventId}/bills/${b.id}`}
              className="flex items-center gap-3 rounded-md px-1 py-3 hover:bg-accent"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{b.title}</div>
                <div className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                  {b.billDate && <span>{props.date(b.billDate)}</span>}
                  <span>{props.labels.items(b.itemCount)}</span>
                  {payer ? (
                    <span>{props.labels.paidBy(payer)}</span>
                  ) : (
                    <Badge variant="destructive">{props.labels.noPayer}</Badge>
                  )}
                </div>
              </div>
              <span className="font-semibold tabular-nums">{props.money(b.total)}</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
