// api/status.js — GET /api/status
import { isConfigured as m365Configured } from "./connectors/microsoft365.js";
import { isConfigured as fathomConfigured } from "./connectors/fathom.js";

export default function handler(req, res) {
  res.status(200).json({
    connectors: {
      microsoft365: m365Configured() ? "connected" : "demo_mode",
      fathom: fathomConfigured() ? "connected" : "demo_mode",
      anthropic: process.env.ANTHROPIC_API_KEY ? "connected" : "missing",
    },
    agents: {
      emailTriage: "ready",
      meetingIntelligence: "ready",
      rfpEngine: "coming_soon",
      teamsMeetingBot: "coming_soon",
    },
    version: "1.0.0",
    runtime: "vercel-serverless",
  });
}
