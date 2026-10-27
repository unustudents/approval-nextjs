import { Suspense } from "react";
import { InboxLoading } from "./_components/InboxLoading";
import { InboxOverview } from "./_components/InboxOverview";
import { getInboxPageData } from "./_lib/queries";

export default function InboxPage() {
  return <Suspense fallback={<InboxLoading />}><InboxPageContent /></Suspense>;
}

async function InboxPageContent() {
  const inbox = await getInboxPageData();
  return <InboxOverview {...inbox} />;
}
