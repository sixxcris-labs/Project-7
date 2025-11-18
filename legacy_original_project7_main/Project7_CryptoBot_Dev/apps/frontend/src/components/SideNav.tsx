import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

type SidebarPosition = "top" | "middle" | "bottom";

type SidebarItem = {
  id: string;
  label: string;
  route: string;
  icon: string;
  position: SidebarPosition;
  visibleForRoles: string[];
};

const iconMap: Record<string, string> = {
  dashboard: "DB",
  candles: "CH",
  backtest: "BT",
  lab: "LL",
  whale: "WH",
  link: "CN",
  list: "AO",
  settings: "ST",
  billing: "PB",
  shield: "AD",
  trading: "TF",
};

const sidebarItems: SidebarItem[] = [
  {
    id: "nav_dashboard",
    label: "Dashboard",
    route: "/dashboard",
    icon: "dashboard",
    position: "top",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_trading_flow",
    label: "Trading Flow",
    route: "/trading",
    icon: "trading",
    position: "top",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_markets",
    label: "Markets",
    route: "/markets",
    icon: "candles",
    position: "top",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_backtesting",
    label: "Backtesting",
    route: "/backtesting",
    icon: "backtest",
    position: "top",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_strategies",
    label: "Strategies (LLM Lab)",
    route: "/strategies",
    icon: "lab",
    position: "top",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_whale_watch",
    label: "Whale Watch",
    route: "/whales",
    icon: "whale",
    position: "top",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_connections",
    label: "Connections & Wallets",
    route: "/connections",
    icon: "link",
    position: "middle",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_activity",
    label: "Activity / Orders",
    route: "/activity",
    icon: "list",
    position: "middle",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_settings",
    label: "Settings / Profile",
    route: "/settings",
    icon: "settings",
    position: "bottom",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_billing",
    label: "Payments & Billing",
    route: "/billing",
    icon: "billing",
    position: "bottom",
    visibleForRoles: ["user", "admin"],
  },
  {
    id: "nav_admin",
    label: "Admin / Ops",
    route: "/admin",
    icon: "shield",
    position: "bottom",
    visibleForRoles: ["admin"],
  },
];

const sectionOrder: SidebarPosition[] = ["top", "middle", "bottom"];

export default function SideNav() {
  const router = useRouter();
  return (
    <aside className="dashboard-sidebar" aria-label="Primary navigation">
      <div className="sidebar-brand">Project 7</div>
      {sectionOrder.map((section) => {
        const sectionItems = sidebarItems.filter((item) => item.position === section);
        if (!sectionItems.length) return null;
        return (
          <div key={section} className="sidebar-section">
            <ul>
              {sectionItems.map((item) => {
                const isActive =
                  router.pathname === item.route ||
                  router.pathname.startsWith(`${item.route}/`);
                return (
                  <li key={item.id} className={isActive ? "active" : undefined}>
                    <Link href={item.route}>
                      <span className="sidebar-link">
                        <span className="sidebar-icon" aria-hidden="true">
                          {iconMap[item.icon] ?? item.label.charAt(0).toUpperCase()}
                        </span>
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}
