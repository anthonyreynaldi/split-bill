import { NewBillContainer } from "@/features/ocr/containers/new-bill-container";

/**
 * Server Actions on this page include `uploadReceipt`, which may try up to 3
 * OpenRouter models × 25 s (see providers/ocr/openrouter.ts). Raise the
 * platform's function time limit so retries aren't cut off.
 */
export const maxDuration = 90;

export default async function NewBillPage({ params }: PageProps<"/[locale]/events/[eventId]/bills/new">) {
  const { eventId } = await params;
  return <NewBillContainer eventId={eventId} />;
}
