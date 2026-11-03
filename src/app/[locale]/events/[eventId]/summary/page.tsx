import { SummaryContainer } from "@/features/summary/containers/summary-container";

export default async function SummaryPage({ params }: PageProps<"/[locale]/events/[eventId]/summary">) {
  const { eventId } = await params;
  return <SummaryContainer eventId={eventId} />;
}
