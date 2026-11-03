"use client";

import { Users } from "lucide-react";
import type { AllocationInput, ParticipantDto } from "@/shared/dto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type SplitMode = "even" | "custom";

/**
 * Who shares one item. Pure view.
 * - even: everyone in the event pays the same share
 * - custom: tick people and set portions (units). Shares follow the portions.
 */
export function AllocationEditor(props: {
  idPrefix: string;
  participants: ParticipantDto[];
  qty: number;
  splitMode: SplitMode;
  allocations: AllocationInput[];
  onModeChange: (mode: SplitMode) => void;
  onAllocationsChange: (allocations: AllocationInput[]) => void;
  format: (n: number) => string;
  labels: {
    even: string;
    custom: string;
    portions: string;
    assigned: (assigned: string, qty: string) => string;
    nobody: string;
    noPeople: string;
  };
}) {
  const unitsOf = (id: string) => props.allocations.find((a) => a.participantId === id)?.units ?? 0;
  const assigned = props.allocations.reduce((s, a) => s + a.units, 0);

  const setUnits = (participantId: string, units: number) => {
    const rest = props.allocations.filter((a) => a.participantId !== participantId);
    props.onAllocationsChange(units > 0 ? [...rest, { participantId, units }] : rest);
  };

  if (props.participants.length === 0) {
    return <p className="text-xs text-muted-foreground">{props.labels.noPeople}</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1" role="group">
        <Button
          type="button"
          size="xs"
          variant={props.splitMode === "even" ? "default" : "outline"}
          aria-pressed={props.splitMode === "even"}
          onClick={() => props.onModeChange("even")}
        >
          <Users /> {props.labels.even}
        </Button>
        <Button
          type="button"
          size="xs"
          variant={props.splitMode === "custom" ? "default" : "outline"}
          aria-pressed={props.splitMode === "custom"}
          onClick={() => props.onModeChange("custom")}
        >
          {props.labels.custom}
        </Button>
        {props.splitMode === "custom" &&
          (assigned === 0 ? (
            <Badge variant="destructive">{props.labels.nobody}</Badge>
          ) : (
            <Badge variant={assigned === props.qty ? "secondary" : "outline"}>
              {props.labels.assigned(props.format(assigned), props.format(props.qty))}
            </Badge>
          ))}
      </div>

      {props.splitMode === "custom" && (
        <ul className="grid gap-1 sm:grid-cols-2">
          {props.participants.map((p) => {
            const units = unitsOf(p.id);
            const id = `${props.idPrefix}-${p.id}`;
            return (
              <li key={p.id} className="flex items-center gap-2 rounded-md border px-2 py-1">
                <Checkbox
                  id={id}
                  checked={units > 0}
                  onCheckedChange={(checked) => setUnits(p.id, checked ? 1 : 0)}
                />
                <label htmlFor={id} className="flex-1 truncate text-sm">
                  {p.name}
                </label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  className="h-7 w-16"
                  aria-label={`${props.labels.portions} ${p.name}`}
                  value={units || ""}
                  placeholder="0"
                  onChange={(e) => setUnits(p.id, Math.max(0, Number(e.target.value) || 0))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
