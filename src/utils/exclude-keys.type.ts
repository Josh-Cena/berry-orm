export type ExcludeKeys<T, Condition> = {
  [K in keyof T]: T[K] extends Condition ? never : K;
}[keyof T];
