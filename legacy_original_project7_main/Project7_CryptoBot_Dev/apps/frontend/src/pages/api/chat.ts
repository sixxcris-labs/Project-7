import type { NextApiRequest, NextApiResponse } from "next";

interface ChatResponse {
  reply?: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ChatResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { message, model, context } = req.body ?? {};
  const prompt = typeof message === "string" ? message : "";
  const ctxDescription = context ? JSON.stringify(context) : "<no context>";
  const usingOpenAI = Boolean(process.env.OPENAI_API_KEY);

  const reply = usingOpenAI
    ? `OpenAI key present; would call ${model ?? "gpt"} with "${prompt}" · context ${ctxDescription}`
    : `Echoing your request to ${model ?? "gpt"}: ${prompt} · context: ${ctxDescription}`;

  return res.status(200).json({ reply });
}
