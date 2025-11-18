import type { FC, ReactNode } from "react";

type PageShellProps = {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ title, actions, children }: PageShellProps) {
  return (
    <div className="dashboard-shell dashboard-glass page-shell">
      <div className="page-shell-inner">
        {title || actions ? (
          <header className="topbar" style={{ position: "static" }}>
            <div>{title && <h1 className="text-h1">{title}</h1>}</div>
            {actions && <div>{actions}</div>}
          </header>
        ) : null}
        <main>{children}</main>
      </div>
    </div>
  );
}

export default PageShell;
