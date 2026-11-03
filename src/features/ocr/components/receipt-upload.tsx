"use client";

import { useRef } from "react";
import { Camera, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type OcrStatus = "ok" | "failed" | "disabled";

/** "Upload receipt photo" box + result message. Pure view. */
export function ReceiptUpload(props: {
  onFile: (file: File) => void;
  pending: boolean;
  status: OcrStatus | null;
  labels: { upload: string; hint: string; reading: string; privacy: string; status: Record<OcrStatus, string> };
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={() => input.current?.click()} disabled={props.pending}>
            {props.pending ? <Loader2 className="animate-spin" /> : <Camera />}
            {props.pending ? props.labels.reading : props.labels.upload}
          </Button>
          <span className="text-sm text-muted-foreground">{props.labels.hint}</span>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            data-testid="receipt-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) props.onFile(f);
              e.target.value = "";
            }}
          />
        </div>
        {props.status && (
          <Alert variant={props.status === "ok" ? "default" : "destructive"}>
            {props.status === "ok" ? <CheckCircle2 /> : <TriangleAlert />}
            <AlertDescription>{props.labels.status[props.status]}</AlertDescription>
          </Alert>
        )}
        <p className="text-xs text-muted-foreground">{props.labels.privacy}</p>
      </CardContent>
    </Card>
  );
}
