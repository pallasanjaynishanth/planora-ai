import { createId } from "./utils/id";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MapPin,
  Users,
  Download,
  Printer,
  Save,
  Plus,
  History,
  Trash2,
} from "lucide-react";
import { Brand } from "./components/Brand";
import { Landing } from "./components/Landing";
import { AuthPanel } from "./components/AuthPanel";
import { PrintSummary } from "./components/PrintSummary";
import { EventForm, exampleEvent } from "./features/events/EventForm";
import { useAuth, isFirebaseMode } from "./hooks/useAuth";
import type { EventInput } from "./schemas/event";
import type { Snapshot, Workspace } from "./schemas/plan";
import { demoDraft } from "./services/demo";
import {
  materializeDraft,
  validateSnapshot,
  validateWorkspace,
} from "./services/validation";
import {
  repository,
  type SavedRecord,
  type Cursor,
} from "./services/repository";
import { errorMessage } from "./services/errors";
import { prettyDate } from "./utils/dates";
import { revise } from "./features/scenarios/engine";
const Overview = lazy(() => import("./features/events/Overview"));
const BudgetPanel = lazy(() => import("./features/budget/BudgetPanel"));
const TimelinePanel = lazy(() => import("./features/timeline/TimelinePanel"));
const VendorPanel = lazy(() => import("./features/vendors/VendorPanel"));
const ScenarioPanel = lazy(() => import("./features/scenarios/ScenarioPanel"));
type Tab =
  | "overview"
  | "budget"
  | "timeline"
  | "vendors"
  | "scenarios"
  | "history";
