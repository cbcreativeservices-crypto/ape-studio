"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  fmtDate,
  loadInstructor,
  loadStudent,
  type InstructorState,
  type LabRow,
  type StudentProgress,
  type StudentRow,
  type TopicProgress,
} from "@/lib/instructor";

/**
 * The instructor's class (owner 2026-10-26). Layout follows the preview the
 * owner approved: the class list on the left, the chosen student on the right.
 * Only students who shared with this instructor appear; sharing is the
 * student's choice in the app, OFF by default, for one named instructor.
 */
export default function InstructorDashboard() {
  const [state, setState] = useState<InstructorState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const load = useCallback(() => {
    setState(null);
    loadInstructor()
      .then((s) => {
        setState(s);
        if (s.kind === "ready" && s.students.length) setSelected((cur) => cur ?? s.students[0].share_id);
      })
      .catch(() => setState({ kind: "error" }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!state) return <p className="text-sm text-text-muted">Loading your class…</p>;

  if (state.kind === "signed-out") {
    return (
      <Panel>
        <p className="text-sm text-text-sub">
          This page is for verified instructors.{" "}
          <a href="/login?next=/instructor" className="text-amber underline underline-offset-2">
            Sign in
          </a>{" "}
          to see the students who shared their progress with you.
        </p>
      </Panel>
    );
  }

  if (state.kind === "not-instructor") {
    return (
      <Panel>
        <p className="text-sm text-text-sub">
          Your account isn&rsquo;t a verified instructor account, so there is no class to show.
        </p>
        <a
          href="/employers/apply"
          className="mt-4 inline-block rounded-md bg-amber px-5 py-2.5 text-sm font-semibold text-background hover:bg-amber-deep"
        >
          Apply for an instructor account
        </a>
        <p className="mt-4 text-xs text-text-muted">
          Already applied? <a href="/employers/account" className="underline underline-offset-2">See where your application stands</a>.
        </p>
      </Panel>
    );
  }

  if (state.kind === "error") {
    return (
      <Panel>
        <p className="text-sm text-text-sub">
          Couldn&rsquo;t load your class just now. This is a connection problem, not a change to your students.
        </p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:border-amber"
        >
          Try again
        </button>
      </Panel>
    );
  }

  const { code, students } = state;
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[340px_1fr]">
      <Panel>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-foreground">Students</h2>
          <span className="font-mono text-xs text-cyan">{students.length} sharing</span>
        </div>
        <div className="mt-4 rounded-lg border border-border bg-background px-4 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">Your instructor code</p>
          <p className="mt-1 font-mono text-xl tracking-[0.25em] text-amber">{code}</p>
          <p className="mt-2 text-xs leading-relaxed text-text-muted">
            Give this code to your students. In the app they turn on sharing and type it; you then appear here as
            their one instructor. They can turn it off at any time.
          </p>
        </div>

        {students.length === 0 ? (
          <p className="mt-5 text-sm leading-relaxed text-text-sub">
            No students are sharing with you yet. That is normal until your students enter your code in the app.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {students.map((s) => (
              <li key={s.share_id}>
                <StudentButton
                  s={s}
                  on={s.share_id === selected}
                  onPick={() => {
                    setSelected(s.share_id);
                    // On a phone the detail sits BELOW the list: bring it into view.
                    if (window.innerWidth < 1024) {
                      requestAnimationFrame(() =>
                        document.getElementById("instructor-detail")?.scrollIntoView({ behavior: "smooth", block: "start" }),
                      );
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selected ? (
        <div id="instructor-detail" className="scroll-mt-20">
          <StudentDetail key={selected} shareId={selected} />
        </div>
      ) : null}

      <p className="rounded-lg border border-red/30 bg-red/5 px-4 py-3 text-xs leading-relaxed text-text-sub lg:col-span-2">
        <span className="font-semibold text-red">Never shown here:</span> quiz or exam answers (only scores and
        dates), the student&rsquo;s email, and anything they keep only on their phone. Everything they completed,
        including before they shared, is shown.
      </p>
    </div>
  );
}

function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">{children}</div>;
}

function StudentButton({ s, on, onPick }: { s: StudentRow; on: boolean; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={`w-full rounded-lg border border-l-[3px] px-4 py-3 text-left transition-colors ${
        on ? "border-cyan bg-surface-raised" : "border-border border-l-cyan/60 bg-background hover:bg-surface-raised"
      }`}
    >
      <span className="block font-display text-base font-medium text-foreground">{s.student_name}</span>
      <span className="mt-0.5 block font-mono text-[11px] uppercase tracking-wide text-text-muted">
        Shared {fmtDate(s.granted_at)} · last active {fmtDate(s.last_activity)}
      </span>
      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-sub">
        <span>
          Topics <b className="text-foreground">{s.topics_complete}</b> complete of {s.topics_started}
        </span>
        <span>
          Labs <b className="text-foreground">{s.labs_complete}</b> / {s.labs_total}
        </span>
      </span>
    </button>
  );
}

function StudentDetail({ shareId }: { shareId: string }) {
  const [data, setData] = useState<StudentProgress | null>(null);
  const [failed, setFailed] = useState(false);
  // Newest request wins: a slow answer for a student no longer selected is dropped.
  const ticket = useRef(0);
  const load = useCallback(() => {
    const t = ++ticket.current;
    setFailed(false);
    setData(null);
    loadStudent(shareId)
      .then((d) => {
        if (t === ticket.current) setData(d);
      })
      .catch(() => {
        if (t === ticket.current) setFailed(true);
      });
  }, [shareId]);
  useEffect(() => {
    load();
  }, [load]);

  if (failed) {
    return (
      <Panel>
        <p className="text-sm text-text-sub">
          Couldn&rsquo;t load this student&rsquo;s progress. If they stopped sharing, they no longer appear after a
          reload; otherwise it is a connection problem.
        </p>
        <button
          type="button"
          onClick={load}
          className="mt-4 rounded-md border border-border px-4 py-2 text-sm text-foreground hover:border-amber"
        >
          Try again
        </button>
      </Panel>
    );
  }
  if (!data) {
    return (
      <Panel>
        <p className="text-sm text-text-muted">Loading progress…</p>
      </Panel>
    );
  }

  const other = data.labs.other_completed ?? [];
  return (
    <Panel>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-2xl font-semibold text-foreground">{data.student.name}</h2>
        <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
          Shared since {fmtDate(data.student.shared_since)}
        </span>
      </div>

      <SectionTitle>Topics</SectionTitle>
      {data.topics.length === 0 ? (
        <Empty>No topics yet.</Empty>
      ) : (
        <div className="space-y-3">
          {data.topics.map((t) => (
            <Topic key={t.topic_id} t={t} />
          ))}
        </div>
      )}

      <SectionTitle>
        Labs for this student&rsquo;s topics · {data.labs.complete} of {data.labs.total} complete
      </SectionTitle>
      <LabTable rows={data.labs.list} />

      {other.length ? (
        <>
          <SectionTitle>Other labs completed</SectionTitle>
          <LabTable rows={other} />
        </>
      ) : null}

      <SectionTitle>Final exams</SectionTitle>
      {data.final_exams.length === 0 ? (
        <Empty>No final exams yet.</Empty>
      ) : (
        <Table head={["Attempt", "Score", "Result", "Date"]}>
          {data.final_exams.map((f) => (
            <tr key={`${f.number}-${f.submitted_at}`}>
              <Td>#{f.number}</Td>
              <Td>
                {f.score} / {f.out_of}
              </Td>
              <Td className={f.passed ? "text-green" : "text-text-muted"}>{f.passed ? "Passed" : "Not passed"}</Td>
              <Td>{fmtDate(f.submitted_at)}</Td>
            </tr>
          ))}
        </Table>
      )}

      <SectionTitle>Credentials</SectionTitle>
      {data.credentials.length === 0 ? (
        <Empty>No credentials yet.</Empty>
      ) : (
        <Table head={["Type", "Name", "Earned"]}>
          {data.credentials.map((c) => (
            <tr key={`${c.type}-${c.name}-${c.earned_at}`}>
              <Td className="capitalize">{c.type}</Td>
              <Td>{c.name}</Td>
              <Td>{fmtDate(c.earned_at)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </Panel>
  );
}

function Topic({ t }: { t: TopicProgress }) {
  const done = t.status === "complete";
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-semibold text-foreground">{t.name}</span>
        <span
          className={`rounded-full border px-2 py-0.5 font-display text-[11px] uppercase tracking-wide ${
            done ? "border-green/40 text-green" : "border-amber/40 text-amber"
          }`}
        >
          {done ? `Complete ${fmtDate(t.completed_at)}` : "In progress"}
        </span>
        <span className="ml-auto font-mono text-xs text-text-sub">
          Study {t.study_pct}%{t.best_score != null ? ` · best quiz ${t.best_score}%` : ""}
        </span>
      </div>
      {t.methods.length ? (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
          {t.methods.map((m) => (
            <div key={m.key} className="text-xs text-text-sub">
              {m.name} · {m.completion_pct}%
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-surface-raised" aria-hidden>
                <div className="h-full bg-cyan" style={{ width: `${Math.max(0, Math.min(100, m.completion_pct))}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5 font-mono text-xs text-text-sub">
        {t.quiz_attempts.length ? (
          t.quiz_attempts.map((a) => (
            <span
              key={`${a.number}-${a.submitted_at}`}
              className={`rounded border px-2 py-0.5 ${a.practice ? "border-dashed border-border text-text-muted" : "border-border"}`}
            >
              Quiz #{a.number} · {a.score ?? "—"}%{a.practice ? " · practice" : ""} · {fmtDate(a.submitted_at)}
            </span>
          ))
        ) : (
          <span className="rounded border border-dashed border-border px-2 py-0.5 text-text-muted">No quiz attempts yet</span>
        )}
      </div>
    </div>
  );
}

function LabTable({ rows }: { rows: LabRow[] }) {
  if (!rows.length) return <Empty>No labs.</Empty>;
  return (
    <Table head={["Lab", "Completed"]}>
      {rows.map((l) => (
        <tr key={l.name}>
          <Td>{l.name}</Td>
          <Td className={l.completed_at ? "text-green" : "text-text-muted"}>
            {l.completed_at ? `✓ ${fmtDate(l.completed_at)}` : "—"}
          </Td>
        </tr>
      ))}
    </Table>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-2 mt-6 font-display text-xs font-semibold uppercase tracking-[0.14em] text-text-sub">
      {children}
    </h3>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-muted">{children}</p>;
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-border px-2 py-2 text-left font-display text-[11px] font-medium uppercase tracking-wide text-text-muted"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-border px-2 py-2 text-text-sub ${className}`}>{children}</td>;
}
