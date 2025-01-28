import type { TieType } from "~/model/data";
import type { Tie, TieStore } from "~/model/stores";

export function provideEditTie(tieStore: TieStore) {
  const functions = {
    updateType(tie: Tie, type: TieType) {
      tieStore.updateTie({ ...tie, type });
    },
    deleteTie(tie: Tie) {
      tieStore.deleteTie(tie.string, tie.from);
    },
  };
  provide(EditTieInjectionKey, functions);
  return functions;
}

const EditTieInjectionKey = Symbol() as InjectionKey<
  ReturnType<typeof provideEditTie>
>;
export function injectEditTie() {
  return inject(EditTieInjectionKey) as ReturnType<typeof provideEditTie>;
}
