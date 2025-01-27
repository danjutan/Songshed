import {
  injectSettingsState,
  type SettingsState,
} from "../providers/state/provide-settings-state";
import type { GuitarNote, NoteStack } from "~/model/data";

export function isCollapsed(
  settings: SettingsState,
  notesInStack: number,
  onBeat: boolean,
) {
  if (settings.collapseAll) return true;
  if (settings.collapseEmpty && notesInStack === 0) return true;
  if (settings.collapseSubdivisions && !onBeat) return true;
  return false;
}

export function useIsCollapsed(notesInStack: number, onBeat: boolean) {
  const settings = injectSettingsState();

  return computed(() => isCollapsed(settings, notesInStack, onBeat));
}
