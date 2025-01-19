import {
  injectSettingsState,
  type SettingsState,
} from "../providers/state/provide-settings-state";
import type { GuitarNote, NoteStack } from "~/model/data";

export function isCollapsed(
  settings: SettingsState,
  stack: NoteStack<GuitarNote>,
  onBeat: boolean,
) {
  if (settings.collapseAll) return true;
  if (settings.collapseEmpty && stack.size === 0) return true;
  if (settings.collapseSubdivisions && !onBeat) return true;
  return false;
}

export function useIsCollapsed(stack: NoteStack<GuitarNote>, onBeat: boolean) {
  const settings = injectSettingsState();

  return computed(() => isCollapsed(settings, stack, onBeat));
}
