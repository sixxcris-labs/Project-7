import React from "react";

interface WalletDashboardPreviewProps {
  liveQuotes?: any[];
  quoteStatus?: string;
}

const WalletDashboardPreview = ({ liveQuotes, quoteStatus }: WalletDashboardPreviewProps) => {
  return (
    <div className="panel-skeleton">
      <div className="panel-header">
        <h2>Wallet Dashboard</h2>
        <div className="status-pill">
          Status: {quoteStatus || "Loading"}
        </div>
      </div>
      <div className="panel-body">
        <p className="panel-empty">Portfolio overview will be displayed here</p>
        {liveQuotes && liveQuotes.length > 0 && (
          <p className="panel-empty">Tracking {liveQuotes.length} symbols</p>
        )}
      </div>
    </div>
  );
};

export default WalletDashboardPreview;
