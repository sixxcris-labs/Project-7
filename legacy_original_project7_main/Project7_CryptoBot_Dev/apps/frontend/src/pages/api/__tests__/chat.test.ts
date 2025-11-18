import handler from "../chat";
import type { NextApiRequest, NextApiResponse } from "next";
import { vi } from "vitest";

function createMocks({ method = "POST", body = {} } = {}) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const setHeader = vi.fn();
  const res = { status, json, setHeader } as unknown as NextApiResponse;
  const req = { method, body } as NextApiRequest;
  return { req, res, json, status, setHeader };
}

describe("/api/chat", () => {
  it("echoes a request", async () => {
    const { req, res, json, status } = createMocks({
      body: { model: "gpt-5.1-thinking", message: "Hello" },
    });

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ reply: expect.any(String) });
  });

  it("rejects non-POST methods", async () => {
    const { req, res, status, json, setHeader } = createMocks({ method: "GET" });

    await handler(req, res);

    expect(status).toHaveBeenCalledWith(405);
    expect(setHeader).toHaveBeenCalledWith("Allow", "POST");
    expect(json).toHaveBeenCalledWith({ error: "Method Not Allowed" });
  });
});
