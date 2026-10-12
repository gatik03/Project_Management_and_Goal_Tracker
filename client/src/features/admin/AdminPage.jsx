import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { formatDate, localToday } from "../../lib/format";
import {
  Button,
  DataTable,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  StatusGlyph,
  Textarea,
  useToast,
} from "../../ui";
import { Dialog, Sheet } from "../../ui/Overlay";

const sections = [
  { id: "people", name: "People" },
  { id: "hierarchy", name: "Hierarchy" },
  { id: "cycles", name: "Cycles" },
  { id: "unlocks", name: "Unlocks" },
  { id: "audit", name: "Audit" },
];
function readableValue(value) {
  if (value == null) return "—";
  if (Array.isArray(value))
    return value
      .map((item) =>
        typeof item === "object"
          ? `${item.title ?? item.id ?? "Goal"}: ${item.status ?? "updated"}${item.weightage ? ` (${item.weightage}%)` : ""}`
          : String(item),
      )
      .join(", ");
  if (typeof value === "object")
    return value.name ?? value.title ?? JSON.stringify(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
function AuditDiff({ log }) {
  const before = log.oldValue ?? {},
    after = log.newValue ?? {};
  if (Array.isArray(before) || Array.isArray(after))
    return (
      <div className="audit-change">
        <strong>Before</strong>
        <p>{readableValue(before)}</p>
        <strong>After</strong>
        <p>{readableValue(after)}</p>
      </div>
    );
  const keys = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].filter(
    (key) =>
      !["id", "createdAt", "updatedAt", "employee", "manager"].includes(key) &&
      JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return keys.length ? (
    <div className="audit-diff">
      {keys.map((key) => (
        <div key={key} className="audit-change">
          <strong>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</strong>
          <p>Before: {readableValue(before[key])}</p>
          <p>After: {readableValue(after[key])}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="muted">This action did not change a displayed field.</p>
  );
}
function DataState({ query, children }) {
  if (query.isPending) return <Skeleton lines={6} />;
  if (query.error)
    return (
      <div className="panel panel-pad">
        <p className="error-text">{query.error.message}</p>
        <Button onClick={() => query.refetch()}>Retry</Button>
      </div>
    );
  return children;
}
function PersonSheet({ person, managers, onClose, onSaved }) {
  const [form, setForm] = useState({
      name: person.name,
      role: person.role,
      department: person.department,
      title: person.title,
      isActive: person.isActive,
      managerId: person.managerId ?? "",
    }),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const toast = useToast();
  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateUser(person.id, {
        ...form,
        managerId: form.managerId || null,
      });
      toast("Person updated");
      onSaved();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={`Edit ${person.name}`}
    >
      <p className="page-intro">
        Update this person’s role, department, and reporting line.
      </p>
      <form className="form-grid" onSubmit={save}>
        <Field className="full" label="Name">
          <Input
            value={form.name}
            onChange={(event) => field("name", event.target.value)}
          />
        </Field>
        <Field label="Role">
          <Select
            value={form.role}
            onChange={(event) => field("role", event.target.value)}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
        <Field label="Department">
          <Input
            value={form.department}
            onChange={(event) => field("department", event.target.value)}
          />
        </Field>
        <Field className="full" label="Job title">
          <Input
            value={form.title}
            onChange={(event) => field("title", event.target.value)}
          />
        </Field>
        <Field className="full" label="Reports to">
          <Select
            value={form.managerId}
            onChange={(event) => field("managerId", event.target.value)}
          >
            <option value="">No manager</option>
            {managers
              .filter((manager) => manager.id !== person.id)
              .map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Account state">
          <Select
            value={String(form.isActive)}
            onChange={(event) =>
              field("isActive", event.target.value === "true")
            }
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </Select>
        </Field>
        {error && (
          <p className="error-text full" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions full">
          <Button type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={saving} type="submit">
            {saving ? "Saving…" : "Save person"}
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
function People() {
  const cache = useQueryClient();
  const query = useQuery({ queryKey: ["admin-users"], queryFn: api.users });
  const [search, setSearch] = useState(""),
    [role, setRole] = useState(""),
    [editing, setEditing] = useState(null);
  const people = query.data ?? [];
  const filtered = people.filter(
    (person) =>
      (!role || person.role === role) &&
      `${person.name} ${person.department} ${person.email}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <DataState query={query}>
      <div className="page-header">
        <div>
          <h1>People</h1>
          <p className="page-intro">
            Find a colleague and keep their reporting details accurate.
          </p>
        </div>
      </div>
      <div className="filter-row">
        <Field label="Search people">
          <Input
            type="search"
            placeholder="Name or department…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Field label="Role">
          <Select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">All roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </Field>
      </div>
      <div className="panel desktop-table">
        <DataTable
          headers={["Name", "Department", "Role", "Reports to", "Status", ""]}
          rows={filtered}
          renderRow={(person) => (
            <tr key={person.id}>
              <td>
                <strong>{person.name}</strong>
                <br />
                <span className="small muted">{person.email}</span>
              </td>
              <td>{person.department}</td>
              <td>{person.role.toLowerCase()}</td>
              <td>{person.manager?.name ?? "—"}</td>
              <td>
                <StatusGlyph status={person.isActive ? "ACTIVE" : "INACTIVE"} />
              </td>
              <td>
                <Button onClick={() => setEditing(person)}>Edit</Button>
              </td>
            </tr>
          )}
          empty="Try a different name, department, or role."
        />
      </div>
      <div className="mobile-records">
        {filtered.map((person) => (
          <article className="panel panel-pad" key={person.id}>
            <div className="page-header">
              <div>
                <h2>{person.name}</h2>
                <p className="muted">
                  {person.department}, {person.role.toLowerCase()}
                </p>
              </div>
              <StatusGlyph status={person.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <p className="small muted">
              Reports to {person.manager?.name ?? "no manager"}
            </p>
            <Button onClick={() => setEditing(person)}>Edit person</Button>
          </article>
        ))}
      </div>
      {editing && (
        <PersonSheet
          person={editing}
          managers={people.filter(
            (item) => item.role === "MANAGER" && item.isActive,
          )}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            cache.invalidateQueries({ queryKey: ["admin-users"] });
          }}
        />
      )}
    </DataState>
  );
}
function Hierarchy() {
  const query = useQuery({
    queryKey: ["admin-hierarchy"],
    queryFn: api.hierarchy,
  });
  return (
    <DataState query={query}>
      <div className="page-header">
        <div>
          <h1>Reporting hierarchy</h1>
          <p className="page-intro">
            Expand a manager to see the people who report directly to them.
          </p>
        </div>
      </div>
      <div className="hierarchy-list">
        {query.data?.managers?.map((manager) => (
          <details className="panel hierarchy-node" key={manager.id}>
            <summary>
              <span>
                <strong>{manager.name}</strong>
                <small>
                  {manager.department}, {manager.title}
                </small>
              </span>
              <span className="muted">{manager.reports.length} reports</span>
            </summary>
            <ul>
              {manager.reports.map((person) => (
                <li key={person.id}>
                  <strong>{person.name}</strong>
                  <span className="muted">
                    {person.title}, {person.department}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      {query.data?.unassignedEmployees?.length > 0 && (
        <section className="panel panel-pad space-before-lg">
          <h2>Unassigned employees</h2>
          <p className="muted">
            Give these people a manager from the People page.
          </p>
          {query.data.unassignedEmployees.map((person) => (
            <p key={person.id}>
              {person.name}, {person.department}
            </p>
          ))}
          <Link className="btn" to="/admin/people">
            Open people
          </Link>
        </section>
      )}
    </DataState>
  );
}
function Cycles() {
  const cache = useQueryClient(),
    toast = useToast();
  const query = useQuery({ queryKey: ["admin-cycles"], queryFn: api.cycles });
  const [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      year: new Date().getFullYear(),
      quarter: "Q1",
      startDate: localToday(),
      endDate: localToday(),
      isActive: false,
    });
  const year = new Date().getFullYear();
  const yearCycles = (query.data ?? []).filter((item) => item.year === year);
  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }
  async function save(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.saveCycle({ ...form, year: Number(form.year) });
      toast("Cycle saved");
      setOpen(false);
      cache.invalidateQueries({ queryKey: ["admin-cycles"] });
      cache.invalidateQueries({ queryKey: ["active-cycle"] });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <DataState query={query}>
      <div className="page-header">
        <div>
          <h1>Quarterly cycles</h1>
          <p className="page-intro">
            Keep the four review periods and active quarter clear for everyone.
          </p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Set a cycle
        </Button>
      </div>
      <div className="cycle-grid">
        {["Q1", "Q2", "Q3", "Q4"].map((quarter) => {
          const cycle = yearCycles.find((item) => item.quarter === quarter);
          return (
            <article className="panel panel-pad" key={quarter}>
              <h2>{quarter}</h2>
              {cycle ? (
                <>
                  <p>
                    {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
                  </p>
                  <StatusGlyph
                    status={cycle.isActive ? "ACTIVE" : "INACTIVE"}
                  />
                </>
              ) : (
                <p className="muted">No dates set for {year}.</p>
              )}
            </article>
          );
        })}
      </div>
      <Sheet open={open} onOpenChange={setOpen} title="Set quarterly cycle">
        <form className="form-grid" onSubmit={save}>
          <Field label="Year">
            <Input
              type="number"
              min="2020"
              max="2100"
              value={form.year}
              onChange={(event) => update("year", event.target.value)}
            />
          </Field>
          <Field label="Quarter">
            <Select
              value={form.quarter}
              onChange={(event) => update("quarter", event.target.value)}
            >
              {["Q1", "Q2", "Q3", "Q4"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Start date">
            <Input
              type="date"
              value={form.startDate}
              onChange={(event) => update("startDate", event.target.value)}
            />
          </Field>
          <Field label="End date">
            <Input
              type="date"
              value={form.endDate}
              onChange={(event) => update("endDate", event.target.value)}
            />
          </Field>
          <label className="full">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => update("isActive", event.target.checked)}
            />{" "}
            Mark as active quarter
          </label>
          {error && (
            <p className="error-text full" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions full">
            <Button type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={busy} type="submit">
              {busy ? "Saving…" : "Save cycle"}
            </Button>
          </div>
        </form>
      </Sheet>
    </DataState>
  );
}
function Unlocks() {
  const cache = useQueryClient(),
    toast = useToast();
  const query = useQuery({
    queryKey: ["admin-unlockable"],
    queryFn: api.unlockable,
  });
  const [selected, setSelected] = useState(null),
    [reason, setReason] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function unlock() {
    setBusy(true);
    setError("");
    try {
      await api.unlock(selected.id, reason);
      setSelected(null);
      setReason("");
      toast("Goal unlocked for rework");
      cache.invalidateQueries({ queryKey: ["admin-unlockable"] });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <DataState query={query}>
      <div className="page-header">
        <div>
          <h1>Unlock requests</h1>
          <p className="page-intro">
            Return a submitted or approved goal to the employee only with a
            recorded reason.
          </p>
        </div>
      </div>
      {query.data?.length ? (
        <div className="record-list">
          {query.data.map((goal) => (
            <article className="record" key={goal.id}>
              <div>
                <h2 className="record-title">{goal.title}</h2>
                <div className="record-meta">
                  <span>
                    {goal.employee.name}, {goal.employee.department}
                  </span>
                  <StatusGlyph status={goal.status} />
                </div>
              </div>
              <div className="record-actions">
                <Button onClick={() => setSelected(goal)}>Unlock goal</Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title="No goals need unlocking"
            description="Submitted and approved goals will appear here when they are available for an exception."
          />
        </div>
      )}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title="Unlock this goal?"
        description={
          selected
            ? `“${selected.title}” will return to the employee for rework. Your reason is saved in the audit trail.`
            : ""
        }
        actions={
          <>
            <Button onClick={() => setSelected(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={busy || reason.trim().length < 5}
              onClick={unlock}
            >
              {busy ? "Unlocking…" : "Unlock for rework"}
            </Button>
          </>
        }
      >
        <Field
          label="Reason"
          hint="At least 5 characters; explain why this exception is needed."
        >
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
      </Dialog>
    </DataState>
  );
}
function Audit() {
  const query = useQuery({ queryKey: ["admin-audit"], queryFn: api.audit });
  const [search, setSearch] = useState("");
  const logs = (query.data ?? []).filter((log) =>
    `${log.action} ${log.entityType} ${log.entityId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <DataState query={query}>
      <div className="page-header">
        <div>
          <h1>Audit history</h1>
          <p className="page-intro">
            See what changed, when it happened, and which record was affected.
          </p>
        </div>
      </div>
      <div className="filter-row">
        <Field label="Filter activity">
          <Input
            type="search"
            placeholder="Action or record…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
      </div>
      {logs.length ? (
        <ol className="audit-list">
          {logs.map((log) => (
            <li className="panel panel-pad" key={log.id}>
              <div className="page-header">
                <div>
                  <h2>{log.action.replaceAll("_", " ").toLowerCase()}</h2>
                  <p className="small muted">
                    {log.entityType}, changed by {log.actorEmail}
                  </p>
                </div>
                <time className="small muted" dateTime={log.createdAt}>
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(log.createdAt))}
                </time>
              </div>
              {log.oldValue || log.newValue ? (
                <details>
                  <summary>See before and after</summary>
                  <AuditDiff log={log} />
                </details>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <div className="panel">
          <EmptyState
            title="No activity matches"
            description="Try a different action or record name."
          />
        </div>
      )}
    </DataState>
  );
}
export default function AdminPage() {
  const { section } = useParams();
  const current = sections.find((item) => item.id === section);
  if (!current)
    return (
      <div className="panel panel-pad">
        <h1>Admin page not found</h1>
        <Link className="btn btn-primary" to="/admin/people">
          Open people
        </Link>
      </div>
    );
  return (
    <>
      <nav className="tabs" aria-label="Administration sections">
        {sections.map((item) => (
          <NavLink className="tab" key={item.id} to={`/admin/${item.id}`}>
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="space-before-section">
        {section === "people" ? (
          <People />
        ) : section === "hierarchy" ? (
          <Hierarchy />
        ) : section === "cycles" ? (
          <Cycles />
        ) : section === "unlocks" ? (
          <Unlocks />
        ) : (
          <Audit />
        )}
      </div>
    </>
  );
}
