import React from "react";

export type PanelState = "loading" | "ready" | "empty" | "error";

export interface DataPanelProps {
  title: string;
  state: PanelState;
  actionLabel?: string;
  onAction?: () => void;
  emptyText?: string;
  errorText?: string;
  loadingText?: string;
  children?: React.ReactNode;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  title,
  state,
  actionLabel,
  onAction,
  emptyText,
  errorText,
  loadingText,
  children,
}) => {
  return (
    <div className="dashboard-card">
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
        </div>
        {actionLabel && onAction && (
          <button className="panel-cta" onClick={onAction} type="button">
            {actionLabel}
          </button>
        )}
      </header>

      {state === "loading" && (
        <div className="panel-skeleton">
          {loadingText ? loadingText : "Updating…"}
        </div>
      )}
      {state === "empty" && (
        <p className="panel-empty">{emptyText ?? "No data yet."}</p>
      )}
      {state === "error" && (
        <div className="panel-error">
          <p>{errorText ?? "Couldn’t load this panel right now."}</p>
          {onAction && (
            <button className="panel-cta" type="button" onClick={onAction}>
              Retry
            </button>
          )}
        </div>
      )}
      {state === "ready" && <div className="panel-body">{children}</div>}
    </div>
  );
};
