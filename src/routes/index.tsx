import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Empty Project" },
      { name: "description", content: "A clean, empty starting point." },
      { property: "og:title", content: "Empty Project" },
      { property: "og:description", content: "A clean, empty starting point." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <div className="min-h-screen bg-background" />;
}
