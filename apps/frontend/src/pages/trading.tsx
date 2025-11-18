import { useEffect } from 'react';
import Layout from '../components/Layout';
import { useTradingSession } from '../stores/tradingSessionStore';
import { DataPanel } from '../legacy-ui';
import { LegacyButton } from '../legacy-ui';

export default function Trading() {
  const s = useTradingSession();

  useEffect(() => {
    s.loadRiskProfiles();
  }, []);

  return (
    <Layout>
      <h1>Trading Flow</h1>
      <div className="dashboard-grid">
        <DataPanel title="Risk Profile" state={s.profileLoading ? 'loading' : 'ready'}>
          <select
            value={s.selectedProfile?.profile ?? ''}
            onChange={(e) => {
              const sel = s.riskProfiles.find((p) => p.profile === e.target.value);
              if (sel) {
                s.saveRiskProfile(sel);
              }
            }}
            disabled={s.profileLoading}
          >
            <option value="">Select profile</option>
            {s.riskProfiles.map((p) => (
              <option key={p.profile} value={p.profile}>
                {p.profile} · max position {p.maxPositionPct * 100}% · daily {p.maxDailyLossPct * 100}%
              </option>
            ))}
          </select>
          {s.profileStatus && <p className="panel-hint">{s.profileStatus}</p>}
        </DataPanel>
      </div>

      <div className="dashboard-grid">
        <DataPanel
          title="1) Run Agents"
          state={s.loading ? 'loading' : 'ready'}
          actionLabel="Run"
          onAction={s.runAgents}
        >
          {s.analysis ? <pre>{JSON.stringify(s.analysis, null, 2)}</pre> : <p className="panel-hint">No analysis yet.</p>}
          <LegacyButton variant="ghost" onClick={() => s.reset()}>
            Reset Flow
          </LegacyButton>
        </DataPanel>

        <DataPanel
          title="2) Generate Plan"
          state={s.analysis ? 'ready' : 'empty'}
          actionLabel="Generate"
          onAction={s.generatePlan}
        >
          {s.plan ? <pre>{JSON.stringify(s.plan, null, 2)}</pre> : <p className="panel-hint">Run agents first.</p>}
        </DataPanel>
      </div>

      <div className="dashboard-grid">
        <DataPanel
          title="3) Validate Risk"
          state={s.plan ? 'ready' : 'empty'}
          actionLabel="Validate"
          onAction={s.validateRisk}
        >
          {s.risk ? <pre>{JSON.stringify(s.risk, null, 2)}</pre> : <p className="panel-hint">Generate plan first.</p>}
        </DataPanel>

        <DataPanel
          title="4) Approve Paper"
          state={s.risk && s.risk.status === 'ok' ? 'ready' : 'empty'}
          actionLabel="Approve"
          onAction={s.approvePaper}
        >
          {s.approval ? <pre>{JSON.stringify(s.approval, null, 2)}</pre> : <p className="panel-hint">Need risk check.</p>}
        </DataPanel>
      </div>
    </Layout>
  );
}
