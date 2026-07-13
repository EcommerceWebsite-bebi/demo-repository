import { query } from '@/lib/db';

const REWARDS = [10, 10, 10, 10, 15, 15, 50] as const;
const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

interface WalletRow {
  coins: number;
  current_streak: number;
  last_checkin_date: string | null;
  total_gifts: number;
  reminder_enabled: number;
  reminder_time: string;
}

interface TaskRow {
  id: number;
  code: string;
  title: string;
  description: string;
  reward: number;
  href: string;
  duration_seconds: number;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export function vietnamDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function dateBefore(date: string, days: number) {
  const value = new Date(`${date}T12:00:00+07:00`);
  value.setUTCDate(value.getUTCDate() - days);
  return vietnamDate(value);
}

export async function ensureDailyWallet(userId: number) {
  await query.run('INSERT OR IGNORE INTO daily_wallets (user_id) VALUES (?)', [userId]);
}

export async function getDailyState(userId: number) {
  await ensureDailyWallet(userId);
  const today = vietnamDate();
  const yesterday = dateBefore(today, 1);
  const wallet = await query.get<WalletRow>(`
    SELECT coins, current_streak, last_checkin_date, total_gifts, reminder_enabled, reminder_time
    FROM daily_wallets WHERE user_id = ?
  `, [userId]);

  const tasks = await query.all<TaskRow>(`
    SELECT t.id, t.code, t.title, t.description, t.reward, t.href, t.duration_seconds,
           ut.status, ut.started_at, ut.completed_at
    FROM daily_tasks t
    LEFT JOIN user_daily_tasks ut
      ON ut.task_id = t.id AND ut.user_id = ? AND ut.task_date = ?
    WHERE t.is_active = 1
    ORDER BY t.sort_order ASC, t.id ASC
  `, [userId, today]);

  const checkedToday = wallet?.last_checkin_date === today;
  const streakIsActive = checkedToday || wallet?.last_checkin_date === yesterday;
  const completedStreakDays = streakIsActive ? Number(wallet?.current_streak || 0) : 0;
  const currentDay = checkedToday
    ? Math.max(1, completedStreakDays)
    : wallet?.last_checkin_date === yesterday
      ? (completedStreakDays % 7) + 1
      : 1;

  return {
    today,
    wallet: {
      coins: Number(wallet?.coins || 0),
      currentStreak: completedStreakDays,
      currentDay,
      checkedToday,
      totalGifts: Number(wallet?.total_gifts || 0),
      reminderEnabled: Boolean(wallet?.reminder_enabled),
      reminderTime: wallet?.reminder_time || '09:00',
    },
    rewards: REWARDS.map((reward, index) => ({ day: index + 1, reward })),
    tasks: tasks.map((task) => ({
      id: task.id,
      code: task.code,
      title: task.title,
      description: task.description,
      reward: Number(task.reward),
      href: task.href,
      durationSeconds: Number(task.duration_seconds),
      status: task.status || 'available',
      startedAt: task.started_at,
      completedAt: task.completed_at,
    })),
  };
}

export async function performCheckIn(userId: number) {
  await ensureDailyWallet(userId);
  const today = vietnamDate();
  const yesterday = dateBefore(today, 1);
  const wallet = await query.get<WalletRow>(`
    SELECT coins, current_streak, last_checkin_date, total_gifts, reminder_enabled, reminder_time
    FROM daily_wallets WHERE user_id = ?
  `, [userId]);

  if (wallet?.last_checkin_date === today) {
    return { awarded: false, reward: 0, state: await getDailyState(userId) };
  }

  const streakDay = wallet?.last_checkin_date === yesterday
    ? (Number(wallet.current_streak) % 7) + 1
    : 1;
  const reward = REWARDS[streakDay - 1];
  const insert = await query.run(`
    INSERT OR IGNORE INTO daily_checkins (user_id, checkin_date, streak_day, reward)
    VALUES (?, ?, ?, ?)
  `, [userId, today, streakDay, reward]);

  if (insert.changes === 0) {
    return { awarded: false, reward: 0, state: await getDailyState(userId) };
  }

  await query.run(`
    UPDATE daily_wallets
    SET coins = coins + ?, current_streak = ?, last_checkin_date = ?,
        total_gifts = total_gifts + ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `, [reward, streakDay, today, streakDay === 7 ? 1 : 0, userId]);

  return { awarded: true, reward, state: await getDailyState(userId) };
}

export async function setDailyReminder(userId: number, enabled: boolean) {
  await ensureDailyWallet(userId);
  await query.run(`
    UPDATE daily_wallets
    SET reminder_enabled = ?, updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
  `, [enabled ? 1 : 0, userId]);
  return getDailyState(userId);
}

export async function startDailyTask(userId: number, code: string) {
  await ensureDailyWallet(userId);
  const today = vietnamDate();
  const task = await query.get<TaskRow>('SELECT * FROM daily_tasks WHERE code = ? AND is_active = 1', [code]);
  if (!task) return null;

  await query.run(`
    INSERT OR IGNORE INTO user_daily_tasks (user_id, task_id, task_date, status)
    VALUES (?, ?, ?, 'in_progress')
  `, [userId, task.id, today]);

  const progress = await query.get<TaskRow>(`
    SELECT t.*, ut.status, ut.started_at, ut.completed_at
    FROM daily_tasks t
    JOIN user_daily_tasks ut ON ut.task_id = t.id
    WHERE t.id = ? AND ut.user_id = ? AND ut.task_date = ?
  `, [task.id, userId, today]);

  return progress ? {
    code: progress.code,
    title: progress.title,
    reward: Number(progress.reward),
    href: progress.href,
    durationSeconds: Number(progress.duration_seconds),
    status: progress.status,
    startedAt: progress.started_at,
  } : null;
}

export async function completeDailyTask(userId: number, code: string) {
  await ensureDailyWallet(userId);
  const today = vietnamDate();
  const task = await query.get<TaskRow>(`
    SELECT t.*, ut.status, ut.started_at, ut.completed_at
    FROM daily_tasks t
    JOIN user_daily_tasks ut ON ut.task_id = t.id
    WHERE t.code = ? AND t.is_active = 1 AND ut.user_id = ? AND ut.task_date = ?
  `, [code, userId, today]);

  if (!task) return { ok: false as const, reason: 'not_started' as const };
  if (task.status === 'completed') {
    return { ok: true as const, awarded: false, reward: 0, state: await getDailyState(userId) };
  }

  const startedAt = new Date(`${task.started_at}Z`).getTime();
  const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < Number(task.duration_seconds)) {
    return {
      ok: false as const,
      reason: 'too_early' as const,
      remainingSeconds: Math.max(1, Number(task.duration_seconds) - Math.max(0, elapsedSeconds)),
    };
  }

  const update = await query.run(`
    UPDATE user_daily_tasks
    SET status = 'completed', completed_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND task_id = ? AND task_date = ? AND status = 'in_progress'
  `, [userId, task.id, today]);

  if (update.changes > 0) {
    await query.run(`
      UPDATE daily_wallets SET coins = coins + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `, [task.reward, userId]);
  }

  return {
    ok: true as const,
    awarded: update.changes > 0,
    reward: update.changes > 0 ? Number(task.reward) : 0,
    state: await getDailyState(userId),
  };
}
