import { useState } from "react";
import { Check, CalendarDays } from "lucide-react";
import type { Snapshot, Task } from "../../schemas/plan";
import {
  orderTasks,
  taskState,
  setTaskCompletion,
  changeDependencies,
} from "./engine";
import { prettyDate } from "../../utils/dates";
import { errorMessage } from "../../services/errors";
function TaskRow({
  task,
  snapshot,
  update,
}: {
  task: Task;
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
}) {
  const state = taskState(task, snapshot.event.date, snapshot.plan.tasks);
  const [error, setError] = useState("");
  function change(run: () => Task[]) {
    try {
      update({ ...snapshot, plan: { ...snapshot.plan, tasks: run() } });
      setError("");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <article className={`task-row ${task.completed ? "complete" : ""}`}>
      <div className="task-main">
        <label className="task-check">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) =>
              change(() =>
                setTaskCompletion(
                  snapshot.plan.tasks,
                  task.id,
                  e.target.checked,
                ),
              )
            }
          />
          <span>
            <strong>{task.title}</strong>
            <small>
              <CalendarDays size={13} />
              {prettyDate(state.due)} · {task.priority} priority
              {task.required ? " · Required" : ""}
            </small>
          </span>
        </label>
        <span className={`pill ${state.overdue ? "warning" : ""}`}>
          {task.completed ? (
            <>
              <Check size={13} />
              Complete
            </>
          ) : state.overdue ? (
            "Overdue"
          ) : state.blocked ? (
            "Prerequisites pending"
          ) : state.approaching ? (
            "Due soon"
          ) : (
            "To do"
          )}
        </span>
      </div>
      {task.dependencies.length > 0 && (
        <p className="dependency">
          After:{" "}
          {task.dependencies
            .map(
              (id) => snapshot.plan.tasks.find((t) => t.id === id)?.title ?? id,
            )
            .join(" • ")}
        </p>
      )}
      <details>
        <summary>Edit deadline & dependencies</summary>
        <form
          className="dependency-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            change(() =>
              changeDependencies(
                snapshot.plan.tasks,
                task.id,
                f.getAll("dependency").map(String),
                Number(f.get("daysBefore")),
              ),
            );
          }}
        >
          <label htmlFor={`days-${task.id}`}>Days before the event</label>
          <input
            id={`days-${task.id}`}
            name="daysBefore"
            type="number"
            min="0"
            max="3650"
            defaultValue={task.daysBefore}
          />
          <fieldset>
            <legend>Prerequisites</legend>
            {snapshot.plan.tasks
              .filter((t) => t.id !== task.id)
              .map((t) => (
                <label key={t.id}>
                  <input
                    type="checkbox"
                    name="dependency"
                    value={t.id}
                    defaultChecked={task.dependencies.includes(t.id)}
                  />
                  {t.title}
                </label>
              ))}
          </fieldset>
          <button className="button small secondary">
            Update dependencies
          </button>
        </form>
      </details>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </article>
  );
}
export default function TimelinePanel({
  snapshot,
  update,
}: {
  snapshot: Snapshot;
  update: (s: Snapshot) => void;
}) {
  const tasks = orderTasks(snapshot.plan.tasks);
  return (
    <section>
      <div className="section-heading">
        <span className="eyebrow">ONE THOUGHTFUL STEP AT A TIME</span>
        <h2>Your path to the occasion.</h2>
        <p>
          Tasks follow their prerequisites. Dates are calendar dates; overdue
          suggestions need your attention.
        </p>
      </div>
      <div className="panel task-list">
        {tasks.map((task) => (
          <TaskRow
            key={`${task.id}-${task.daysBefore}-${task.dependencies.join(",")}`}
            task={task}
            snapshot={snapshot}
            update={update}
          />
        ))}
      </div>
    </section>
  );
}
