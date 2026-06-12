import ipcData from './tn_ipc_sections.json';

export interface IpcSectionDetail {
  section?: string;
  act?: string;
  title?: string;
  description: string;
  max_punishment?: string;
  bailable?: boolean;
  cognizable?: boolean;
}

export const getIpcDetails = (code: string): IpcSectionDetail | null => {
  if (!code) return null;
  const normalized = code.toUpperCase().replace(/\s+/g, '');
  
  // 1. Try to match IPC sections
  for (const item of ipcData.ipc_sections_reference.sections) {
    const sectionNum = item.section.toUpperCase().replace('IPC', '').trim();
    if (normalized.includes(sectionNum)) {
      return item;
    }
  }

  // 2. Try to match Special Acts
  for (const item of ipcData.special_acts_reference.acts) {
    // E.g., 'Arms Act — Section 25' -> match 'ARMS' or '25' if distinct
    const keywords = item.act.toUpperCase().split(/[^A-Z0-9]+/);
    const keyMatch = keywords.filter(k => k.length > 2 && normalized.includes(k));
    if (keyMatch.length >= 2) {
      return item;
    }
  }

  return null;
};

// Fallback for simple string if needed
export const getIpcDescription = (code: string): string => {
  const details = getIpcDetails(code);
  if (details) {
    return details.title || details.act || details.description;
  }
  return 'Various Offenses / Other Clauses';
};
