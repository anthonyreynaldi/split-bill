import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/** Frame for the login/register forms. Pure view. */
export function AuthCard(props: {
  title: string;
  description: string;
  /** Translated server error, if the last submit failed. */
  error?: string | null;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="mx-auto mt-8 w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{props.title}</CardTitle>
        <CardDescription>{props.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {props.error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{props.error}</AlertDescription>
          </Alert>
        )}
        {props.children}
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">{props.footer}</CardFooter>
    </Card>
  );
}
