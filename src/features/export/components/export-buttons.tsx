import { FileSpreadsheet, ImageDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Excel / image buttons. Pure view; either handler may be omitted. */
export function ExportButtons(props: {
  onExcel?: () => void;
  onImage?: () => void;
  excelPending?: boolean;
  imagePending?: boolean;
  labels: { excel: string; image: string };
}) {
  return (
    <>
      {props.onExcel && (
        <Button variant="outline" size="sm" onClick={props.onExcel} disabled={props.excelPending}>
          {props.excelPending ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} {props.labels.excel}
        </Button>
      )}
      {props.onImage && (
        <Button variant="outline" size="sm" onClick={props.onImage} disabled={props.imagePending}>
          {props.imagePending ? <Loader2 className="animate-spin" /> : <ImageDown />} {props.labels.image}
        </Button>
      )}
    </>
  );
}
