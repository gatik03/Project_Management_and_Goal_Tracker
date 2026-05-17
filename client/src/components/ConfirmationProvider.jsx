import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
  const [confirmation, setConfirmation] = useState(null);

  const confirm = useCallback(({ title, message, confirmLabel = "Confirm" }) => {
    return new Promise((resolve) => {
      setConfirmation({ title, message, confirmLabel, resolve });
    });
  }, []);

  function close(result) {
    confirmation?.resolve(result);
    setConfirmation(null);
  }

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
      {confirmation ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/35 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-corporate-navy">{confirmation.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{confirmation.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg border border-corporate-line px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" onClick={() => close(false)} type="button">
                Cancel
              </button>
              <button className="rounded-lg bg-corporate-blue px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700" onClick={() => close(true)} type="button">
                {confirmation.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmationContext.Provider>
  );
}

export function useConfirmation() {
  const context = useContext(ConfirmationContext);

  if (!context) {
    throw new Error("useConfirmation must be used within ConfirmationProvider");
  }

  return context;
}
