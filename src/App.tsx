import { useEffect, useState } from 'react';
import { OverlayRoot } from './components/OverlayRoot';
import { TemplatePicker } from './components/TemplatePicker';

export default function App() {
  const [mode, setMode] = useState<'menu' | 'overlay' | null>(null);

  useEffect(() => {
    let cancelled = false;
    void window.desktopSkins.getWindowMode().then((m) => {
      if (!cancelled) setMode(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === null) {
    return (
      <div className="ds-boot">
        <p className="ds-boot-text">Loading…</p>
      </div>
    );
  }

  if (mode === 'overlay') {
    return <OverlayRoot />;
  }

  return <TemplatePicker />;
}
