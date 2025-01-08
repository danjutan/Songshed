import { combine } from "@atlaskit/pragmatic-drag-and-drop/dist/types/entry-point/combine";
import type { CleanupFn } from "@atlaskit/pragmatic-drag-and-drop/dist/types/entry-point/types";
import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

type DraggableArgs = Omit<Parameters<typeof draggable>[0], "element">;
export function makeDraggableRefHandler(
  element: HTMLElement,
  props: DraggableArgs,
  prevCleanup?: CleanupFn,
) {
  const cleanup = draggable({ ...props, element });
  return prevCleanup ? combine(cleanup, prevCleanup) : cleanup;
}

type DroppableArgs = Omit<
  Parameters<typeof dropTargetForElements>[0],
  "element"
>;
export function makeDroppableRefHandler(
  element: HTMLElement,
  props: DroppableArgs,
  prevCleanup?: CleanupFn,
) {
  const cleanup = dropTargetForElements({ ...props, element });
  return prevCleanup ? combine(cleanup, prevCleanup) : cleanup;
}
