import { get_portfolio_snapshot, simulate_analysis, simulate_plan, inspect_risk_check } from './gptTools.js';

type ToolCallEntry = { name: string; args: Record<string, any>; status: 'ok' | 'error'; shortResult?: string };

const tools = {
  get_portfolio_snapshot: async () => ({ name: 'get_portfolio_snapshot', result: await get_portfolio_snapshot() }),
  simulate_analysis: async (args: any) => ({ name: 'simulate_analysis', result: await simulate_analysis(args.symbol ?? 'BTCUSDT', args.timeframe ?? '1h', args.capital ?? 100000) }),
  simulate_plan: async (args: any) => ({ name: 'simulate_plan', result: await simulate_plan(args.analysisId ?? 'demo', args.symbol ?? 'BTCUSDT', args.timeframe ?? '1h', args.capital ?? 100000) }),
  inspect_risk_check: async (args: any) => ({ name: 'inspect_risk_check', result: await inspect_risk_check(args.plan, args.profile) }),
};

const safeToolNames = new Set(['get_portfolio_snapshot', 'simulate_analysis', 'simulate_plan', 'inspect_risk_check']);

export class GptAssistantService {
  private readonly openAiKey = process.env.OPENAI_API_KEY;
  private readonly model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  async ask(question: string, workspaceId: string, userId: string, context: { route?: string; symbol?: string; timeframe?: string }) {
    const toolCallLog: ToolCallEntry[] = [];
    const systemMessage = {
      role: 'system',
      content: 'You are a trading SaaS copilot. Explain the paper trading flow and portfolio state. Never place live trades.',
    };

    const contextMsg = {
      role: 'system',
      content: `Context: route=${context.route ?? 'unknown'}, symbol=${context.symbol ?? 'BTCUSDT'}, timeframe=${context.timeframe ?? '1h'}`,
    };

    const messages = [systemMessage, contextMsg, { role: 'user', content: question }];

    while (true) {
      const response = await this.callOpenAI(messages, toolCallLog);
      const choice = response?.choices?.[0];
      if (!choice) break;
      if (choice.message?.function_call) {
        const { name, arguments: argsRaw } = choice.message.function_call;
        if (!safeToolNames.has(name)) {
          toolCallLog.push({ name, args: {}, status: 'error', shortResult: 'Tool rejected (unsafe).' });
          messages.push({ role: 'assistant', content: 'Tool rejected by safety guard.' });
          continue;
        }
        const args = argsRaw ? JSON.parse(argsRaw) : {};
        try {
          const result = await (tools as any)[name](args);
          toolCallLog.push({ name, args, status: 'ok', shortResult: JSON.stringify(result.result ?? result).slice(0, 200) });
        messages.push({ role: 'tool', name, content: JSON.stringify(result.result ?? result, null, 2) } as any);
        } catch (err: any) {
          toolCallLog.push({ name, args, status: 'error', shortResult: err.message });
          messages.push({ role: 'assistant', content: `Tool ${name} failed: ${err.message}` });
        }
        continue;
      }
      const answer = choice.message?.content ?? 'I could not generate an answer.';
      return { answer, toolCallLog };
    }

    return { answer: 'Unable to complete request.', toolCallLog };
  }

  private async callOpenAI(messages: any[], toolCallLog: ToolCallEntry[]) {
    if (!this.openAiKey) {
      return {
        choices: [
          {
            message: { content: 'API key missing, please configure OPENAI_API_KEY.', role: 'assistant' },
          },
        ],
      };
    }
    const response = await fetch(process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        functions: [
          { name: 'get_portfolio_snapshot', description: 'Returns the current portfolio state', parameters: { type: 'object', properties: {} } },
          { name: 'simulate_analysis', description: 'Run a safe analysis', parameters: { type: 'object', properties: { symbol: { type: 'string' }, timeframe: { type: 'string' }, capital: { type: 'number' } } } },
          { name: 'simulate_plan', description: 'Generate a plan from an analysis', parameters: { type: 'object', properties: { analysisId: { type: 'string' }, symbol: { type: 'string' }, timeframe: { type: 'string' }, capital: { type: 'number' } } } },
          { name: 'inspect_risk_check', description: 'Explain a risk check', parameters: { type: 'object', properties: { plan: { type: 'object' }, profile: { type: 'object' } } } },
        ],
        function_call: 'auto',
      }),
    });
    return response.json();
  }
}
