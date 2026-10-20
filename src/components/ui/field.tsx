import {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react";
import { cn } from "@/lib/cn";

const fieldBase =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(fieldBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldBase, className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(fieldBase, "pr-8", className)} {...props} />
));
Select.displayName = "Select";

export function Label({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: string | null }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-red-600">{children}</p>;
}
