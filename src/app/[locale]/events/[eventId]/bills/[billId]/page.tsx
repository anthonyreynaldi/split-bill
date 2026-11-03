import { BillEditorContainer } from "@/features/bills/containers/bill-editor-container";

export default async function EditBillPage({ params }: PageProps<"/[locale]/events/[eventId]/bills/[billId]">) {
  const { eventId, billId } = await params;
  return <BillEditorContainer eventId={eventId} billId={billId} />;
}
