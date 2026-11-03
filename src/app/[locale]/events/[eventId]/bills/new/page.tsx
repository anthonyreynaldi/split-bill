import { BillEditorContainer } from "@/features/bills/containers/bill-editor-container";

export default async function NewBillPage({ params }: PageProps<"/[locale]/events/[eventId]/bills/new">) {
  const { eventId } = await params;
  return <BillEditorContainer eventId={eventId} billId={null} />;
}
