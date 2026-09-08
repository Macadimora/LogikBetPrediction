import UserHeader from "@/components/UserHeader";
import SubscribeClient from "./SubscribeClient";

export default function SubscribePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-brand/[0.08] blur-[150px]" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-[620px] w-[620px] rounded-full bg-blue-500/[0.06] blur-[170px]" />

      <UserHeader activePage="vip" />

      <SubscribeClient />
    </main>
  );
}