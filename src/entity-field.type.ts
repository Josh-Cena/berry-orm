import { BaseEntity } from "./base-entity.class";
import { ExcludeKeys } from "./utils/exclude-keys.type";

export type EntityField<Entity extends BaseEntity> = string &
  ExcludeKeys<Entity, Function>;
