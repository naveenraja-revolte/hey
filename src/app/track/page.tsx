import { redirect } from "next/navigation";

type TrackSearchParams = Promise<{ trackingNumber?: string }>;

export default async function TrackRedirect({
  searchParams,
}: {
  searchParams: TrackSearchParams;
}) {
  const { trackingNumber } = await searchParams;
  const normalized = trackingNumber?.trim().toUpperCase();
  if (!normalized) redirect("/#track");
  redirect(`/track/${encodeURIComponent(normalized)}`);
}
