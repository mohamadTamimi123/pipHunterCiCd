"use client";

import dynamic from "next/dynamic";
import React from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Point {
  balance: number;
  equity: number;
  createdAt: string;
}

export function EquityChart({ points, initialBalance, maxLossLevel, targetLevel }: { points: Point[]; initialBalance: number; maxLossLevel?: number; targetLevel?: number | null }) {
  const series = [
    { name: "اکوئیتی", data: points.map((p) => ({ x: new Date(p.createdAt).getTime(), y: Number(p.equity) })) },
    { name: "بالانس", data: points.map((p) => ({ x: new Date(p.createdAt).getTime(), y: Number(p.balance) })) },
  ];

  const annotations: any[] = [{ y: initialBalance, borderColor: "#71717a", strokeDashArray: 4, label: { text: "سرمایه اولیه", style: { background: "#3f3f46", color: "#fff" } } }];
  if (maxLossLevel) annotations.push({ y: maxLossLevel, borderColor: "#f31260", strokeDashArray: 4, label: { text: "حد ضرر کلی", style: { background: "#f31260", color: "#fff" } } });
  if (targetLevel) annotations.push({ y: targetLevel, borderColor: "#17c964", strokeDashArray: 4, label: { text: "هدف سود", style: { background: "#17c964", color: "#fff" } } });

  return (
    <Chart
      type="area"
      width="100%"
      height={300}
      series={series}
      options={{
        chart: { toolbar: { show: false }, zoom: { enabled: false }, fontFamily: "inherit", foreColor: "#a1a1aa", background: "transparent" },
        colors: ["#FD7245", "#7828c8"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 2 },
        fill: { type: "gradient", gradient: { opacityFrom: 0.35, opacityTo: 0.02 } },
        grid: { borderColor: "rgba(113,113,122,0.2)" },
        xaxis: { type: "datetime", labels: { datetimeUTC: false } },
        yaxis: { labels: { formatter: (v: number) => `$${Math.round(v).toLocaleString("en-US")}` } },
        tooltip: { theme: "dark", x: { format: "yyyy/MM/dd HH:mm" } },
        legend: { position: "top", horizontalAlign: "left" },
        annotations: { yaxis: annotations },
      }}
    />
  );
}

export function BarsChart({ data, label }: { data: { date: string; amount: number }[]; label: string }) {
  return (
    <Chart
      type="bar"
      width="100%"
      height={260}
      series={[{ name: label, data: data.map((d) => d.amount) }]}
      options={{
        chart: { toolbar: { show: false }, fontFamily: "inherit", foreColor: "#a1a1aa", background: "transparent" },
        colors: ["#FD7245"],
        plotOptions: { bar: { borderRadius: 6, columnWidth: "45%" } },
        dataLabels: { enabled: false },
        grid: { borderColor: "rgba(113,113,122,0.2)" },
        xaxis: { categories: data.map((d) => new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" }).format(new Date(d.date))) },
        yaxis: { labels: { formatter: (v: number) => `$${Math.round(Number(v) || 0)}` } },
        tooltip: { theme: "dark" },
      }}
    />
  );
}
