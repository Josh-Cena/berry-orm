import { AnyEntity } from ".";
import { BaseEntity } from "./base-entity.class";
import { BerryOrm } from "./berry-orm.class";
import { EntityField } from "./entity-field.type";

export class BaseFieldAccessor<
  Entity extends BaseEntity = AnyEntity,
  Field extends EntityField<Entity> = EntityField<Entity>,
> {
  constructor() {}

  apply(orm: BerryOrm, entity: Entity, field: Field) {
    let currentValue = entity[field];
    Reflect.defineProperty(entity, field, {
      configurable: true,
      get: () => {
        return this.handleGet(currentValue, orm, entity, field);
      },
      set: (newValue: Entity[Field]) => {
        currentValue = this.handleSet(
          newValue,
          currentValue,
          orm,
          entity,
          field,
        );
      },
    });
  }

  protected handleGet(
    currentValue: Entity[Field],
    orm: BerryOrm,
    entity: Entity,
    field: Field,
  ) {
    return currentValue;
  }

  protected handleSet(
    newValue: Entity[Field],
    currentValue: Entity[Field],
    orm: BerryOrm,
    entity: Entity,
    field: Field,
  ) {
    return newValue;
  }
}