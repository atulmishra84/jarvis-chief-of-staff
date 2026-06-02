// api/meetings/run.js — POST /api/meetings/run
import { getRecentMeetings, getMeetingTranscript } from "../connectors/fathom.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });

  try {
    const meetings = await getRecentMeetings(5);
    const items = [];

    for (const meeting of meetings) {
      const transcript = await getMeetingTranscript(meeting.id);
      const transcriptText = typeof transcript === "string" ? transcript : JSON.stringify(transcript);

      const prompt = `Analyse this meeting transcript. Respond ONLY with JSON, no markdown.\n\nMeeting: ${meeting.title}\nDate: ${new Date(meeting.startedAt).toLocaleDateString()}\nDuration: ${meeting.duration} min\nParticipants: ${meeting.participants.join(", ")}\n\nTranscript:\n${transcriptText}\n\nJSON format:\n{"executive_summary":"2-3 sentences","key_decisions":["..."],"action_items":[{"owner":"name","task":"what","due":"when","priority":"high|medium|low"}],"discussion_topics":["..."],"follow_up_email_subject":"subject line","follow_up_email_body":"full email text"}`;

      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await claudeRes.json();
      const text = data.content?.[0]?.text || "{}";
      let notes;
      try { notes = JSON.parse(text.replace(/```json|```/g, "").trim()); }
      catch { notes = { executive_summary: "Could not process", action_items: [], key_decisions: [] }; }

      items.push({ meeting, notes, status: "pending_approval", createdAt: new Date().toISOString() });
    }

    res.status(200).json({ success: true, processed: items.length, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
