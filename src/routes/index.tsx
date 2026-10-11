import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TopFlex — Airtime, Data, Bills & Wallet" },
      { name: "description", content: "TopFlex: buy airtime and data, pay bills, order food and manage your wallet." },
      { property: "og:title", content: "TopFlex — Airtime, Data, Bills & Wallet" },
      { property: "og:description", content: "Buy airtime and data, pay bills, order food and manage your wallet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/topflex/index.html"
      title="TopFlex"
      className="fixed inset-0 h-screen w-screen border-0"
    />
  );
}
