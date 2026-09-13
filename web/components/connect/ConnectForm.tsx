"use client";

import { useState, type FormEvent } from "react";
import {
  CONNECT_EMAIL,
  CONNECT_NEED_LABELS,
  buildConnectMailto,
  isConnectNeed,
  type ConnectNeed,
} from "@/lib/connect";

const NEEDS = Object.keys(CONNECT_NEED_LABELS) as ConnectNeed[];

export default function ConnectForm({ from }: { from?: string }) {
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const organization = String(fd.get("organization") ?? "").trim();
    const role = String(fd.get("role") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const needRaw = String(fd.get("need") ?? "");
    const note = String(fd.get("note") ?? "").trim();

    if (!name || !organization || !email || !isConnectNeed(needRaw)) {
      setError("Name, organization, email, and what you need are required.");
      return;
    }

    setError(null);
    window.location.href = buildConnectMailto({
      name,
      organization,
      role,
      email,
      need: needRaw,
      note,
      from,
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
      <Field label="Name" name="name" autoComplete="name" required />
      <Field
        label="Organization"
        name="organization"
        autoComplete="organization"
        required
      />
      <Field label="Role" name="role" autoComplete="organization-title" />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />

      <fieldset className="space-y-2">
        <legend className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
          What you need
        </legend>
        <div className="mt-1">
          {NEEDS.map((need) => (
            <label key={need} className="connect-need">
              <input type="radio" name="need" value={need} required />
              <span className="text-sm text-foreground">
                {CONNECT_NEED_LABELS[need]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block">
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
          Note
        </span>
        <textarea
          name="note"
          rows={3}
          className="connect-textarea mt-1.5"
          placeholder="Seat count, program, or anything I should know."
        />
      </label>

      {error ? (
        <p className="text-sm text-red" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-amber px-6 py-3 text-sm font-semibold text-background transition-colors hover:bg-amber-deep sm:w-auto"
      >
        Write to me
      </button>
      <p className="text-sm text-text-muted">
        Opens your mail app to{" "}
        <a
          href={`mailto:${CONNECT_EMAIL}`}
          className="text-amber underline underline-offset-2 hover:text-amber-deep"
        >
          {CONNECT_EMAIL}
        </a>
        .
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-text-muted">
        {label}
        {required ? "" : " · optional"}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="connect-input mt-1.5"
      />
    </label>
  );
}