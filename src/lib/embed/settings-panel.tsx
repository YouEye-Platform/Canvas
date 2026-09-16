"use client";

import React from "react";

/**
 * SettingsPanel kit (Plan 1 Workstream E0 / E6) — primitives for a native app's
 * settings panel that renders *inside* YouEye Settings via the app's
 * `/embed/settings` surface. The host (YE-UI) renders the section header and the
 * quiet "from <App>" attribution; these render **section content only** — no page
 * title, no back button, no outer box — on the Settings tokens delivered to the
 * embed (`?theme=&mode=` + the Canvas globals).
 */

export function SettingsPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex flex-col gap-6 text-foreground ${className}`}>{children}</div>;
}

export function SettingsGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col">
      {title && <h3 className="mb-2 text-[13px] font-semibold text-foreground">{title}</h3>}
      <div className="overflow-hidden rounded-xl border border-border bg-card">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  control,
  htmlFor,
}: {
  label: string;
  description?: string;
  control?: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {control}
    </div>
  );
}

export function SettingsToggle({
  checked,
  onChange,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-[22px] w-[38px] flex-none items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-input"
      }`}
    >
      <span
        className={`pointer-events-none block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function SettingsSelect<T extends string>({
  value,
  options,
  onChange,
  disabled,
  id,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as T)}
      className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
}) {
  const styles: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "border border-border bg-background hover:bg-accent",
    ghost: "text-muted-foreground hover:bg-accent",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
