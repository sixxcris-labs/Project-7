import React from "react";
import { PolymarketWhalesWidget } from "../components/whales/PolymarketWhalesWidget";

export default function WhalesPage() {
  return (
    <div>
      <h1 style={{ marginBottom: "var(--lg)", fontSize: "24px", fontWeight: 600 }}>
        Polymarket Whale Watch
      </h1>
      <PolymarketWhalesWidget />
    </div>
  );
}
