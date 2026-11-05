"use client";

import { useRef, type ChangeEvent } from "react";
import { Camera, CheckCircle2, ImageUp, Loader2, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type OcrStatus = "ok" | "failed" | "disabled";

const ACCEPT = "image/jpeg,image/png,image/webp";

/**
 * Receipt photo picker + result message. Pure view.
 * - "Take photo" opens the camera (`capture`). Only shown on touch devices,
 *   because desktop browsers ignore `capture` and it would duplicate the other button.
 * - "Choose photo" opens the gallery / file picker (no `capture`).
 */
export function ReceiptUpload(props: {
  onFile: (file: File) => void;
  pending: boolean;
  status: OcrStatus | null;
  labels: {
    takePhoto: string;
    chooseFile: string;
    hint: string;
    reading: string;
    privacy: string;
    status: Record<OcrStatus, string>;
  };
}) {
  const camera = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) props.onFile(f);
    e.target.value = "";
  };

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {props.pending ? (
            <Button type="button" disabled>
              <Loader2 className="animate-spin" /> {props.labels.reading}
            </Button>
          ) : (
            <>
              <Button type="button" className="hidden pointer-coarse:inline-flex" onClick={() => camera.current?.click()}>
                <Camera /> {props.labels.takePhoto}
              </Button>
              <Button type="button" variant="outline" onClick={() => file.current?.click()}>
                <ImageUp /> {props.labels.chooseFile}
              </Button>
            </>
          )}
          <span className="text-sm text-muted-foreground">{props.labels.hint}</span>
          <input
            ref={camera}
            type="file"
            accept={ACCEPT}
            capture="environment"
            className="hidden"
            data-testid="receipt-camera-input"
            onChange={onChange}
          />
          <input ref={file} type="file" accept={ACCEPT} className="hidden" data-testid="receipt-input" onChange={onChange} />
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
