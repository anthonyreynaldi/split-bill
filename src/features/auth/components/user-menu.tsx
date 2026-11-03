import { LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";

/** Header area: login/register links, or the user's email + logout. Pure view. */
export function UserMenu(props: {
  email: string | null;
  loading: boolean;
  onLogout: () => void;
  labels: { login: string; register: string; logout: string; myEvents: string };
}) {
  if (props.loading) return <div className="h-7 w-24" />;
  if (!props.email) {
    return (
      <div className="flex gap-1">
        <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          {props.labels.login}
        </Link>
        <Link href="/register" className={buttonVariants({ size: "sm" })}>
          {props.labels.register}
        </Link>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <Link href="/events" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        {props.labels.myEvents}
      </Link>
      <span className="hidden text-sm text-muted-foreground sm:inline">{props.email}</span>
      <Button variant="outline" size="sm" onClick={props.onLogout} aria-label={props.labels.logout}>
        <LogOut />
        <span className="hidden sm:inline">{props.labels.logout}</span>
      </Button>
    </div>
  );
}
