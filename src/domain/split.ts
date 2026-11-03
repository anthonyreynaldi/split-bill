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
 *
 * If nobody can receive the item, the whole total is `unassigned`.
 * Invariant: `Σ shares.amount + unassigned === item.total`.
 */
export function splitItem(item: BillItem, participantIds: readonly Id[]): ItemSplit {
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

/** Combine duplicate rows for the same participant, keeping first-seen order. */
function mergeAllocations(list: { participantId: Id; units: number }[]) {
  const byId = new Map<Id, number>();
  for (const a of list) byId.set(a.participantId, (byId.get(a.participantId) ?? 0) + a.units);
  return [...byId].map(([participantId, units]) => ({ participantId, units }));
}
