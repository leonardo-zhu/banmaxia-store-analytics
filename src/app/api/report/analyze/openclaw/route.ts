import { NextResponse } from "next/server";

const OPENCLAW_URL = "http://127.0.0.1:18789/v1/chat/completions";

export async function POST() {
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "OPENCLAW_GATEWAY_TOKEN not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(OPENCLAW_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-OpenClaw-Scopes": "operator.read,operator.write,operator.admin",
      },
      body: JSON.stringify({
        model: "openclaw/default",
        stream: true,
        messages: [
          {
            role: "user",
            content:
              "请使用 banmaxia-store-analytics skill，生成今日门店日报分析并保存报告。",
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `OpenClaw error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    // Collect the streamed response
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "No response body" }, { status: 502 });
    }

    const decoder = new TextDecoder();
    let fullContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") break;
        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) fullContent += delta;
        } catch {
          // skip malformed lines
        }
      }
    }

    return NextResponse.json({ success: true, content: fullContent });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
