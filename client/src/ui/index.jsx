import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleDashed,
  Clock3,
  LockKeyhole,
  RotateCcw,
} from "lucide-react";
import { createContext, forwardRef, useContext, useEffect, useState } from "react";

export function Button({
  variant = "secondary",
  className = "",
  children,
  ...props
}) {
  return (
    <button
      className={`btn ${variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-danger" : variant === "quiet" ? "btn-quiet" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function IconButton({ label, children, ...props }) {
  return (
    <Button aria-label={label} className="icon-btn" title={label} {...props}>
      {children}
    </Button>
  );
}
export function Field({ label, hint, error, children, className = "" }) {
  return (
    <label className={`field ${className}`}>
      <span>{label}</span>
      {children}
      {hint && <span className="help-text">{hint}</span>}
      {error && (
        <span className="field-error" role="alert">
          {error}
        </span>
      )}
    </label>
  );
}
export const Input = forwardRef(function Input(props, ref) {
  return <input ref={ref} {...props} />;
});
export const Select = forwardRef(function Select(props, ref) {
  return <select ref={ref} {...props} />;
});
export const Textarea = forwardRef(function Textarea(props, ref) {
  return <textarea ref={ref} {...props} />;
});
export function Popover({ children }) {
  return children;
}
export function Tabs({ children }) {
  return (
    <nav className="tabs" aria-label="Page sections">
      {children}
    </nav>
  );
}
export function Tooltip({ text, children }) {
  return <span title={text}>{children}</span>;
}
const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  function show(message) {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((item) => item.id !== id)),
      4500,
    );
  }
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(({ id, message }) => (
          <div className="toast" key={id}>
            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export function useToast() {
  return useContext(ToastContext);
}
export function Skeleton({ lines = 3 }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 3000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <div className="panel panel-pad" aria-live="polite">
      {Array.from({ length: lines }, (_, index) => (
        <div
          className="skeleton"
          key={index}
          style={{
            height: index === 0 ? 26 : 16,
            width: index === 0 ? "45%" : index === lines - 1 ? "65%" : "90%",
            marginBottom: 18,
          }}
        />
      ))}
      {slow && (
        <div>
          <p className="muted">The server is waking up. This may take a moment.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}
    </div>
  );
}
export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      {action}
    </div>
  );
}
const statusDetails = {
  DRAFT: [CircleDashed, "Draft"],
  SUBMITTED: [Clock3, "Submitted"],
  APPROVED: [CheckCircle2, "Approved"],
  REWORK_REQUIRED: [RotateCcw, "Rework needed"],
  LOCKED: [LockKeyhole, "Locked"],
  NOT_STARTED: [CircleDashed, "Not started"],
  ON_TRACK: [Clock3, "On track"],
  COMPLETED: [Check, "Completed"],
  ACTIVE: [Check, "Active"],
  INACTIVE: [AlertCircle, "Inactive"],
};
export function StatusGlyph({ status }) {
  const [Icon, label] = statusDetails[status] ?? [
    AlertCircle,
    status?.replaceAll("_", " ") ?? "Unknown",
  ];
  return (
    <span className="status" data-status={status}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  );
}
export function DataTable({
  headers,
  rows,
  renderRow,
  empty = "No records match these filters.",
}) {
  return rows.length ? (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((head) => (
              <th scope="col" key={head}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  ) : (
    <EmptyState title="Nothing to show" description={empty} />
  );
}
