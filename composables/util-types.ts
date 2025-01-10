import type { UnwrapNestedRefs } from "vue";

export type ReactiveComputed<T> = UnwrapNestedRefs<T>;

export type PickStartsWith<T extends object, S extends string> = {
  [K in keyof T as K extends `${S}${infer R}` ? K : never]: T[K];
};

// Convert callback-style event definitions into named-tuple syntax for defineEmits
// Yes, AI wrote this
export type EmitsFromParameters<T extends object> = {
  [K in keyof T as K extends `on${infer E}`
    ? Uncapitalize<E>
    : never]-?: T[K] extends ((args: infer P) => unknown) | undefined
    ? [args: P]
    : [];
};
