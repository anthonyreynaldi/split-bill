import { allocate } from "@/shared/lib/money";
import type { BillItem, Id } from "./types";

/** One participant's part of one item. */
export interface ItemShare {
  participantId: Id;
  /** Portions consumed (even split: qty ÷ people). */
  units: number;
  /** Money share in minor units. */
  amount: number;
}

export interface ItemSplit {
  itemId: Id;
  shares: ItemShare[];
  /** Money not assigned to anyone (custom split with no allocations). */
  unassigned: number;
}

/**
 * Split one item's `total` among participants.
 *
 * - `even`: every participant in `participantIds` gets an equal share.
 * - `custom`: shares are proportional to `allocations[].units`. Allocations
 *   for unknown participants or with units ≤ 0 are ignored.
 * - `per_unit`: see {@link splitPerUnit}.
 *
 * If nobody can receive the item, the whole total is `unassigned`.
 * Invariant: `Σ shares.amount + unassigned === item.total`.
 */
export function splitItem(item: BillItem, participantIds: readonly Id[]): ItemSplit {
  if (item.splitMode === "per_unit") return splitPerUnit(item, participantIds);
  const known = new Set(participantIds);

  const weights: { participantId: Id; units: number }[] =
    item.splitMode === "even"
      ? participantIds.map((participantId) => ({
          participantId,
          units: participantIds.length ? item.qty / participantIds.length : 0,
        }))
      : mergeAllocations(item.allocations.filter((a) => known.has(a.participantId) && a.units > 0));

  if (weights.length === 0 || item.total === 0) {
    return {
      itemId: item.id,
      shares: weights.map((w) => ({ ...w, amount: 0 })),
      unassigned: weights.length === 0 ? item.total : 0,
    };
  }

  const amounts = allocate(
    item.total,
    // even split: equal weights (avoids float noise from qty/n)
    item.splitMode === "even" ? weights.map(() => 1) : weights.map((w) => w.units),
  );
  return {
    itemId: item.id,
    shares: weights.map((w, i) => ({ ...w, amount: amounts[i] })),
    unassigned: 0,
  };
}

/**
 * `per_unit` split: the item's `total` is first divided into `qty` equal unit
 * amounts (largest remainder), then each unit amount is divided equally among
 * the people ticked on that unit (`allocations[].unit`).
 *
 * - `qty` is expected to be a whole number; it is floored (minimum 1) defensively.
 * - A unit with nobody ticked adds its amount to `unassigned`.
 * - Allocations for unknown people, without `unit`, or with `unit ≥ qty` are ignored;
 *   ticking the same person twice on one unit counts once.
 * - `units` on each share is the fraction of units consumed (Σ 1/groupSize), rounded to 4 dp.
 *
 * Example: qty 2, total 60 000, unit 0 → A, B; unit 1 → C, D, E
 * gives A 15 000, B 15 000, C/D/E 10 000 each.
 */
export function splitPerUnit(item: BillItem, participantIds: readonly Id[]): ItemSplit {
  const known = new Set(participantIds);
  const unitCount = Math.max(1, Math.floor(item.qty));

  const groups: Id[][] = Array.from({ length: unitCount }, () => []);
  for (const a of item.allocations) {
    const u = a.unit;
    if (u === undefined || !Number.isInteger(u) || u < 0 || u >= unitCount) continue;
    if (!known.has(a.participantId) || groups[u].includes(a.participantId)) continue;
    groups[u].push(a.participantId);
  }

  const unitAmounts = allocate(item.total, groups.map(() => 1));
  const byId = new Map<Id, { units: number; amount: number }>();
  let unassigned = 0;

  groups.forEach((group, u) => {
    if (group.length === 0) {
      unassigned += unitAmounts[u];
      return;
    }
    const parts = allocate(unitAmounts[u], group.map(() => 1));
    group.forEach((participantId, i) => {
      const acc = byId.get(participantId) ?? { units: 0, amount: 0 };
      acc.units += 1 / group.length;
      acc.amount += parts[i];
      byId.set(participantId, acc);
    });
  });

  return {
    itemId: item.id,
    shares: [...byId].map(([participantId, v]) => ({
      participantId,
      units: Math.round(v.units * 10_000) / 10_000,
      amount: v.amount,
    })),
    unassigned,
  };
}

/** Combine duplicate rows for the same participant, keeping first-seen order. */
function mergeAllocations(list: { participantId: Id; units: number }[]) {
  const byId = new Map<Id, number>();
  for (const a of list) byId.set(a.participantId, (byId.get(a.participantId) ?? 0) + a.units);
  return [...byId].map(([participantId, units]) => ({ participantId, units }));
}
