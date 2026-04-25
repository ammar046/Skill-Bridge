import React from "react";
import { AlertTriangle, RefreshCw, Download } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleRetry = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  handleSaveOffline = () => {
    const savedNarrative =
      localStorage.getItem("unmapped.savedNarrative") ?? "";
    const savedProfile = localStorage.getItem("unmapped.profile") ?? "";

    const lines: string[] = [
      "=== UNMAPPED — Offline Save ===",
      `Saved at: ${new Date().toISOString()}`,
      "",
      "--- Your narrative ---",
      savedNarrative || "(none saved)",
      "",
      "--- Profile JSON ---",
      savedProfile || "(none saved)",
      "",
      "--- Error ---",
      this.state.error?.message ?? "Unknown error",
      this.state.error?.stack ?? "",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unmapped-offline-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-signal-risk" />
            <h1 className="display text-2xl font-semibold text-foreground">
              Something went wrong
            </h1>
          </div>

          <div className="rounded-xl border border-signal-risk/30 bg-signal-risk-soft p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-signal-risk">
              Error
            </p>
            <p className="mt-1 font-mono text-sm text-foreground">
              {this.state.error.message}
            </p>
            {this.state.error.stack && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  Stack trace
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto text-[10px] leading-relaxed text-muted-foreground">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Your narrative has been saved to localStorage. Use "Save Offline" to
            download it before retrying so you don't lose your work.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={this.handleSaveOffline}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-hairline bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Save Offline
            </button>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-lift transition-all hover:translate-y-[-1px]"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }
}
