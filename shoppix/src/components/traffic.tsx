// src/components/traffic.tsx

"use client";

import { useEffect, useMemo, useState } from "react";

type LightColor = "red" | "yellow" | "green";

const sequence: ReadonlyArray<LightColor> = ["red", "green", "yellow"];

const durations: Record<LightColor, number> = {
  red: 4000,
  green: 4000,
  yellow: 1500,
};

function getNextLight(current: LightColor): LightColor {
  const currentIndex = sequence.indexOf(current);
  const nextIndex = (currentIndex + 1) % sequence.length;
  return sequence[nextIndex];
}

function lightClasses(isActive: boolean, color: LightColor) {
  const base =
    "h-16 w-16 rounded-full border border-slate-300 transition-all duration-300";
  const activeMap: Record<LightColor, string> = {
    red: "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.45)]",
    yellow: "bg-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.45)]",
    green: "bg-green-500 shadow-[0_0_30px_rgba(34,197,94,0.45)]",
  };

  return `${base} ${isActive ? activeMap[color] : "bg-slate-200"}`;
}

export default function Traffic() {
  const [currentLight, setCurrentLight] = useState<LightColor>("red");
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning) return;

    const timeout = window.setTimeout(() => {
      setCurrentLight((prev) => getNextLight(prev));
    }, durations[currentLight]);

    return () => window.clearTimeout(timeout);
  }, [currentLight, isRunning]);

  const statusLabel = useMemo(() => {
    switch (currentLight) {
      case "red":
        return "Stop";
      case "yellow":
        return "Caution";
      case "green":
        return "Go";
      default:
        return "Standby";
    }
  }, [currentLight]);

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-950">Traffic Light</h2>
        <p className="mt-1 text-sm text-slate-600">
          A simple client-side traffic light simulation built without external
          state machine dependencies.
        </p>
      </div>

      <div className="mx-auto flex w-fit flex-col gap-4 rounded-[2rem] bg-slate-900 p-5">
        <div className={lightClasses(currentLight === "red", "red")} />
        <div className={lightClasses(currentLight === "yellow", "yellow")} />
        <div className={lightClasses(currentLight === "green", "green")} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Current state</p>
          <p className="text-lg font-semibold capitalize text-slate-950">
            {currentLight} — {statusLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRunning((prev) => !prev)}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {isRunning ? "Pause" : "Resume"}
        </button>
      </div>
    </section>
  );
}