type Screen = "home" | "create" | "workspace" | "library" | "auth";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "budget", label: "Budget" },
  { id: "timeline", label: "Timeline & checklist" },
  { id: "vendors", label: "Vendors" },
  { id: "scenarios", label: "What-if" },
  { id: "history", label: "Revisions" },
];
export default function App() {
  const auth = useAuth();
  return <Planner key={auth.user?.uid ?? "guest"} auth={auth} />;
}
function Planner({ auth }: { auth: ReturnType<typeof useAuth> }) {
  const [screen, setScreen] = useState<Screen>("home");
  const [tab, setTab] = useState<Tab>("overview");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [id, setId] = useState("");
  const [version, setVersion] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [cursor, setCursor] = useState<Cursor>();
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const main = useRef<HTMLElement>(null);
  const operation = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (screen !== "home") main.current?.focus();
  }, [screen]);
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  async function run(action: () => Promise<void>) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      if (mounted.current) setError(errorMessage(e));
    } finally {
      operation.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function navigate(next: Screen) {
    if (busy) return;
    setError("");
    setNotice("");
    setScreen(next);
  }
  function fresh() {
    if (
      dirty &&
      !window.confirm(
        "Start a new plan? Export or save your current plan first to keep unsaved changes.",
      )
    )
      return;
    navigate(isFirebaseMode && !auth.user ? "auth" : "create");
  }
  function begin(snapshot: Snapshot) {
    const generatedId = createId();
    setWorkspace({ snapshot, revisions: [] });
    setId(generatedId);
    setVersion(0);
    setDirty(true);
    setTab("overview");
    setScreen("workspace");
  }
  function update(snapshot: Snapshot) {
    try {
      const validated = validateSnapshot(snapshot);
      setWorkspace((w) => (w ? { ...w, snapshot: validated } : w));
      setDirty(true);
      setNotice("Updated in this workspace. Save to keep your changes.");
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  function apply(snapshot: Snapshot, label: string) {
    if (!workspace) return;
    try {
      setWorkspace(revise(workspace, snapshot, label));
      setDirty(true);
      setNotice(
        "Change applied. The previous plan is in Revisions. Save to keep this revision.",
      );
      setTab("overview");
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function generate(event: EventInput) {
    await run(async () => {
      setNotice(
        isFirebaseMode
          ? "Gemini is preparing your plan…"
          : "Preparing a deterministic example plan…",
      );
      const request = new AbortController();
      controller.current = request;
      const snapshot = isFirebaseMode
        ? await (
            await import("./lib/ai/firebase-transport")
          ).firebaseGateway.generate(event, request.signal)
        : materializeDraft(demoDraft(event), event, "demo");
      if (mounted.current && !request.signal.aborted) {
        begin(snapshot);
        setNotice("Plan ready for your review. It has not been saved yet.");
      }
    });
  }
  async function list(more = false) {
    if (isFirebaseMode && !auth.user) {
      navigate("auth");
      return;
    }
    await run(async () => {
      const page = await (await repository()).list(more ? cursor : undefined);
      if (mounted.current) {
        setRecords((prev) =>
          more
            ? [
                ...prev.filter((r) => !page.records.some((n) => n.id === r.id)),
                ...page.records,
              ]
            : page.records,
        );
        setCursor(page.next);
        setScreen("library");
        setNotice("");
      }
    });
  }
  async function save() {
    if (!workspace) return;
    const snapshot = validateWorkspace(workspace);
    await run(async () => {
      const result = await (await repository()).save(id, snapshot, version);
      if (mounted.current) {
        setVersion(result.version);
        setDirty(false);
        setNotice(
          isFirebaseMode
            ? "Firebase confirmed your plan was saved."
            : "Saved on this device. This is demo storage, not Firebase.",
        );
      }
    });
  }
  function exportJSON() {
    if (!workspace) return;
    const json = JSON.stringify(
      {
        format: "planora-v1",
        exportedAt: new Date().toISOString(),
        workspace: validateWorkspace(workspace),
      },
      null,
      2,
    );
    const url = URL.createObjectURL(
      new Blob([json], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `planora-${id}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const s = workspace?.snapshot;
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <button
          className="brand-button"
          aria-label="Planora home"
          disabled={busy}
          onClick={() => navigate("home")}
        >
          <Brand />
        </button>
        <nav aria-label="Main navigation">
          <a
            href="#how-it-works"
            onClick={() => {
              if (!busy) setScreen("home");
            }}
          >
            How it works
          </a>
          <button disabled={busy} onClick={() => void list()}>
            My occasions
          </button>
          {workspace && (
            <button disabled={busy} onClick={() => navigate("workspace")}>
              Current plan
            </button>
          )}
          {isFirebaseMode &&
            (auth.user ? (
              <button
                disabled={busy}
                onClick={() => {
                  if (
                    !dirty ||
                    window.confirm("Sign out and discard unsaved edits?")
                  )
                    void run(() => auth.signOut());
                }}
              >
                Sign out
              </button>
            ) : (
              <button
                disabled={busy || auth.loading}
                onClick={() => navigate("auth")}
              >
                Sign in
              </button>
            ))}
          <button
            className="button primary small"
            disabled={busy || auth.loading}
            onClick={fresh}
          >
            New occasion <Plus size={15} />
          </button>
        </nav>
      </header>
      <div className="mode-bar">
        {isFirebaseMode ? (
          <>
            <span className="status-dot" />
            Firebase workspace
            {auth.user?.email
              ? ` · ${auth.user.email}`
              : " · Sign in to generate and save"}
          </>
        ) : (
          <>
            <span className="status-dot" />
            DEMO EDITION · Deterministic sample plans · Saves stay in this
            browser
          </>
        )}
      </div>
      <main
        id="main"
        ref={main}
        tabIndex={-1}
        className={screen === "home" ? "" : "workspace-shell"}
      >
        {(error || auth.error) && (
          <div className="error global-alert" role="alert">
            {error || auth.error}
          </div>
        )}
        <div
          className={`live-message ${notice ? "visible" : ""}`}
          role="status"
          aria-live="polite"
        >
          {notice}
        </div>
        {screen === "home" && (
          <Landing
            firebase={isFirebaseMode}
            onCreate={fresh}
            onExample={() => {
              if (
                dirty &&
                !window.confirm(
                  "Replace the current unsaved plan with a sample?",
                )
              )
                return;
              const event = exampleEvent();
              begin(materializeDraft(demoDraft(event), event, "demo"));
              setNotice(
                "Sample loaded. All amounts are illustrative estimates.",
              );
            }}
          />
        )}
        {screen === "auth" && (
          <AuthPanel
            authenticate={auth.authenticate}
            onDone={() => {
              if (mounted.current) setScreen("create");
            }}
          />
        )}
        {screen === "create" && (
          <>
            <button
              className="text-button back"
              onClick={() => navigate("home")}
              disabled={busy}
            >
              <ArrowLeft size={16} />
              Back to the beginning
            </button>
            <div className="create-heading">
              <span className="eyebrow">YOUR NEXT BEAUTIFUL OCCASION</span>
              <h1>
                Let’s make a little <em>magic.</em>
              </h1>
              <p>Start with the essentials. Your plan can grow with you.</p>
            </div>
            <div className="panel create-panel">
              <EventForm
                onSubmit={(event) => void generate(event)}
                busy={busy}
              />
            </div>
            {busy && (
              <button
                className="button secondary"
                onClick={() => controller.current?.abort()}
              >
                Cancel generation
              </button>
            )}
          </>
        )}
        {screen === "library" && (
          <section>
            <div className="section-heading">
              <span className="eyebrow">YOUR COLLECTION</span>
              <h1>Occasions to look forward to.</h1>
              <p>
                {isFirebaseMode
                  ? "Private plans from your Firebase account, 25 at a time."
                  : "Demo plans saved in this browser. Export JSON for a portable backup."}
              </p>
            </div>
            <div className="actions">
              <button className="button primary small" onClick={fresh}>
                <Plus size={16} />
                New occasion
              </button>
              <button
                className="text-button"
                disabled={busy}
                onClick={() => void list()}
              >
                Refresh saved plans
              </button>
            </div>
            <div className="saved-grid">
              {records.map((record) => (
                <article className="panel saved-card" key={record.id}>
                  <span className="eyebrow">
                    {record.workspace.snapshot.event.type} · VERSION{" "}
                    {record.version}
                  </span>
                  <h2>{record.workspace.snapshot.event.name}</h2>
                  <p>
                    {prettyDate(record.workspace.snapshot.event.date)} ·{" "}
                    {record.workspace.snapshot.event.guests} guests
                  </p>
                  <p className="muted">
                    {record.workspace.snapshot.event.location}
                  </p>
                  <div className="actions">
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() => {
                        if (
                          dirty &&
                          !window.confirm(
                            "Open this saved plan and discard current unsaved edits?",
                          )
                        )
                          return;
                        setWorkspace(validateWorkspace(record.workspace));
                        setId(record.id);
                        setVersion(record.version);
                        setDirty(false);
                        setTab("overview");
                        navigate("workspace");
                      }}
                    >
                      Open plan <ArrowUpRight size={15} />
                    </button>
                    <button
                      className="text-button danger-text"
                      disabled={busy}
                      aria-label={`Delete ${record.workspace.snapshot.event.name}`}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Delete “${record.workspace.snapshot.event.name}” and its saved revisions? This cannot be undone.`,
                          )
                        )
                          void run(async () => {
                            await (
                              await repository()
                            ).remove(record.id, record.version);
                            if (mounted.current) {
                              setRecords((prev) =>
                                prev.filter((r) => r.id !== record.id),
                              );
                              if (id === record.id) {
                                setWorkspace(null);
                                setDirty(false);
                                setId("");
                                setVersion(0);
                              }
                              setNotice("Saved plan deleted.");
                            }
                          });
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {records.length === 0 && (
              <div className="panel empty-state">
                <h2>A blank page, full of possibilities.</h2>
                <p>Your saved occasions will appear here.</p>
              </div>
            )}
            {cursor && (
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => void list(true)}
              >
                Load older occasions
              </button>
            )}
          </section>
        )}
        {screen === "workspace" && s && workspace && (
          <>
            <fieldset className="workspace-fieldset" disabled={busy}>
              <legend className="sr-only">Planning workspace</legend>
              <div className="workspace-heading">
                <div>
                  <span className="eyebrow">
                    YOUR OCCASION, COMING TOGETHER ·{" "}
                    {s.source === "demo" ? "EXAMPLE PLAN" : "GEMINI PLAN"}
                  </span>
                  <h1>{s.event.name}</h1>
                  <div className="event-meta">
                    <span>
                      <CalendarDays size={15} />
                      {prettyDate(s.event.date)}
                    </span>
                    <span>
                      <MapPin size={15} />
                      {s.event.location}
                    </span>
                    <span>
                      <Users size={15} />
                      {s.event.guests} guests
                    </span>
                  </div>
                </div>
                <div className="save-controls">
                  <span className="save-state">
                    {dirty ? "Unsaved changes" : `Saved · version ${version}`}
                  </span>
                  <button
                    className="button primary small"
                    onClick={() => void save()}
                    disabled={!dirty || (isFirebaseMode && !auth.user)}
                  >
                    <Save size={15} />
                    {busy
                      ? "Saving…"
                      : isFirebaseMode
                        ? "Save to Firebase"
                        : "Save on this device"}
                  </button>
                  <div className="actions">
                    <button className="text-button" onClick={exportJSON}>
                      <Download size={14} />
                      Export JSON
                    </button>
                    <button
                      className="text-button"
                      onClick={() => window.print()}
                    >
                      <Printer size={14} />
                      Print summary
                    </button>
                  </div>
                </div>
              </div>
              <nav className="workspace-tabs" aria-label="Planning sections">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    aria-current={tab === t.id ? "page" : undefined}
                    onClick={() => setTab(t.id)}
                  >
                    {t.id === "history" && <History size={14} />} {t.label}
                    {t.id === "history" && workspace.revisions.length > 0
                      ? ` (${workspace.revisions.length})`
                      : ""}
                  </button>
                ))}
              </nav>
              <div className="tab-content">
                <Suspense fallback={<p role="status">Opening this section…</p>}>
                  {tab === "overview" && (
                    <Overview snapshot={s} update={update} navigate={setTab} />
                  )}
                  {tab === "budget" && (
                    <BudgetPanel snapshot={s} update={update} />
                  )}
                  {tab === "timeline" && (
                    <TimelinePanel snapshot={s} update={update} />
                  )}
                  {tab === "vendors" && (
                    <VendorPanel snapshot={s} update={update} />
                  )}
                  {tab === "scenarios" && (
                    <ScenarioPanel
                      snapshot={s}
                      apply={(next) => apply(next, "Before scenario change")}
                    />
                  )}
                  {tab === "history" && (
                    <section>
                      <div className="section-heading">
                        <span className="eyebrow">THE PATH YOU’VE TAKEN</span>
                        <h2>Every change, considered.</h2>
                        <p>
                          Scenario applications and restores keep the previous
                          snapshot here. Up to 30 revisions are retained; none
                          are silently removed.
                        </p>
                      </div>
                      {workspace.revisions.length === 0 ? (
                        <div className="panel">
                          <p>
                            No revisions yet. Apply a scenario to preserve your
                            first previous version.
                          </p>
                        </div>
                      ) : (
                        [...workspace.revisions].reverse().map((r) => (
                          <article className="panel revision-card" key={r.id}>
                            <div>
                              <h3>{r.label}</h3>
                              <p>
                                {r.snapshot.event.name} ·{" "}
                                {r.snapshot.event.date} ·{" "}
                                {r.snapshot.event.guests} guests
                              </p>
                              <small>
                                {new Date(r.savedAt).toLocaleString()}
                              </small>
                            </div>
                            <button
                              className="button secondary small"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Restore this revision? The current plan will be retained as another revision.",
                                  )
                                )
                                  apply(
                                    r.snapshot,
                                    "Before restoring a revision",
                                  );
                              }}
                            >
                              Review & restore
                            </button>
                          </article>
                        ))
                      )}
                    </section>
                  )}
                </Suspense>
              </div>
            </fieldset>
            <PrintSummary snapshot={s} />
          </>
        )}
      </main>
      <footer className="site-footer">
        <Brand />
        <p>A little intention. An unforgettable occasion.</p>
        <span>Made for moments that matter.</span>
      </footer>
    </>
  );
}
