import {
  injectSettingsState,
  type SettingsState,
} from "~/components/editor/providers/provide-settings-state";
import type { GuitarNote, NoteStack } from "~/model/data";

export function isCollapsed(
  settings: SettingsState,
  stack: Array<GuitarNote | undefined>,
  onBeat: boolean,
) {
  if (settings.collapseAll) return true;
  if (settings.collapseEmpty && stack.filter(Boolean).length === 0) return true;
  if (settings.collapseSubdivisions && !onBeat) return true;
  return false;
}

export function useIsCollapsed(
  stack: ComputedRef<Array<GuitarNote | undefined>>,
  onBeat: ComputedRef<boolean>,
) {
  const settings = injectSettingsState();

  return computed(() => {
    return isCollapsed(settings, stack.value, onBeat.value);
  });
}
