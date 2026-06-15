import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function chatWithSupport(
  messages: { role: "user" | "assistant"; content: string }[],
  context?: string
) {
  if (!openai) {
    return "AI support is not configured. Please contact support@tms.ng or call +234 800 TMS HELP.";
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a helpful customer support assistant for TMS Nigeria, an E-Logistics bus booking platform. Help passengers with booking, tickets, cancellations, and travel info. Be concise and friendly.${context ? `\n\nContext:\n${context}` : ""}`,
      },
      ...messages,
    ],
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content ?? "Sorry, I could not process your request.";
}

export async function generateAdminInsights(statsJson: string) {
  if (!openai) {
    return "AI insights require OPENAI_API_KEY. View the Reports page for raw analytics data.";
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a transport operations analyst. Summarize the dashboard data in 3-5 bullet points with actionable recommendations for a Nigerian bus company.",
      },
      {
        role: "user",
        content: `Analyze this transport management data:\n${statsJson}`,
      },
    ],
    max_tokens: 600,
  });

  return response.choices[0]?.message?.content ?? "Unable to generate insights.";
}

export async function parseSmartSearch(query: string) {
  if (!openai) return null;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Parse bus search queries for Yobe State transport into JSON with fields: destination (one of Abuja, Jos, Bauchi, Kano, Kaduna, Nasarawa, Niger, Sokoto, Zamfara), date (YYYY-MM-DD). Origin is always Yobe. If date is relative like "tomorrow", compute from today ${new Date().toISOString().split("T")[0]}. Return only valid JSON.`,
      },
      { role: "user", content: query },
    ],
    response_format: { type: "json_object" },
    max_tokens: 200,
  });

  try {
    return JSON.parse(response.choices[0]?.message?.content ?? "{}");
  } catch {
    return null;
  }
}
