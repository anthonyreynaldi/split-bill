import { notFound } from "next/navigation";

/** Unknown paths under a locale → render [locale]/not-found.tsx inside the app layout. */
export default function CatchAll() {
  notFound();
}
