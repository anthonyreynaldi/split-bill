import { CalendarDays, Receipt, Users } from "lucide-react";
import type { EventListItemDto } from "@/shared/dto";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Grid of event cards. Pure view. */
export function EventList(props: {
  events: EventListItemDto[];
  formatDate: (iso: string) => string;
  labels: { empty: string; people: (n: number) => string; bills: (n: number) => string };
}) {
  if (props.events.length === 0) {
    return <p className="py-8 text-center text-muted-foreground">{props.labels.empty}</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {props.events.map((e) => (
        <Link key={e.id} href={`/events/${e.id}`} className="block">
          <Card className="transition-colors hover:bg-accent">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="truncate">{e.name}</span>
                <Badge variant="secondary">{e.currency}</Badge>
              </CardTitle>
              <CardDescription className="flex flex-wrap gap-x-4 gap-y-1">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {props.labels.people(e.participantCount)}
                </span>
                <span className="flex items-center gap-1">
                  <Receipt className="size-3.5" /> {props.labels.bills(e.billCount)}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> {props.formatDate(e.createdAt)}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
