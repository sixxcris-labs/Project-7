import React from 'react';

export type PanelState = 'loading' | 'ready' | 'empty' | 'error';

export interface DataPanelProps {
  title: string;
  state?: PanelState;
  actionLabel?: string;
  onAction?: () => void;
  loadingText?: string;
  emptyText?: string;
  errorText?: string;
  children?: React.ReactNode;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  title,
  state = 'ready',
  actionLabel,
  onAction,
  loadingText,
  emptyText,
  errorText,
  children,
}) => {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>{title}</h3>
        {onAction && actionLabel && (
          <button className="panel-cta" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
      </div>
      {state === 'loading' && <p className="panel-hint">{loadingText ?? 'Loading…'}</p>}
      {state === 'error' && <p className="panel-hint">{errorText ?? 'Unable to load'}</p>}
      {state === 'empty' && <p className="panel-hint">{emptyText ?? 'No data yet'}</p>}
      {state === 'ready' && <div className="panel-body">{children}</div>}
    </div>
  );
};
