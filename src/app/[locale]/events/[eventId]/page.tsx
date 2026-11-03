import { EventDetailContainer } from "@/features/events/containers/event-detail-container";

export default async function EventPage({ params }: PageProps<"/[locale]/events/[eventId]">) {
  const { eventId } = await params;
  return <EventDetailContainer eventId={eventId} />;
}
