import React from "react";
import ReactDOM from "react-dom/client";
import { AppShell } from "./app/AppShell";
import { JotaiProvider } from "./app/providers/JotaiProvider";
import { QueryProvider } from "./app/providers/QueryClientProvider";
import { SignalsProvider } from "./app/providers/SignalsProvider";
import { ThemeProvider } from "./app/providers/ThemeProvider";
import "./app/theme/global.css.ts";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <JotaiProvider>
      <QueryProvider>
        <SignalsProvider>
          <ThemeProvider>
            <AppShell />
          </ThemeProvider>
        </SignalsProvider>
      </QueryProvider>
    </JotaiProvider>
  </React.StrictMode>
);
