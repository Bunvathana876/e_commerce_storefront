import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "quiet";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-500",
  secondary:
    "border border-slate-300 bg-white text-slate-800 hover:border-blue-300 hover:text-blue-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
  quiet: "text-blue-700 hover:text-blue-800",
};

const baseClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none disabled:cursor-not-allowed";

type PrimaryButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
};

type PrimaryButtonLinkProps = PrimaryButtonProps &
  Omit<ComponentProps<typeof Link>, "className" | "children"> & {
    href: string;
  };

type PrimaryButtonNativeProps = PrimaryButtonProps &
  Omit<ComponentProps<"button">, "className" | "children">;

export function PrimaryButton({
  children,
  className,
  variant = "primary",
  ...props
}: PrimaryButtonNativeProps) {
  return (
    <button {...props} className={cn(baseClassName, variants[variant], className)}>
      {children}
    </button>
  );
}

export function PrimaryButtonLink({
  children,
  className,
  variant = "primary",
  ...props
}: PrimaryButtonLinkProps) {
  return (
    <Link {...props} className={cn(baseClassName, variants[variant], className)}>
      {children}
    </Link>
  );
}
