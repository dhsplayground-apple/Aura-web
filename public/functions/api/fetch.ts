export const onRequestPost: PagesFunction = async ({ request }) => {
  try {
    const body = await request.json() as any;

    // Mode A: Fetch any webpage cleanly for the Aura Glass Web Reader
    if (body.action === "read_url" && body.url) {
      const target = new URL(body.url);
      if (!["http:", "https:"].includes(target.protocol)) {
        return Response.json({ error: "Invalid URL" }, { status: 400 });
      }
      const res = await fetch(target.toString(), {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AuraReader/1.0)" }
      });
      const html = await res.text();
      return Response.json({ html, finalUrl: res.url });
    }

    // Mode B: Gemini AI proxy (keeps requests clean with zero CORS issues)
    if (body.action === "gemini" && body.apiKey) {
      const model = body.model || "gemini-3.8-flash";
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": body.apiKey
          },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: body.system || "Be concise and helpful." }] },
            contents: [{ parts: [{ text: body.prompt }] }]
          })
        }
      );
      const data = await aiRes.json();
      return Response.json(data, { status: aiRes.status });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};
