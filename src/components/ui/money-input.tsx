import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function MoneyInput({
  className,
  size = "md",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: "md" | "lg";
}) {
  return (
    <div className="relative">
      <span
        className={cn(
          "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-medium text-slate-400",
          size === "lg" ? "text-xl" : "text-sm",
        )}
      >
        R$
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder="0,00"
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100",
          size === "lg"
            ? "py-3 pl-12 pr-3 text-3xl font-semibold tabular-nums"
            : "py-2 pl-9 pr-3 text-sm tabular-nums",
          className,
        )}
        {...props}
      />
    </div>
  );
}
