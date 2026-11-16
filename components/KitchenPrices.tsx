"use client";

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CURRENCY_COOKIE, type LocalPriceChoice } from "@/lib/local-price";

const KitchenPriceContext = createContext<{
  selected: LocalPriceChoice;
  choices: LocalPriceChoice[];
  choose: (code: string) => void;
} | null>(null);

function useKitchenPrice() {
  const value = useContext(KitchenPriceContext);
  if (!value) throw new Error("Kitchen price is only available on the kitchens page.");
  return value;
}

export function KitchenPrices({
  choices,
  initial,
  children,
}: {
  choices: LocalPriceChoice[];
  initial: string;
  children: ReactNode;
}) {
  const [code, setCode] = useState(initial);
  const selected = choices.find((choice) => choice.id === code) ?? choices[0];

  function choose(next: string) {
    setCode(next);
    document.cookie = `${CURRENCY_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  return (
    <KitchenPriceContext.Provider value={{ selected, choices, choose }}>{children}</KitchenPriceContext.Provider>
  );
}

export function WasPrice() {
  return <>{useKitchenPrice().selected.was}</>;
}

export function NowPrice() {
  return <>{useKitchenPrice().selected.now}</>;
}

export function FeesAnswer() {
  const { now } = useKitchenPrice().selected;
  return (
    <>
      None. {now} is the whole bill. No add-ons, no auto-renewals, no cut of anyone’s salary. You pay by card once
      your job’s approved.
    </>
  );
}

export function CurrencyFlag({ menuAlign = "left" }: { menuAlign?: "left" | "right" }) {
  const { selected, choices, choose } = useKitchenPrice();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Region, ${selected.place}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-full bg-white py-2.5 pr-3.5 pl-3.5 text-[15px] font-bold"
        style={{ color: "#231F17", boxShadow: "inset 0 0 0 1px #eadfc4, 0 1px 2px rgba(35,31,23,0.04)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#4E6B1F" strokeWidth="1.8" />
          <path
            d="M3 12h18M12 3c2.4 2.7 3.6 5.7 3.6 9s-1.2 6.3-3.6 9c-2.4-2.7-3.6-5.7-3.6-9s1.2-6.3 3.6-9z"
            stroke="#4E6B1F"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
        {selected.short}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          className={`absolute top-full z-30 mt-2 w-[340px] rounded-[22px] px-3 pt-4 pb-2 ${menuAlign === "right" ? "right-0" : "left-0"}`}
          style={{ background: "#FCFAF4", boxShadow: "0 16px 40px rgba(35,31,23,0.12)" }}
        >
          <p className="px-3 pb-2 text-[11px] font-bold tracking-[0.14em]" style={{ color: "#4E6B1F" }}>
            REGION AND CURRENCY
          </p>
          <ul id={menuId} role="listbox" aria-label="Region and currency">
            {choices.map((choice) => {
              const active = choice.id === selected.id;
              return (
                <li key={choice.id} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      choose(choice.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[16px]"
                    style={{ background: active ? "#F3EBD4" : undefined, color: "#231F17" }}
                  >
                    <span className="min-w-0 flex-1 font-bold">{choice.place}</span>
                    <span className="font-medium" style={{ color: "#5C5140" }}>
                      {choice.code} {choice.symbol}
                    </span>
                    {active ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M20 6 9 17l-5-5"
                          stroke="#4E6B1F"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <span className="w-[18px]" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
