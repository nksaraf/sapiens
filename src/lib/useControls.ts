import React from "react";
import { useControls as useLevaControls } from "leva";
import { FolderSettings, Schema, SchemaToValues } from "leva/plugin";


declare type HookSettings = {
  store?: any;
};
declare type SchemaOrFn<S extends Schema = Schema> = S | (() => S);
declare type FunctionReturnType<S extends Schema> = [
  SchemaToValues<S>,
  (
    value: {
      [K in keyof Partial<SchemaToValues<S, true>>]: any;
    }
  ) => void
];
declare type ReturnType<F extends SchemaOrFn> = F extends SchemaOrFn<infer S> ? F extends Function ? FunctionReturnType<S> : SchemaToValues<S> : never;
declare type HookReturnType<
  F extends SchemaOrFn | string,
  G extends SchemaOrFn
  > = F extends SchemaOrFn ? ReturnType<F> : ReturnType<G>;
/**
 *
 * @param schemaOrFolderName
 * @param settingsOrDepsOrSchema
 * @param folderSettingsOrDeps
 * @param depsOrUndefined
 */

export function useControls<
  S extends Schema,
  F extends string,
  G extends SchemaOrFn<S>
>(
  folderName: F,
  schema?: G,
  settings?: HookSettings | FolderSettings,
  deps?: React.DependencyList
): HookReturnType<F, G> {
  return useLevaControls(
    folderName,
    schema,
    { collapsed: true, ...settings },
    deps
  );
}
