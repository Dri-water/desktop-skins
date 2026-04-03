import { useCallback, useEffect, useState } from 'react';
import type { TemplateMeta } from '../shared/ipc';
import styles from './TemplatePicker.module.css';

export function TemplatePicker() {
  const [templates, setTemplates] = useState<TemplateMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    const [list, current] = await Promise.all([
      window.desktopSkins.getTemplates(),
      window.desktopSkins.getSelectedTemplate(),
    ]);
    setTemplates(list);
    setSelectedId(current);
  }, []);

  useEffect(() => {
    void load();
    return window.desktopSkins.onSelectionChanged((id) => setSelectedId(id));
  }, [load]);

  async function apply() {
    if (!selectedId) return;
    setApplying(true);
    try {
      await window.desktopSkins.applyTemplate(selectedId);
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Desktop Skins</p>
        <h1 className={styles.title}>Choose a scene</h1>
        <p className={styles.subtitle}>
          Curated overlay templates — pick one preset, apply it, and it floats
          over your desktop.
        </p>
      </header>

      <section className={styles.grid} aria-label="Templates">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.card} ${selectedId === t.id ? styles.cardActive : ''}`}
            onClick={() => setSelectedId(t.id)}
            aria-pressed={selectedId === t.id}
          >
            <div className={styles.preview} aria-hidden>
              {t.id === 'modern-center-clock' ? (
                <div className={styles.previewClock}>
                  <span className={styles.previewTime}>09:41</span>
                  <span className={styles.previewDate}>Tuesday, April 3</span>
                </div>
              ) : (
                <div className={styles.previewPlaceholder} />
              )}
            </div>
            <div className={styles.cardBody}>
              <h2 className={styles.cardTitle}>{t.name}</h2>
              <p className={styles.cardDesc}>{t.description}</p>
            </div>
          </button>
        ))}
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.primary}
            disabled={!selectedId || applying}
            onClick={() => void apply()}
          >
            {applying ? 'Applying…' : 'Apply scene'}
          </button>
          <button
            type="button"
            className={styles.ghost}
            onClick={() => void window.desktopSkins.quitApp()}
          >
            Quit app
          </button>
        </div>
        <p className={styles.hint}>
          <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> opens this menu anytime.
          Use the tray menu to toggle the overlay or quit.
        </p>
      </footer>
    </div>
  );
}
