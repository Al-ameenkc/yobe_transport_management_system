"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface AdminListToolbarProps {
  placeholder?: string;
  statusOptions?: FilterOption[];
  typeOptions?: FilterOption[];
}

export function AdminListToolbar({
  placeholder = "Search…",
  statusOptions,
  typeOptions,
}: AdminListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const status = searchParams.get("status") ?? "";
  const type = searchParams.get("type") ?? "";

  function applyFilters(next?: { query?: string; status?: string; type?: string }) {
    const params = new URLSearchParams();
    const query = next?.query ?? q;
    const nextStatus = next?.status ?? status;
    const nextType = next?.type ?? type;

    if (query.trim()) params.set("q", query.trim());
    if (nextStatus) params.set("status", nextStatus);
    if (nextType) params.set("type", nextType);

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-lg border bg-slate-50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters();
      }}
    >
      <div className="min-w-[200px] flex-1">
        <Label htmlFor="admin-search" className="text-xs text-slate-500">
          Search
        </Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            id="admin-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
      </div>

      {typeOptions && typeOptions.length > 0 && (
        <div className="w-full sm:w-40">
          <Label className="text-xs text-slate-500">Type</Label>
          <Select
            className="mt-1"
            value={type}
            onChange={(e) => applyFilters({ type: e.target.value })}
          >
            <option value="">All types</option>
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      {statusOptions && statusOptions.length > 0 && (
        <div className="w-full sm:w-40">
          <Label className="text-xs text-slate-500">Status</Label>
          <Select
            className="mt-1"
            value={status}
            onChange={(e) => applyFilters({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Search
        </Button>
        {(searchParams.get("q") || searchParams.get("status") || searchParams.get("type")) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQ("");
              router.push(pathname);
            }}
          >
            Clear
          </Button>
        )}
      </div>
    </form>
  );
}
