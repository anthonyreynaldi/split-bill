"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/** "Enter passcode" card for a protected share link. Pure view. */
export function PasscodeGate(props: {
  onSubmit: (passcode: string) => void;
  pending: boolean;
  error: string | null;
  labels: { title: string; description: string; passcode: string; submit: string };
}) {
  const [code, setCode] = useState("");
  return (
    <Card className="mx-auto mt-8 w-full max-w-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="size-5" /> {props.labels.title}</CardTitle>
        <CardDescription>{props.labels.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (code) props.onSubmit(code); }}>
          {props.error && (
            <Alert variant="destructive"><AlertDescription>{props.error}</AlertDescription></Alert>
          )}
          <Input autoFocus type="password" autoComplete="off" aria-label={props.labels.passcode} placeholder={props.labels.passcode} value={code} onChange={(e) => setCode(e.target.value)} />
          <Button type="submit" className="w-full" disabled={props.pending || !code}>{props.labels.submit}</Button>
        </form>
      </CardContent>
    </Card>
  );
}
