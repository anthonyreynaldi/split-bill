"use client";

import { useState } from "react";
import { Check, Copy, Lock, LockOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Owner's share settings. Pure view (local state is only the passcode being typed / "copied" flash). */
export function SharePanel(props: {
  url: string | null;
  enabled: boolean;
  hasPasscode: boolean;
  pending: boolean;
  onCreate: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onSetPasscode: (passcode: string) => void;
  onRemovePasscode: () => void;
  labels: {
    create: string; intro: string; enabled: string; copy: string; copied: string;
    passcode: string; passcodeOn: string; passcodeOff: string; setPasscode: string; removePasscode: string; passcodeHint: string;
  };
}) {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const l = props.labels;

  if (!props.url) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{l.intro}</p>
        <Button onClick={props.onCreate} disabled={props.pending}>{l.create}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Checkbox id="share-enabled" checked={props.enabled} onCheckedChange={(c) => props.onEnabledChange(!!c)} />
        <Label htmlFor="share-enabled">{l.enabled}</Label>
      </div>
      <div className="flex gap-2">
        <Input readOnly value={props.url} aria-label="URL" onFocus={(e) => e.target.select()} disabled={!props.enabled} />
        <Button
          variant="outline"
          disabled={!props.enabled}
          onClick={async () => {
            await navigator.clipboard?.writeText(props.url!).catch(() => undefined);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check /> : <Copy />} {copied ? l.copied : l.copy}
        </Button>
      </div>
      <div className="space-y-2 rounded-md border p-3">
        <div className="flex items-center gap-2">
          <Label className="flex-1">{l.passcode}</Label>
          <Badge variant={props.hasPasscode ? "default" : "secondary"}>
            {props.hasPasscode ? <Lock /> : <LockOpen />} {props.hasPasscode ? l.passcodeOn : l.passcodeOff}
          </Badge>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim().length >= 4) props.onSetPasscode(code.trim());
            setCode("");
          }}
        >
          <Input type="text" autoComplete="off" minLength={4} maxLength={32} placeholder="••••" aria-label={l.passcode} value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" variant="secondary" disabled={props.pending || code.trim().length < 4}>{l.setPasscode}</Button>
        </form>
        <p className="text-xs text-muted-foreground">{l.passcodeHint}</p>
        {props.hasPasscode && (
          <Button variant="ghost" size="sm" onClick={props.onRemovePasscode} disabled={props.pending}>{l.removePasscode}</Button>
        )}
      </div>
    </div>
  );
}
