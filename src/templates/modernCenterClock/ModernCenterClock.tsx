import { useEffect, useState } from 'react';
import styles from './ModernCenterClock.module.css';

function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function ModernCenterClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className={styles.stage}>
      <div className={styles.card}>
        <time className={styles.time} dateTime={now.toISOString()}>
          {formatTime(now)}
        </time>
        <p className={styles.date}>{formatDate(now)}</p>
      </div>
    </div>
  );
}
