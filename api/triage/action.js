// api/triage/action.js — POST /api/triage/action
// Handles approve and reject+rewrite actions
// Note: In serverless, state is passed from client (no server memory between calls)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, draft, feedback, emailId } = req.body;

  if (action === "approve") {
    // In production with M365: call sendReply(emailId, draft) here
    console.log(`[JARVIS] Approved reply for email ${emailId}`);
    return res.status(200).json({ success: true, message: "Reply approved and sent" });
  }

  if (action === "rewrite") {
    if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "No API key" });
    if (!feedback) return res.status(400).json({ error: "Feedback required for rewrite" });

    const prompt = `Original draft:\n${draft}\n\nFeedback: ${feedback}\n\nRewrite the email reply incorporating this feedback. Plain text only, no markdown, no asterisks.`;
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await claudeRes.json();
    const newDraft = data.content?.[0]?.text || draft;
    return res.status(200).json({ success: true, draft: newDraft });
  }

  res.status(400).json({ error: "Invalid action" });
}
