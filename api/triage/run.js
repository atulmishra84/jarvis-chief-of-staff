// api/triage/run.js  — POST /api/triage/run
import { getUnreadEmails } from "../connectors/microsoft365.js";

async function claudeRequest(messages, system, maxTokens = 600) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system, messages }),
  });
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

async function classifyEmail(email) {
  const text = await claudeRequest(
    [{ role: "user", content: `Classify this email. Respond ONLY with JSON, no markdown.\n\nSubject: ${email.subject}\nFrom: ${email.fromName} <${email.from}>\nBody:\n${email.body.substring(0, 1500)}\n\nJSON format:\n{"category":"rfp|rfi|meeting_request|action_item|fyi|spam","priority":"high|medium|low","summary":"one sentence","sender_intent":"what sender wants","requires_reply":true,"urgency_signal":"deadline or null","rfp_signals":[]}` }],
    "You are an email classifier. Return only valid JSON.",
    400
  );
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch { return { category: "fyi", priority: "low", summary: "Unclassified", sender_intent: "Unknown", requires_reply: false, urgency_signal: null, rfp_signals: [] }; }
}

async function draftReply(email, classification) {
  const name = process.env.YOUR_NAME || "the team";
  const role = process.env.YOUR_ROLE || "";
  const tones = { rfp: "professional and enthusiastic, confirming receipt and intent to bid", rfi: "professional, expressing interest", meeting_request: "warm and efficient, confirming or proposing a time", action_item: "concise, acknowledging and giving a timeline", fyi: "brief acknowledgement" };
  return claudeRequest(
    [{ role: "user", content: `Draft a reply on behalf of ${name}${role ? `, ${role}` : ""}.\n\nOriginal:\nSubject: ${email.subject}\nFrom: ${email.fromName}\n${email.body.substring(0, 2000)}\n\nTone: ${tones[classification.category] || "professional"}\nUrgency: ${classification.urgency_signal || "none"}\n\nWrite only the email body. Plain text. Sign off with "${name}".` }],
    "You write professional email replies. Plain text only, no markdown.",
    500
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const emails = await getUnreadEmails(20);
    const items = [];

    for (const email of emails) {
      const classification = await classifyEmail(email);
      let draft = null;
      if (classification.requires_reply && classification.category !== "spam") {
        draft = await draftReply(email, classification);
      }
      items.push({
        id: `triage-${Date.now()}-${Math.random().toString(36).substr(2,6)}`,
        emailId: email.id, email, classification, draft,
        status: "pending", createdAt: new Date().toISOString(),
        isRfpRfi: ["rfp", "rfi"].includes(classification.category),
      });
    }

    res.status(200).json({ success: true, processed: items.length, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
