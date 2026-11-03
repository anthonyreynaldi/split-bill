import type { Metadata } from "next";
import { SharedSummaryContainer } from "@/features/share/containers/shared-summary-container";

// Shared links are private by nature: keep them out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SharedPage({ params }: PageProps<"/[locale]/s/[slug]">) {
  const { slug } = await params;
  return <SharedSummaryContainer slug={slug} />;
}
