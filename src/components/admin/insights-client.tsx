"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightsClient() {
  const [insights, setInsights] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateInsights() {
    setLoading(true);
    try {
      const res = await fetch("/api/insights", { method: "POST" });
      const data = await res.json();
      setInsights(data.insights);
    } catch {
      setInsights("Failed to generate insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">AI-Powered Operations Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-slate-500">
          Get a natural-language summary of revenue trends, top routes, and recommendations.
        </p>
        <Button onClick={generateInsights} loading={loading}>
          Generate Weekly Insights
        </Button>
        {insights && (
          <div className="rounded-lg bg-slate-50 p-4 text-sm whitespace-pre-wrap">
            {insights}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
