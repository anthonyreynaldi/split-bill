"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, Minimize2, RotateCw, ZoomIn, ZoomOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ZOOMS = [1, 1.5, 2, 3, 4];

/**
 * Receipt photo with zoom (fit = 100% of the panel width), 90° rotation and
 * "open full size". Pure view: zoom and rotation are local UI state. The image
 * scrolls inside the panel, so the panel can sit next to (or above) the form.
 */
export function ReceiptViewer(props: {
  src: string;
  alt: string;
  className?: string;
  labels: { zoomIn: string; zoomOut: string; fit: string; rotate: string; openFull: string };
}) {
  const [zoom, setZoom] = useState(0); // index into ZOOMS
  const [turns, setTurns] = useState(0); // quarter turns clockwise
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const rotated = turns % 2 === 1;
  // Rotation doesn't change layout size, so size the box from the image's
  // natural ratio and centre the rotated image inside it.
  const ratio = size ? (rotated ? size.h / size.w : size.w / size.h) : undefined;
  const imgWidth = size && rotated ? `${(size.w / size.h) * 100}%` : "100%";
  const tool = (label: string, onClick: () => void, icon: ReactNode, disabled = false) => (
    <Button type="button" size="icon-xs" variant="ghost" aria-label={label} title={label} disabled={disabled} onClick={onClick}>
      {icon}
    </Button>
  );

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border bg-muted/40", props.className)}>
      <div className="flex items-center gap-0.5 border-b bg-background px-1 py-0.5">
        {tool(props.labels.zoomOut, () => setZoom((z) => z - 1), <ZoomOut />, zoom === 0)}
        <span className="w-10 text-center text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {Math.round(ZOOMS[zoom] * 100)}%
        </span>
        {tool(props.labels.zoomIn, () => setZoom((z) => z + 1), <ZoomIn />, zoom === ZOOMS.length - 1)}
        {tool(props.labels.fit, () => setZoom(0), <Minimize2 />, zoom === 0)}
        {tool(props.labels.rotate, () => setTurns((t) => (t + 1) % 4), <RotateCw />)}
        {/* data: URLs (memory backend) can't be opened as a top-level page */}
        {!props.src.startsWith("data:") && (
          <a
            href={props.src}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={props.labels.openFull}
            title={props.labels.openFull}
            className={cn(buttonVariants({ size: "icon-xs", variant: "ghost" }), "ml-auto")}
          >
            <ExternalLink />
          </a>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto overscroll-contain" data-testid="receipt-scroll">
        <div className="relative mx-auto" style={{ width: `${ZOOMS[zoom] * 100}%`, aspectRatio: ratio }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed / object URL */}
          <img
            src={props.src}
            alt={props.alt}
            draggable={false}
            onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            className={cn("max-w-none select-none", size && "absolute top-1/2 left-1/2")}
            style={{ width: imgWidth, transform: size ? `translate(-50%, -50%) rotate(${turns * 90}deg)` : undefined }}
          />
        </div>
      </div>
    </div>
  );
}
