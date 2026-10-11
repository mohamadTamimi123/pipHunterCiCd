"use client";

import { Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
import NextLink from "next/link";
import { StatusChip } from "@/components/ui";
import { STAGE, usd } from "@/lib/format";

export function ChallengeCard({ challenge }: { challenge: any }) {
  const a = challenge.account;
  const p = a?.progress;
  const profitRatio = p?.profitTargetAmount ? Math.max(0, Math.min(100, (p.profit / p.profitTargetAmount) * 100)) : null;
  return (
    <Card as={NextLink} href={`/challenges/${challenge.id}`} isPressable shadow="sm" className="border border-divider hover:border-primary/50 transition-colors">
      <CardHeader className="flex justify-between items-start">
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold">{challenge.plan?.name || challenge.rules?.planName}</span>
          <span className="text-xs text-default-500 ltr">#{a?.login} · {a?.server}</span>
        </div>
        <div className="flex gap-2">
          <StatusChip map={STAGE} value={challenge.stage} />
          {challenge.status === "failed" && <Chip size="sm" color="danger" variant="flat">ناموفق</Chip>}
        </div>
      </CardHeader>
      <CardBody className="pt-0 flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-default-100 rounded-xl p-2">
            <div className="text-xs text-default-500">بالانس</div>
            <div className="font-semibold ltr">{usd(a?.balance)}</div>
          </div>
          <div className="bg-default-100 rounded-xl p-2">
            <div className="text-xs text-default-500">اکوئیتی</div>
            <div className="font-semibold ltr">{usd(a?.equity)}</div>
          </div>
          <div className="bg-default-100 rounded-xl p-2">
            <div className="text-xs text-default-500">سود / زیان</div>
            <div className={`font-semibold ltr ${p?.profit >= 0 ? "text-success" : "text-danger"}`}>{usd(p?.profit)}</div>
          </div>
        </div>
        {profitRatio !== null && (
          <div>
            <div className="flex justify-between text-xs text-default-500 mb-1">
              <span>پیشرفت تا هدف سود</span>
              <span className="ltr">{Math.round(profitRatio)}%</span>
            </div>
            <Progress aria-label="هدف سود" size="sm" value={profitRatio} color={profitRatio >= 100 ? "success" : "primary"} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
