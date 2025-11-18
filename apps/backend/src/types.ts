export type AnalysisRequest={symbol:string;timeframe:string;capital:number};
export type AgentAnalysis={id:string;createdAt:string;symbol:string;timeframe:string;summary:string;signals:{name:string;value:number;weight:number}[]};
export type TradePlan={id:string;analysisId:string;symbol:string;timeframe:string;capital:number;entries:{side:'BUY'|'SELL';price?:number;qtyPct:number;rationale:string}[];exitRules:{stopLossPct:number;takeProfitPct:number;timeExitBars?:number};meta?:Record<string,any>};
export type RiskProfile={profile:'risky'|'neutral'|'conservative';maxPositionPct:number;maxDailyLossPct:number;requireKillSwitch:boolean};
export type RiskCheckResult={id:string;status:'ok'|'blocked';reasons?:string[];computed?:Record<string,any>};
export type PortfolioState={equity:number;positions:{symbol:string;qty:number;avgPrice:number}[];history:{id:string;symbol:string;side:'BUY'|'SELL';qty:number;price:number;ts:string}[]};
export type GuardrailsState={killSwitch:boolean;liveEnabled:boolean};
export type PaperStateFile={analyses:Record<string,any>;plans:Record<string,TradePlan>;riskChecks:Record<string,RiskCheckResult>;approvals:Record<string,any>;portfolio:PortfolioState;guardrails:GuardrailsState};
