import { NewBillContainer } from "@/features/ocr/containers/new-bill-container";

export default async function NewBillPage({ params }: PageProps<"/[locale]/events/[eventId]/bills/new">) {
  const { eventId } = await params;
  return <NewBillContainer eventId={eventId} />;
}
