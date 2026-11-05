import { ChevronDown, Copy, Download, FileSpreadsheet, ImageDown, Loader2, Share2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Excel button + Image menu (copy / share / download). Pure view.
 * Any handler may be omitted; its button or menu item is then hidden.
 */
export function ExportButtons(props: {
  onExcel?: () => void;
  excelPending?: boolean;
  image?: {
    pending: boolean;
    onOpenChange: (open: boolean) => void;
    onDownload: () => void;
    onCopy?: () => void;
    onShare?: () => void;
  };
  labels: { excel: string; image: string; download: string; copy: string; share: string };
}) {
  const img = props.image;
  return (
    <>
      {props.onExcel && (
        <Button variant="outline" size="sm" onClick={props.onExcel} disabled={props.excelPending}>
          {props.excelPending ? <Loader2 className="animate-spin" /> : <FileSpreadsheet />} {props.labels.excel}
        </Button>
      )}
      {img && (
        <DropdownMenu onOpenChange={img.onOpenChange}>
          <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "sm" })} disabled={img.pending}>
            {img.pending ? <Loader2 className="animate-spin" /> : <ImageDown />} {props.labels.image}
            <ChevronDown className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {img.onCopy && (
              <DropdownMenuItem onClick={img.onCopy}>
                <Copy /> {props.labels.copy}
              </DropdownMenuItem>
            )}
            {img.onShare && (
              <DropdownMenuItem onClick={img.onShare}>
                <Share2 /> {props.labels.share}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={img.onDownload}>
              <Download /> {props.labels.download}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
