import { InsightsClient } from "@/components/admin/insights-client";

export default function AdminInsightsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">AI Insights</h1>
      <p className="text-slate-500">OpenAI-powered operational analysis</p>
      <InsightsClient />
    </div>
  );
}

