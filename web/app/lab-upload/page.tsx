"use client";

import { useCallback, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";

/**
 * Lab Audio Uploader — gated web route (owner/A handoff 2026-09-14).
 *
 * Ports the standalone lab_uploader.html into the site. Access is the
 * server-checked shared upload code: the `lab-upload` edge function verifies it
 * (sha256 vs lab_upload_config) and mints a one-shot signed upload URL per file;
 * the service-role key never reaches the browser. Files land in the private
 * `lab-audio-source` staging bucket and a manifest row is logged server-side.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const FN = `${SUPABASE_URL}/functions/v1/lab-upload`;

const ACCEPT =
  "audio/*,video/*,.wav,.aif,.aiff,.flac,.pcm,.raw,.bwf,.w64,.caf,.mov,.mxf,.mkv,.mp4";

type Status = "wait" | "up" | "ok" | "err";
type QueueItem = { file: File; canonical: string | null; status: Status; err?: string };

const fnHeaders = () => ({
  "content-type": "application/json",
  apikey: ANON,
  authorization: `Bearer ${ANON}`,
});

function fmtSize(b: number): string {
  return b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${(b / 1024).toFixed(0)} KB`;
}

const STATUS_LABEL: Record<Status, string> = {
  wait: "Queued",
  up: "Uploading…",
  ok: "Uploaded ✓",
  err: "Failed",
};
const STATUS_CLASS: Record<Status, string> = {
  wait: "text-text-muted",
  up: "text-blue",
  ok: "text-green",
  err: "text-red",
};

export default function LabUploadPage() {
  const [code, setCode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateErr, setGateErr] = useState<string | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hot, setHot] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const unlock = useCallback(async () => {
    const c = code.trim();
    if (!c) return;
    setGateBusy(true);
    setGateErr(null);
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: fnHeaders(),
        body: JSON.stringify({ code: c, verify: true }),
      });
      if (r.ok) {
        setUnlocked(true);
      } else {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        setGateErr(
          j.error === "invalid_code"
            ? "That code was not accepted."
            : j.error === "upload_disabled"
              ? "Uploads are currently disabled."
              : `Could not verify: ${j.error ?? r.status}`,
        );
      }
    } catch {
      setGateErr("Network error reaching the uploader service.");
    } finally {
      setGateBusy(false);
    }
  }, [code]);

  const onGateKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") void unlock();
    },
    [unlock],
  );

  const addFiles = useCallback((fl: FileList | null) => {
    if (!fl || fl.length === 0) return;
    const next: QueueItem[] = Array.from(fl).map((file) => ({
      file,
      canonical: null,
      status: "wait" as Status,
    }));
    setQueue((q) => [...q, ...next]);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setHot(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const uploadAll = useCallback(async () => {
    setUploading(true);
    const sb = getSupabaseBrowser();
    const items = queue;
    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "ok") continue;
      setQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "up" } : it)));
      try {
        const file = items[i].file;
        const contentType = file.type || "application/octet-stream";
        const r = await fetch(FN, {
          method: "POST",
          headers: fnHeaders(),
          body: JSON.stringify({ code: code.trim(), filename: file.name, size: file.size, contentType }),
        });
        if (!r.ok) {
          const j = (await r.json().catch(() => ({}))) as { error?: string; detail?: string };
          throw new Error(j.detail ?? j.error ?? String(r.status));
        }
        const { bucket, path, token } = (await r.json()) as {
          bucket: string;
          path: string;
          token: string;
        };
        const { error } = await sb.storage.from(bucket).uploadToSignedUrl(path, token, file, { contentType });
        if (error) throw error;
        setQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "ok", canonical: path } : it)));
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setQueue((q) => q.map((it, idx) => (idx === i ? { ...it, status: "err", err: msg } : it)));
      }
    }
    setUploading(false);
  }, [queue, code]);

  const doneCount = queue.filter((q) => q.status === "ok").length;
  const failed = queue.filter((q) => q.status === "err");

  return (
    <div className="mx-auto flex max-w-2xl flex-col px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">
        Lab Audio Uploader
      </h1>
      <p className="mt-3 text-sm text-text-sub">
        Private upload for full-resolution source audio/video. Files go straight to secured storage.
        Enter the access code to begin.
      </p>

      {!unlocked ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-4">
          <label htmlFor="code" className="block text-xs font-medium uppercase tracking-wide text-text-sub">
            Access code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="code"
              type="password"
              autoComplete="off"
              placeholder="enter the upload code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={onGateKey}
              className="w-full rounded-md border border-border bg-surface-raised px-3 py-2.5 text-foreground focus:border-amber"
            />
            <button
              type="button"
              onClick={() => void unlock()}
              disabled={gateBusy || !code.trim()}
              className="shrink-0 rounded-md bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep disabled:opacity-60"
            >
              {gateBusy ? "Checking…" : "Unlock"}
            </button>
          </div>
          {gateErr ? (
            <p role="alert" className="mt-3 rounded-md border border-red/40 bg-red/10 px-3 py-2 text-sm text-foreground">
              {gateErr}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="mt-8 rounded-xl border border-border bg-surface p-4">
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInput.current?.click();
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                setHot(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setHot(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setHot(false);
              }}
              onDrop={onDrop}
              className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                hot ? "border-amber bg-surface-raised text-foreground" : "border-border text-text-muted"
              }`}
            >
              <div className="text-base font-semibold text-foreground">Drop audio / video files here</div>
              <div className="mt-1 text-xs text-text-muted">
                or click to choose — any format (WAV, AIFF, FLAC, PCM/RAW, MOV, MXF…), up to ~256 MB each
              </div>
            </div>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept={ACCEPT}
              onChange={(e) => addFiles(e.target.files)}
              className="hidden"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {queue.length
                  ? `${queue.length} file${queue.length > 1 ? "s" : ""} queued`
                  : "No files selected"}
              </span>
              <button
                type="button"
                onClick={() => void uploadAll()}
                disabled={queue.length === 0 || uploading}
                className="rounded-md bg-amber px-4 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-amber-deep disabled:opacity-60"
              >
                {uploading ? "Uploading…" : "Upload all"}
              </button>
            </div>
          </div>

          {queue.length ? (
            <div className="mt-3 rounded-xl border border-border bg-surface p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-text-sub">
                Queue{doneCount ? ` · ${doneCount}/${queue.length} done` : ""}
              </div>
              <div className="mt-1">
                {queue.map((q, i) => (
                  <div
                    key={`${q.file.name}-${i}`}
                    className="flex items-center justify-between gap-3 border-t border-border py-2 text-sm first:border-t-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-foreground">{q.file.name}</div>
                      <div className="truncate font-mono text-[11px] text-text-muted">
                        {q.canonical ? `→ ${q.canonical}` : fmtSize(q.file.size)}
                      </div>
                    </div>
                    <div className={`shrink-0 text-xs font-semibold ${STATUS_CLASS[q.status]}`}>
                      {STATUS_LABEL[q.status]}
                    </div>
                  </div>
                ))}
              </div>
              {failed.length ? (
                <p className="mt-3 text-xs text-red">
                  {failed.length} file(s) failed:{" "}
                  {failed.map((f) => `${f.file.name} (${f.err ?? "error"})`).join(", ")}
                </p>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
