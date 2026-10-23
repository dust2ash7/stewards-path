import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { runInstallPrompt, useInstallPrompt } from "@/components/pwa-runtime";
import { Button, PageIntro } from "@/components/ui";
import { clearImported, resetProgress, restoreBackup, setTheme, useLibrary } from "@/lib/library-store";
import { sanitizePersisted } from "@/lib/persist";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Steward's Path" }] }),
});

function download(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function SettingsPage() {
  const library = useLibrary();
  const install = useInstallPrompt();
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<ReturnType<typeof sanitizePersisted>>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <PageIntro
        kicker="Settings"
        title="This phone"
        lede="Theme, a backup you can carry, and a way to start the record over. Lessons you imported are separate from progress."
      />

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl text-ink">Appearance</h2>
        <p className="mt-2 text-base text-muted">Dark is the default. Light is for a bright day when the screen washes out.</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant={library.theme === "dark" ? "primary" : "ghost"} onClick={() => setTheme("dark")}>
            Dark
          </Button>
          <Button variant={library.theme === "light" ? "primary" : "ghost"} onClick={() => setTheme("light")}>
            Light
          </Button>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl text-ink">Install</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          On iPhone, use Share, then Add to Home Screen. In Chrome, use Install when the browser offers it. Open the
          installed app once on a signal. After that it can open without one.
        </p>
        {install.deferred ? (
          <Button className="mt-4" onClick={() => void runInstallPrompt()}>
            Install
          </Button>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl text-ink">Backup</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          The backup holds your progress, notes, field checks, and imported lessons. It does not leave this phone unless you send the
          file yourself.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button
            onClick={() =>
              download(`stewards-path-backup-${stamp()}.json`, {
                app: "Steward's Path",
                exportedAt: new Date().toISOString(),
                progress: library.progress,
                lastLessonId: library.lastLessonId,
                importedLessons: library.importedLessons,
              })
            }
          >
            Export backup
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              download(
                "lessons.json",
                library.lessons.map((lesson) => {
                  const { source: _source, ...rest } = lesson;
                  return rest;
                }),
              )
            }
          >
            Download lesson file
          </Button>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line px-4 text-base font-semibold text-ink">
            Choose a backup to restore
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void file.text().then((text) => {
                  try {
                    const parsed: unknown = JSON.parse(text);
                    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                      setMessage("That file is not a backup. Lesson JSON goes on the Import screen.");
                      return;
                    }
                    const row = parsed as Record<string, unknown>;
                    if (!("progress" in row) && !("importedLessons" in row)) {
                      setMessage("That file has no progress in it. Lesson JSON goes on the Import screen.");
                      return;
                    }
                    const clean = sanitizePersisted(parsed);
                    if (!clean) {
                      setMessage("Could not read that backup.");
                      return;
                    }
                    setPendingBackup(clean);
                    setConfirmRestore(true);
                    setMessage(null);
                  } catch {
                    setMessage("That file is not valid JSON.");
                  }
                });
              }}
            />
          </label>
        </div>
        {message ? <p className="mt-3 text-base text-ink">{message}</p> : null}
        {confirmRestore && pendingBackup ? (
          <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
            <p className="text-base text-ink">
              Replace progress and imported lessons on this phone with the backup? Starter lessons stay.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => {
                  restoreBackup(pendingBackup);
                  setConfirmRestore(false);
                  setPendingBackup(null);
                  setMessage("Backup restored on this phone.");
                }}
              >
                Restore
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setConfirmRestore(false);
                  setPendingBackup(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <h2 className="font-display text-2xl text-ink">Reset</h2>
        <p className="mt-2 text-base leading-relaxed text-muted">
          Reset progress clears finished marks, scores, bookmarks, and notes. Imported lessons stay until you clear
          them.
        </p>
        {!confirmReset ? (
          <Button variant="ghost" className="mt-4" onClick={() => setConfirmReset(true)} disabled={!library.ready}>
            Reset progress
          </Button>
        ) : (
          <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
            <p className="text-base text-ink">This cannot be undone unless you already exported a backup.</p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => {
                  resetProgress();
                  setConfirmReset(false);
                  setMessage("Progress cleared.");
                }}
              >
                Yes, reset progress
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!confirmClear ? (
          <Button variant="ghost" className="mt-3" onClick={() => setConfirmClear(true)} disabled={!library.ready}>
            Clear imported lessons
          </Button>
        ) : (
          <div className="mt-4 rounded-xl border border-line bg-canvas p-3">
            <p className="text-base text-ink">Imported lessons go away. The six starter lessons remain.</p>
            <div className="mt-3 flex gap-2">
              <Button
                onClick={() => {
                  clearImported();
                  setConfirmClear(false);
                  setMessage("Imported lessons removed.");
                }}
              >
                Yes, clear imports
              </Button>
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function stamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
