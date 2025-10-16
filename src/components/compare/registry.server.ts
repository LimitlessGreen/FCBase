import { controllerCompareModule } from "./controller-module.server";
import { transmitterCompareModule } from "./transmitter-module.server";

import type { CompareModule } from "./compare-module";
import type { CompareModuleRegistryFromModules } from "./compare-module";

const compareModules = [
  controllerCompareModule,
  transmitterCompareModule,
] as const satisfies ReadonlyArray<CompareModule>;

export type RegisteredCompareModule = (typeof compareModules)[number];

export type CompareModuleId = RegisteredCompareModule["id"];

export type CompareModuleRegistry = CompareModuleRegistryFromModules<
  typeof compareModules
>;

export const compareModuleRegistry = compareModules.reduce(
  (accumulator, module) => {
    accumulator[module.id] = module;
    return accumulator;
  },
  {} as Partial<CompareModuleRegistry>,
) as CompareModuleRegistry;

export function getCompareModule<Id extends CompareModuleId>(id: Id) {
  const module = compareModuleRegistry[id];

  if (!module) {
    throw new Error(
      `No compare module registered for component "${id}". ` +
        "Add a compare module in src/components/compare.",
    );
  }

  return module;
}
