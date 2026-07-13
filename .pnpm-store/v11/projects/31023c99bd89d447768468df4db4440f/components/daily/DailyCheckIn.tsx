"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  Coins,
  Eye,
  LockKeyhole,
  Share2,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { API_URL, useApp } from "../AppContext";

interface DailyTask {
  id: number;
  code: string;
  title: string;
  description: string;
  reward: number;
  href: string;
  durationSeconds: number;
  status: "available" | "in_progress" | "completed";
  startedAt: string | null;
  completedAt: string | null;
}

interface DailyData {
  today: string;
  wallet: {
    coins: number;
    currentStreak: number;
    currentDay: number;
    checkedToday: boolean;
    totalGifts: number;
    reminderEnabled: boolean;
    reminderTime: string;
  };
  rewards: { day: number; reward: number }[];
  tasks: DailyTask[];
}

const TASK_ICONS = {
  browse: Eye,
  share: Share2,
  profile: UserRound,
} as const;

export default function DailyCheckIn() {
  const { token, isLoading: isAuthLoading, setIsAuthOpen } = useApp();
  const [data, setData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [celebrate, setCelebrate] = useState(false);
  const [celebrationReward, setCelebrationReward] = useState(0);
  const hasDataRef = useRef(false);
  const fetchedTokenRef = useRef<string | null>(null);

  const fetchDaily = useCallback(async () => {
    if (!token) {
      hasDataRef.current = false;
      setData(null);
      setLoading(false);
      return;
    }
    if (!hasDataRef.current) setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${API_URL}/api/daily`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể tải dữ liệu");
      hasDataRef.current = true;
      setData(result.data);
      setError("");
    } catch (requestError) {
      setError(requestError instanceof DOMException && requestError.name === "AbortError"
        ? "Máy chủ phản hồi chậm. Vui lòng thử lại."
        : requestError instanceof Error ? requestError.message : "Không thể tải dữ liệu điểm danh");
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      if (fetchedTokenRef.current === token) return;
      fetchedTokenRef.current = token;
      void fetchDaily();
      return;
    }
    fetchedTokenRef.current = null;
    if (!isAuthLoading) void fetchDaily();
  }, [fetchDaily, isAuthLoading]);

  useEffect(() => {
    const refresh = () => void fetchDaily();
    window.addEventListener("mouseee-rewards-updated", refresh);
    return () => window.removeEventListener("mouseee-rewards-updated", refresh);
  }, [fetchDaily]);

  async function checkIn() {
    if (!token) return setIsAuthOpen(true);
    if (!data || data.wallet.checkedToday || pending) return;
    setPending("checkin");
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/daily/check-in`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Điểm danh thất bại");
      setData(result.data);
      if (result.awarded) {
        setCelebrationReward(result.reward);
        setCelebrate(true);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Điểm danh thất bại");
    } finally {
      setPending(null);
    }
  }

  async function toggleReminder() {
    if (!token) return setIsAuthOpen(true);
    if (!data || pending) return;
    const enabled = !data.wallet.reminderEnabled;
    setPending("reminder");
    setError("");
    try {
      if (enabled && "Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
      }
      const response = await fetch(`${API_URL}/api/daily`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reminderEnabled: enabled }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể cập nhật nhắc lịch");
      setData(result.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật nhắc lịch");
    } finally {
      setPending(null);
    }
  }

  async function startTask(task: DailyTask) {
    if (!token) return setIsAuthOpen(true);
    if (task.status === "completed" || pending) return;
    setPending(task.code);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/daily/tasks/${task.code}/start`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Không thể bắt đầu nhiệm vụ");
      sessionStorage.setItem("mouseee-active-mission", JSON.stringify({
        code: result.task.code,
        title: result.task.title,
        reward: result.task.reward,
        durationSeconds: result.task.durationSeconds,
        expiresAt: Date.now() + result.task.durationSeconds * 1000,
      }));
      window.location.assign(result.task.href);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể bắt đầu nhiệm vụ");
      setPending(null);
    }
  }

  if (isAuthLoading || loading) {
    return <main className="daily-checkin-page"><div className="daily-loading">Đang tải dữ liệu điểm danh...</div></main>;
  }

  if (!token) {
    return <main className="daily-checkin-page"><section className="daily-auth-gate"><div className="daily-auth-visual"><img src="/images/daily/mouseee-mascot-transparent-v3.png" alt="Chuột MOUSEEE"/></div><div className="daily-auth-copy"><span className="daily-auth-kicker"><Sparkles/> DAILY REWARDS</span><h1>Bắt đầu hành trình tích Xu</h1><p>Đăng nhập để lưu chuỗi điểm danh, Xu và nhiệm vụ của riêng bạn trên hệ thống.</p><button className="btn-primary" onClick={() => setIsAuthOpen(true)}>Đăng nhập để điểm danh</button></div></section></main>;
  }

  if (!data) {
    return <main className="daily-checkin-page"><section className="daily-auth-gate"><h1>Chưa thể tải dữ liệu</h1><p>{error}</p><button className="btn-primary" onClick={() => void fetchDaily()}>Thử lại</button></section></main>;
  }

  const { wallet, rewards, tasks } = data;
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const todayReward = rewards.find((item) => item.day === wallet.currentDay)?.reward || 10;

  return <main className="daily-checkin-page">
    <section className="daily-heading"><div><h1>Daily Check-in</h1><p>Điểm danh mỗi ngày để tích Xu MOUSEEE và mở khóa quà hấp dẫn.</p></div><div className="wallet-panel"><div><img className="wallet-reward-art" src="/images/daily/mouseee-coins-v2.png" alt="Xu MOUSEEE"/><span><small>Số dư của tôi</small><strong>{wallet.coins.toLocaleString("vi-VN")} <em>Xu</em></strong></span></div><div><img className="wallet-reward-art gift" src="/images/daily/mystery-box-v2.png" alt="Hộp quà MOUSEEE"/><span><small>Quà đã nhận</small><strong>{wallet.totalGifts} <em>Hộp quà</em></strong></span></div><label><Bell/><span>Nhắc tôi điểm danh<br/>vào {wallet.reminderTime} mỗi ngày</span><button className={wallet.reminderEnabled ? "on" : ""} disabled={pending === "reminder"} onClick={toggleReminder} aria-label="Bật nhắc điểm danh"><i/></button></label></div></section>
    {error ? <p className="daily-error" role="alert">{error}</p> : null}
    <section className="streak-section"><div className="streak-title"><span>🔥</span><div><h2>7-Day Streak</h2><p>Duy trì 7 ngày liên tiếp để mở Hộp quà Bí ẩn đặc biệt!</p></div></div><div className="streak-journey"><img className="daily-mascot" src="/images/daily/mouseee-mascot-transparent-v3.png" alt="Chuột MOUSEEE cổ vũ bạn điểm danh"/><div className="streak-track">{rewards.map((item) => { const done = item.day <= wallet.currentStreak; const current = item.day === wallet.currentDay && !wallet.checkedToday; const milestone = item.day === 7; return <article key={item.day} className={`streak-day ${done ? "done" : ""} ${current ? "current" : ""} ${milestone ? "milestone" : ""}`}><span className="day-label">Ngày {item.day}</span><div className="reward-icon"><img src={milestone || item.day > wallet.currentDay ? "/images/daily/mystery-box-v2.png" : "/images/daily/mouseee-coins-v2.png"} alt={milestone ? "Hộp quà Bí ẩn" : "Xu MOUSEEE"}/>{done ? <span className="reward-check"><Check/></span> : null}{item.day > wallet.currentDay && !milestone ? <LockKeyhole className="lock"/> : null}</div><strong>{milestone ? "Hộp quà Bí ẩn" : `+${item.reward} Xu`}</strong>{milestone ? <small>+50 Xu</small> : null}</article>; })}</div></div>
      <button className="checkin-cta" disabled={wallet.checkedToday || pending === "checkin"} onClick={checkIn}>{wallet.checkedToday ? <><Check/> ĐÃ ĐIỂM DANH HÔM NAY</> : pending === "checkin" ? <>ĐANG NHẬN THƯỞNG...</> : <>ĐIỂM DANH NGAY <Sparkles/></>}</button><p className="checkin-note">{wallet.checkedToday ? "Hẹn gặp lại bạn vào ngày mai!" : <>Nhận <strong>+{todayReward} Xu</strong> MOUSEEE hôm nay</>}</p>
    </section>
    <section className="daily-tasks"><div className="section-heading"><div><h2>Nhiệm vụ mỗi ngày</h2><p>Hoàn thành nhiệm vụ để nhận thêm Xu MOUSEEE!</p></div><span>Hoàn thành {completedTasks}/{tasks.length}</span></div><div>{tasks.map((task) => { const Icon = TASK_ICONS[task.code as keyof typeof TASK_ICONS] || Sparkles; const completed = task.status === "completed"; return <article key={task.id} className={completed ? "completed" : ""}><div className="task-icon"><Icon/></div><div className="task-copy"><strong>{task.title}</strong><small>{task.description}</small></div><span className="task-reward"><Coins/> +{task.reward} Xu</span><span className="task-progress">{completed ? "1 / 1" : "0 / 1"}</span><button disabled={completed || pending === task.code} onClick={() => void startTask(task)}>{completed ? <><Check/> Đã nhận</> : pending === task.code ? "Đang mở..." : <>Làm ngay <ChevronRight/></>}</button></article>; })}</div></section>
    {celebrate ? <div className="reward-backdrop" role="dialog" aria-modal="true"><div className="confetti">{Array.from({ length: 18 }, (_, index) => <i key={index}/>)}</div><div className="flying-rewards"><img src="/images/daily/mouseee-coins-v2.png" alt=""/><img src="/images/daily/mystery-box-v2.png" alt=""/><img src="/images/daily/mouseee-coins-v2.png" alt=""/></div><div className="reward-modal"><button className="reward-close" onClick={() => setCelebrate(false)}><X/></button><div className="coin-burst"><img src="/images/daily/mouseee-coins-v2.png" alt="Xu MOUSEEE"/><Sparkles/></div><h2>Chúc mừng bạn đã nhận được<br/><strong>+{celebrationReward} Xu</strong> MOUSEEE!</h2><p>Chuỗi điểm danh của bạn đã được lưu trên hệ thống. Hãy quay lại vào ngày mai nhé!</p><div className="new-balance"><img src="/images/daily/mouseee-coins-v2.png" alt=""/> Số dư hiện tại: <strong>{wallet.coins.toLocaleString("vi-VN")} Xu</strong></div><button className="btn-primary" onClick={() => setCelebrate(false)}>Tuyệt vời</button></div></div> : null}
  </main>;
}
