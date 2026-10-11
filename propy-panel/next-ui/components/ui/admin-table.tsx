"use client";

import { Input, Pagination, Select, SelectItem } from "@heroui/react";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

/** Filters bar used above admin tables. */
export function Filters({
  search,
  onSearch,
  status,
  onStatus,
  statuses,
  statusLabel = "وضعیت",
}: {
  search?: string;
  onSearch?: (v: string) => void;
  status?: string;
  onStatus?: (v: string) => void;
  statuses?: Record<string, string | { label: string }>;
  statusLabel?: string;
}) {
  const [text, setText] = useState(search || "");
  useEffect(() => {
    if (!onSearch) return;
    const t = setTimeout(() => onSearch(text), 400);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {onSearch && <Input className="max-w-xs" size="sm" placeholder="جستجو..." startContent={<Search size={16} />} value={text} onValueChange={setText} variant="bordered" />}
      {statuses && onStatus && (
        <Select
          className="max-w-[200px]"
          size="sm"
          label={statusLabel}
          selectedKeys={[status || "all"]}
          onSelectionChange={(k) => {
            const v = String(Array.from(k)[0] ?? "all");
            onStatus(v === "all" ? "" : v);
          }}
          variant="bordered"
        >
          {[
            <SelectItem key="all">همه</SelectItem>,
            ...Object.entries(statuses).map(([k, v]) => <SelectItem key={k}>{typeof v === "string" ? v : v.label}</SelectItem>),
          ]}
        </Select>
      )}
    </div>
  );
}

export function Pager({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return (
    <div className="flex justify-center mt-4">
      <Pagination page={page} total={pages} onChange={onChange} showControls color="primary" />
    </div>
  );
}

export function qs(params: Record<string, string | number | undefined>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") s.set(k, String(v));
  const str = s.toString();
  return str ? `?${str}` : "";
}
