import { useCallback, useEffect, useState } from 'react';
import { getTemplateById } from '../templates/templateRegistry';
import styles from './OverlayRoot.module.css';

export function OverlayRoot() {
  const [templateId, setTemplateId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const id = await window.desktopSkins.getSelectedTemplate();
    setTemplateId(id);
  }, []);

  useEffect(() => {
    void refresh();
    const off = window.desktopSkins.onSelectionChanged((id) =>
      setTemplateId(id),
    );
    return off;
  }, [refresh]);

  const Template = getTemplateById(templateId);

  return (
    <div className={styles.root}>
      {Template ? (
        <Template />
      ) : (
        <div className={styles.empty}>
          <p>No scene applied.</p>
          <p className={styles.hint}>
            Press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>M</kbd> to open the menu
            and choose a template.
          </p>
        </div>
      )}
    </div>
  );
}
