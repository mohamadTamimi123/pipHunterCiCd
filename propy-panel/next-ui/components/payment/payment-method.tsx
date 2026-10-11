"use client";

import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Radio, RadioGroup, Snippet, Textarea, cn } from "@heroui/react";
import { Bitcoin, CreditCard, Landmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { toman, usd } from "@/lib/format";
import { useApi } from "@/lib/use-api";

export type Gateway = "zarinpal" | "crypto" | "manual";

const OPTIONS: { key: Gateway; title: string; description: string; icon: React.ReactNode }[] = [
  { key: "zarinpal", title: "درگاه بانکی (زرین‌پال)", description: "پرداخت ریالی با تمام کارت‌های عضو شتاب", icon: <CreditCard size={22} /> },
  { key: "crypto", title: "پرداخت با تتر (USDT)", description: "پرداخت آنلاین کریپتو در شبکه‌های TRC20 / ERC20 / BEP20", icon: <Bitcoin size={22} /> },
  { key: "manual", title: "کارت به کارت / انتقال دستی", description: "واریز دستی و ثبت رسید؛ تایید توسط پشتیبانی", icon: <Landmark size={22} /> },
];

export function PaymentMethodPicker({ value, onChange }: { value: Gateway; onChange: (g: Gateway) => void }) {
  const settings = useApi("/settings/public");
  const enabled = settings.data?.gateways || { zarinpal: true, crypto: true, manual: true };
  return (
    <RadioGroup value={value} onValueChange={(v) => onChange(v as Gateway)} classNames={{ wrapper: "gap-3" }}>
      {OPTIONS.filter((o) => enabled[o.key]).map((o) => (
        <Radio
          key={o.key}
          value={o.key}
          classNames={{
            base: cn(
              "inline-flex m-0 max-w-full w-full bg-content1 hover:bg-content2 items-center justify-between",
              "flex-row-reverse cursor-pointer rounded-xl gap-4 p-4 border-2 border-divider data-[selected=true]:border-primary",
            ),
          }}
        >
          <div className="flex items-center gap-3">
            <div className="text-primary">{o.icon}</div>
            <div className="flex flex-col">
              <span className="font-medium">{o.title}</span>
              <span className="text-xs text-default-500">{o.description}</span>
            </div>
          </div>
        </Radio>
      ))}
    </RadioGroup>
  );
}

export interface CheckoutResult {
  orderId: number;
  gateway: string;
  paymentUrl?: string;
  instructions?: { amountUsd: number; amountIrr: number; usdtWallet: string; cardNumber: string };
}

/** Sends the user to the gateway, or opens the manual-transfer modal. */
export function useCheckoutRedirect() {
  const [manual, setManual] = useState<CheckoutResult | null>(null);
  const handle = (result: CheckoutResult) => {
    if (result.paymentUrl) window.location.href = result.paymentUrl;
    else setManual(result);
  };
  return { handle, modal: <ManualPaymentModal result={manual} onClose={() => setManual(null)} /> };
}

export function ManualPaymentModal({ result, onClose, onSubmitted }: { result: CheckoutResult | null; onClose: () => void; onSubmitted?: () => void }) {
  const router = useRouter();
  const [receipt, setReceipt] = useState("");
  const [loading, setLoading] = useState(false);
  const ins = result?.instructions;

  const submit = async () => {
    if (!result) return;
    setLoading(true);
    try {
      await api(`/orders/${result.orderId}/receipt`, { method: "POST", body: { receipt } });
      toast.success("رسید ثبت شد؛ پس از تایید، سفارش شما فعال می‌شود");
      setReceipt("");
      onClose();
      if (onSubmitted) onSubmitted();
      else router.push("/orders");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={!!result} onClose={onClose} size="lg" placement="center">
      <ModalContent>
        <ModalHeader>پرداخت دستی سفارش #{result?.orderId}</ModalHeader>
        <ModalBody className="flex flex-col gap-4">
          {ins && (
            <>
              <p className="text-sm text-default-500 leading-7">
                مبلغ <b className="text-foreground ltr inline-block">{usd(ins.amountUsd)}</b> را به آدرس تتر زیر، یا معادل ریالی آن (
                <b className="text-foreground">{toman(ins.amountIrr)}</b>) را به کارت زیر واریز کنید و سپس شناسه تراکنش یا شماره پیگیری را ثبت کنید.
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-default-500">آدرس کیف پول USDT (TRC20)</span>
                <Snippet symbol="" variant="bordered" className="ltr" classNames={{ pre: "truncate" }}>
                  {ins.usdtWallet}
                </Snippet>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-default-500">شماره کارت</span>
                <Snippet symbol="" variant="bordered" className="ltr">
                  {ins.cardNumber}
                </Snippet>
              </div>
            </>
          )}
          <Textarea label="شناسه تراکنش / شماره پیگیری و توضیحات" value={receipt} onValueChange={setReceipt} minRows={3} variant="bordered" />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>
            بعدا ثبت می‌کنم
          </Button>
          <Button color="primary" isLoading={loading} isDisabled={receipt.trim().length < 5} onPress={submit}>
            ثبت رسید
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}