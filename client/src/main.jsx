import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { apiConfigurationError } from "./lib/api.js";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {apiConfigurationError ? (
      <main className="grid min-h-screen place-items-center bg-corporate-surface px-6 text-slate-900">
        <div className="max-w-lg space-y-4">
          <h1 className="text-3xl font-semibold">Local setup needed</h1>
          <p>The API address is missing, so Goal tracker cannot start.</p>
          <p>Copy <code>client/.env.example</code> to <code>client/.env</code>, then restart the development server.</p>
          <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm">VITE_API_BASE_URL=/api</pre>
        </div>
      </main>
    ) : <App />}
  </React.StrictMode>
);
