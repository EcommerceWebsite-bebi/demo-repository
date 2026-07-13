"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Timer } from "lucide-react";
import { API_URL, useApp } from "../AppContext";

interface Mission {
  code: string;
  title: string;
  reward: number;
  durationSeconds: number;
  expiresAt: number;
}

export default function MissionTracker() {
  const { token } = useApp();
  const [mission, setMission] = useState<Mission | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const completing = useRef(false);

  useEffect(() => {
    if (!token) return;
    const raw = sessionStorage.getItem("mouseee-active-mission");
    if (!raw) return;

    let active: Mission;
    try {
      active = JSON.parse(raw) as Mission;
      setMission(active);
    } catch {
      sessionStorage.removeItem("mouseee-active-mission");
      return;
    }

    let finished = false;
    let timer: number | undefined;
    let dismissTimer: number | undefined;

    async function complete() {
      if (finished || completing.current) return;
      completing.current = true;
      try {
        const response = await fetch(`${API_URL}/api/daily/tasks/${active.code}/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.status === 409 && result.reason === "too_early") {
          active = { ...active, expiresAt: Date.now() + result.remainingSeconds * 1000 };
          sessionStorage.setItem("mouseee-active-mission", JSON.stringify(active));
          setMission(active);
          return;
        }
        if (!response.ok || !result.success) throw new Error(result.message || "Không thể nhận thưởng");
        finished = true;
        if (timer !== undefined) window.clearInterval(timer);
        sessionStorage.removeItem("mouseee-active-mission");
        setDone(true);
        window.dispatchEvent(new Event("mouseee-rewards-updated"));
        dismissTimer = window.setTimeout(() => {
          setDone(false);
          setMission(null);
        }, 3500);
      } catch (error) {
        console.error("Complete mission error:", error);
      } finally {
        completing.current = false;
      }
    }

    function tick() {
      if (finished) return;
      const left = Math.max(0, Math.ceil((active.expiresAt - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) void complete();
    }

    tick();
    timer = window.setInterval(tick, 1000);
    return () => {
      finished = true;
      window.clearInterval(timer);
      if (dismissTimer !== undefined) window.clearTimeout(dismissTimer);
    };
  }, [token]);

  if (!mission) return null;
  const elapsed = Math.max(0, mission.durationSeconds - seconds);
  const progress = done ? 100 : Math.max(8, (elapsed / Math.max(1, mission.durationSeconds)) * 100);

  return <aside className={`mission-tracker ${done ? "complete" : ""}`}>
    {done ? <Check/> : <Timer/>}
    <span><small>{done ? "Nhiệm vụ hoàn thành" : mission.title}</small><strong>{done ? `+${mission.reward} Xu MOUSEEE` : `00:${String(seconds).padStart(2, "0")}`}</strong></span>
    <i style={{ width: `${progress}%` }}/>
  </aside>;
}
