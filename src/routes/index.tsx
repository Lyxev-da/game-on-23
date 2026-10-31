import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import "../clover/game.css";

const CloverGame = lazy(() => import("../clover/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Clover Roll — Lucky Clover Game" },
      { name: "description", content: "Roll for rare clovers, brew potions, forge charms and rebirth." },
      { property: "og:title", content: "Clover Roll — Lucky Clover Game" },
      { property: "og:description", content: "Roll for rare clovers, brew potions, forge charms and rebirth." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly fallback={null}>
      <Suspense fallback={null}>
        <CloverGame />
      </Suspense>
    </ClientOnly>
  );
}
