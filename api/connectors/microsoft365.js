// api/connectors/microsoft365.js
let _token = null, _expiry = 0;

export function isConfigured() {
  return !!(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET && process.env.MS_TENANT_ID);
}

async function getToken() {
  if (_token && Date.now() < _expiry) return _token;
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.MS_CLIENT_ID,
        client_secret: process.env.MS_CLIENT_SECRET,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    }
  );
  const d = await res.json();
  if (!d.access_token) throw new Error("M365 auth failed");
  _token = d.access_token;
  _expiry = Date.now() + (d.expires_in - 60) * 1000;
  return _token;
}

async function graph(path, opts = {}) {
  const token = await getToken();
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getUnreadEmails(limit = 20) {
  if (!isConfigured()) return getMockEmails();
  const email = process.env.MS_USER_EMAIL;
  const d = await graph(
    `/users/${email}/mailFolders/inbox/messages?$filter=isRead eq false&$top=${limit}&$orderby=receivedDateTime desc&$select=id,subject,from,receivedDateTime,bodyPreview,body,hasAttachments`
  );
  return (d.value || []).map(normalise);
}

export async function sendReply(emailId, body) {
  if (!isConfigured()) return { mock: true };
  const email = process.env.MS_USER_EMAIL;
  await graph(`/users/${email}/messages/${emailId}/reply`, {
    method: "POST",
    body: JSON.stringify({ message: { body: { contentType: "Text", content: body } } }),
  });
  return { success: true };
}

function normalise(r) {
  return {
    id: r.id,
    subject: r.subject || "(no subject)",
    from: r.from?.emailAddress?.address || "unknown",
    fromName: r.from?.emailAddress?.name || "Unknown",
    receivedAt: r.receivedDateTime,
    preview: r.bodyPreview || "",
    body: r.body?.content || r.bodyPreview || "",
    hasAttachments: r.hasAttachments || false,
    source: "outlook",
  };
}

function getMockEmails() {
  return [
    {
      id: "mock-001", subject: "RFP: Cloud Infrastructure Modernisation",
      from: "procurement@globalcorp.com", fromName: "Sarah Mitchell",
      receivedAt: new Date(Date.now() - 1800000).toISOString(),
      preview: "Please find attached our RFP for cloud infrastructure modernisation. Deadline 15th July...",
      body: "Dear Team,\n\nPlease find attached our RFP for cloud infrastructure modernisation. We are looking for a strategic partner to migrate our on-premise systems to Azure.\n\nScope:\n- Assessment of 200+ servers\n- Migration roadmap\n- Security and compliance framework\n- 24/7 managed support\n\nDeadline: 15th July 2026\nBudget: $500K - $2M\n\nBest regards,\nSarah Mitchell\nHead of Procurement",
      hasAttachments: true, source: "mock",
    },
    {
      id: "mock-002", subject: "Follow-up: Q3 Partnership Discussion",
      from: "james.chen@techinnovate.io", fromName: "James Chen",
      receivedAt: new Date(Date.now() - 5400000).toISOString(),
      preview: "Following up on our conversation last week regarding the potential partnership...",
      body: "Hi,\n\nFollowing up on our conversation last week regarding the potential partnership. Wanted to check if you had a chance to review the proposal.\n\nWe're excited about the synergies and would love to schedule a call this week.\n\nAre you available Thursday or Friday afternoon?\n\nBest,\nJames Chen\nCEO, TechInnovate",
      hasAttachments: false, source: "mock",
    },
    {
      id: "mock-003", subject: "RFI: Managed Security Services",
      from: "it.procurement@healthsys.org", fromName: "Priya Sharma",
      receivedAt: new Date(Date.now() - 10800000).toISOString(),
      preview: "We are issuing this RFI to gather information from qualified vendors...",
      body: "Dear Vendor,\n\nWe are issuing this RFI to gather information from qualified vendors for managed security services across our 12-hospital network.\n\nKey areas:\n1. SOC capabilities\n2. HIPAA compliance experience\n3. Incident response SLAs\n4. Epic EHR integration\n\nRespond by 30th June 2026.\n\nPriya Sharma\nIT Procurement Director",
      hasAttachments: false, source: "mock",
    },
    {
      id: "mock-004", subject: "Meeting Request: Product Roadmap Review",
      from: "alex.kumar@partnerco.com", fromName: "Alex Kumar",
      receivedAt: new Date(Date.now() - 14400000).toISOString(),
      preview: "I'd like to schedule a 30-minute call to walk through our Q3 product roadmap...",
      body: "Hi,\n\nI'd like to schedule a 30-minute call to walk through our Q3 product roadmap and get your feedback before we finalise it.\n\nI'm free most of next week — does Tuesday 10am or Wednesday 2pm work?\n\nThanks,\nAlex",
      hasAttachments: false, source: "mock",
    },
    {
      id: "mock-005", subject: "Invoice #INV-2026-0847 — Payment Confirmation",
      from: "billing@cloudservices.net", fromName: "CloudServices Billing",
      receivedAt: new Date(Date.now() - 18000000).toISOString(),
      preview: "Your payment of $4,250 has been received and processed...",
      body: "Dear Customer,\n\nYour payment of $4,250 for invoice INV-2026-0847 has been received.\n\nThank you for your business.\n\nCloudServices Billing",
      hasAttachments: true, source: "mock",
    },
  ];
}
