"use client";

import type { ReactNode } from "react";
import { Users } from "lucide-react";
import { isPerUnitQty, type AllocationInput, type ParticipantDto } from "@/shared/dto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export type SplitMode = "even" | "custom" | "per_unit";

/**
 * Who shares one item. Pure view.
 * - even: everyone in the event pays the same share
 * - custom: tick people and set portions (units). Shares follow the portions.
 * - per_unit: one row per unit of the qty; tick who shared each unit.
 *   Each unit's price is split equally among the people ticked on it.
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
    perUnit: string;
    perUnitHint: string;
    unit: (n: number) => string;
    everyone: string;
    portions: string;
    assigned: (assigned: string, qty: string) => string;
    unitsAssigned: (assigned: number, total: number) => string;
    nobody: string;
    noPeople: string;
  };
}) {
  const unitsOf = (id: string) => props.allocations.find((a) => a.participantId === id)?.units ?? 0;
  const assigned = props.allocations.reduce((s, a) => s + a.units, 0);
  const perUnitAllowed = isPerUnitQty(props.qty);

  const setUnits = (participantId: string, units: number) => {
    const rest = props.allocations.filter((a) => a.participantId !== participantId);
    props.onAllocationsChange(units > 0 ? [...rest, { participantId, units }] : rest);
  };

  if (props.participants.length === 0) {
    return <p className="text-xs text-muted-foreground">{props.labels.noPeople}</p>;
  }

  const modeButton = (mode: SplitMode, label: ReactNode, disabled = false) => (
    <Button
      type="button"
      size="xs"
      variant={props.splitMode === mode ? "default" : "outline"}
      aria-pressed={props.splitMode === mode}
      disabled={disabled}
      title={disabled ? props.labels.perUnitHint : undefined}
      onClick={() => props.onModeChange(mode)}
    >
      {label}
    </Button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1" role="group">
        {modeButton(
          "even",
          <>
            <Users /> {props.labels.even}
          </>,
        )}
        {modeButton("custom", props.labels.custom)}
        {modeButton("per_unit", props.labels.perUnit, !perUnitAllowed && props.splitMode !== "per_unit")}
        {props.splitMode === "custom" &&
          (assigned === 0 ? (
            <Badge variant="destructive">{props.labels.nobody}</Badge>
          ) : (
            <Badge variant={assigned === props.qty ? "secondary" : "outline"}>
              {props.labels.assigned(props.format(assigned), props.format(props.qty))}
            </Badge>
          ))}
        {props.splitMode === "per_unit" && perUnitAllowed && (
          <PerUnitBadge qty={props.qty} allocations={props.allocations} labels={props.labels} />
        )}
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

      {props.splitMode === "per_unit" &&
        (perUnitAllowed ? (
          <PerUnitRows
            qty={props.qty}
            participants={props.participants}
            allocations={props.allocations}
            onAllocationsChange={props.onAllocationsChange}
            labels={props.labels}
          />
        ) : (
          <p className="text-xs text-destructive">{props.labels.perUnitHint}</p>
        ))}
    </div>
  );
}

const peopleOnUnit = (allocations: AllocationInput[], unit: number) =>
  new Set(allocations.filter((a) => a.unit === unit).map((a) => a.participantId));

function PerUnitBadge(props: {
  qty: number;
  allocations: AllocationInput[];
  labels: { unitsAssigned: (assigned: number, total: number) => string };
}) {
  const filled = Array.from({ length: props.qty }, (_, u) => peopleOnUnit(props.allocations, u).size > 0).filter(
    Boolean,
  ).length;
  return (
    <Badge variant={filled === props.qty ? "secondary" : "destructive"}>
      {props.labels.unitsAssigned(filled, props.qty)}
    </Badge>
  );
}

/** One row per unit; each row toggles who shared that unit. */
function PerUnitRows(props: {
  qty: number;
  participants: ParticipantDto[];
  allocations: AllocationInput[];
  onAllocationsChange: (allocations: AllocationInput[]) => void;
  labels: { unit: (n: number) => string; everyone: string };
}) {
  const setUnitPeople = (unit: number, ids: Set<string>) => {
    const rest = props.allocations.filter((a) => a.unit !== unit);
    const rows = props.participants.filter((p) => ids.has(p.id)).map((p) => ({ participantId: p.id, units: 1, unit }));
    props.onAllocationsChange([...rest, ...rows].sort((a, b) => (a.unit ?? 0) - (b.unit ?? 0)));
  };

  return (
    <ul className="space-y-1">
      {Array.from({ length: props.qty }, (_, unit) => {
        const on = peopleOnUnit(props.allocations, unit);
        const all = props.participants.every((p) => on.has(p.id));
        return (
          <li key={unit} className="flex flex-wrap items-center gap-1 rounded-md border px-2 py-1" role="group" aria-label={props.labels.unit(unit + 1)}>
            <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{props.labels.unit(unit + 1)}</span>
            {props.participants.map((p) => {
              const pressed = on.has(p.id);
              return (
                <Button
                  key={p.id}
                  type="button"
                  size="xs"
                  variant={pressed ? "secondary" : "ghost"}
                  className={pressed ? "ring-1 ring-primary" : "text-muted-foreground"}
                  aria-pressed={pressed}
                  onClick={() => {
                    const next = new Set(on);
                    if (pressed) next.delete(p.id);
                    else next.add(p.id);
                    setUnitPeople(unit, next);
                  }}
                >
                  {p.name}
                </Button>
              );
            })}
            <Button
              type="button"
              size="xs"
              variant="link"
              className="ml-auto"
              onClick={() => setUnitPeople(unit, all ? new Set() : new Set(props.participants.map((p) => p.id)))}
            >
              <Users /> {props.labels.everyone}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
