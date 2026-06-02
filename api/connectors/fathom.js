// api/connectors/fathom.js
export function isConfigured() {
  return !!process.env.FATHOM_API_KEY;
}

async function fathomReq(path) {
  const res = await fetch(`https://api.fathom.ai/v1${path}`, {
    headers: { Authorization: `Bearer ${process.env.FATHOM_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Fathom ${res.status}`);
  return res.json();
}

export async function getRecentMeetings(limit = 5) {
  if (!isConfigured()) return getMockMeetings();
  const d = await fathomReq(`/meetings?limit=${limit}`);
  return (d.meetings || d || []).map(m => ({
    id: m.id, title: m.title || "Untitled",
    startedAt: m.started_at || m.date, duration: m.duration_minutes || 0,
    participants: m.participants || [], source: "fathom",
  }));
}

export async function getMeetingTranscript(id) {
  if (!isConfigured()) return getMockTranscript(id);
  const d = await fathomReq(`/meetings/${id}/transcript`);
  return d.transcript || d;
}

function getMockMeetings() {
  return [
    {
      id: "mtg-001", title: "Q3 Strategy Review — Leadership Team",
      startedAt: new Date(Date.now() - 10800000).toISOString(), duration: 52,
      participants: ["You", "Rahul Verma", "Lisa Park", "David Osei"], source: "mock",
    },
    {
      id: "mtg-002", title: "GlobalCorp RFP Kickoff Call",
      startedAt: new Date(Date.now() - 86400000).toISOString(), duration: 35,
      participants: ["You", "Sarah Mitchell", "Tom Reynolds"], source: "mock",
    },
  ];
}

function getMockTranscript(id) {
  if (id === "mtg-001") {
    return `[00:00] Rahul: Let's review Q3 strategy — focus on cloud and AI services growth.
[05:30] David: Engineering capacity is the bottleneck. We need 3 more cloud architects.
[08:45] You: Let's prioritise GlobalCorp RFP — $1.5M potential.
[12:00] Rahul: Action — David to post job descriptions by Friday. Lisa to book GlobalCorp scoping call.
[18:30] Lisa: HealthSys RFI also needs a response. Low effort, $600K potential.
[30:15] Rahul: Q3 target is $3.2M. Currently tracking $1.8M pipeline.
[45:00] David: Azure partnership tier renewal due 30th June or we lose the discount.
[51:30] You: I'll action that today.`;
  }
  return `Transcript for ${id} not available in demo mode.`;
}
