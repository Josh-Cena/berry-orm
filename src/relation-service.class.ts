import { BaseEntity } from ".";
import { AnyEntity } from "./any-entity.type";
import { BerryOrm } from "./berry-orm.class";
import { Collection } from "./collection.class";
import { EmptyValue } from "./empty-value.type";
import { RelationEntityRepresentation } from "./relation-entity-representation.type";
import { RelationField } from "./relation-field.type";
import { META } from "./symbols";

export class RelationService {
  constructor(private orm: BerryOrm) {}

  /**
   * Get the target relation entity from a primary key or a data object.
   * @param entity
   * @param field
   * @param reference
   * @returns
   */
  resolveRelationEntityRepresentation<Entity extends BaseEntity>(
    entity: Entity,
    field: RelationField<Entity>,
    reference: RelationEntityRepresentation,
  ) {
    const relationMeta = entity[META].fields.items[field].relation!;
    if (typeof reference == "object") {
      // TODO: Support this
      // specifying inverse relations in nested data is not supported
      delete reference[relationMeta.inverse];
      return this.orm.populate(relationMeta.target(), reference);
    } else {
      return this.orm.retrieve(relationMeta.target(), reference);
    }
  }

  /**
   * Destruct any bilateral relation on the specified field of the entity.
   * @param entity
   * @param field
   */
  clearRelations<Entity extends BaseEntity>(
    entity: Entity,
    field: RelationField<Entity>,
  ) {
    this.invokeOnRelationField(
      entity,
      field,
      (relationEntity) => {
        if (!relationEntity) return;
        this.destructRelation(entity, field, relationEntity);
        return undefined;
      },
      (relationEntities) => {
        relationEntities.forEach((relationEntity) =>
          this.destructRelation(entity, field, relationEntity),
        );
        return relationEntities;
      },
    );
  }

  /**
   * Construct a bilateral relation with the target entity on the specified
   * field of the entity.
   * @param entity
   * @param field
   * @param targetEntity
   */
  constructRelation<Entity extends BaseEntity>(
    entity: Entity,
    field: RelationField<Entity>,
    targetEntity: AnyEntity,
  ) {
    this.invokeOnRelationFieldBilateral(
      entity,
      field,
      targetEntity,
      (targetEntity) => targetEntity,
      (targetEntity, entities) => entities.add(targetEntity),
    );
  }

  /**
   * Destruct the bilateral relation with the target entity on the specified
   * field of the entity if exists.
   * @param entity
   * @param field
   * @param targetEntity
   */
  destructRelation<Entity extends BaseEntity>(
    entity: Entity,
    field: RelationField<Entity>,
    targetEntity: AnyEntity,
  ) {
    this.invokeOnRelationFieldBilateral(
      entity,
      field,
      targetEntity,
      (targetEntity, entity) => (entity == targetEntity ? undefined : entity),
      (targetEntity, entities) => {
        entities?.delete(targetEntity);
        return entities;
      },
    );
  }

  /**
   * A wrap of {@link BerryOrm.invokeOnRelationField} which makes it
   * easier to operate on the both sides of the relation.
   * @param entity
   * @param field
   * @param targetEntity
   * @param onToOne
   * @param onToMany
   */
  private invokeOnRelationFieldBilateral(
    entity: AnyEntity,
    field: string,
    targetEntity: AnyEntity,
    onToOne?: (
      targetEntity: AnyEntity,
      entity: AnyEntity | EmptyValue,
    ) => AnyEntity | EmptyValue,
    onToMany?: (
      targetEntity: AnyEntity,
      entities: Collection<AnyEntity>,
    ) => Collection<AnyEntity>,
  ) {
    const wrappedInvoke = (
      entity: AnyEntity,
      field: string,
      targetEntity: AnyEntity,
    ) =>
      this.invokeOnRelationField(
        entity,
        field,
        onToOne ? (entity) => onToOne(targetEntity, entity) : undefined,
        onToMany ? (entities) => onToMany(targetEntity, entities) : undefined,
      );

    const relationMeta = entity[META].fields.items[field].relation!;
    wrappedInvoke(entity, field, targetEntity);
    wrappedInvoke(targetEntity, relationMeta.inverse, entity);
  }

  /**
   * Invoke a callback based on the field's relation type.
   * @param entity
   * @param field
   * @param onToOne - The callback to be invoked on a to-one relation field.
   * The return value will be the value of the field.
   * @param onToMany - The callback to be invoked on a to-many relation field.
   */
  private invokeOnRelationField(
    entity: AnyEntity,
    field: string,
    onToOne?: (entity: AnyEntity | EmptyValue) => AnyEntity | EmptyValue,
    onToMany?: (entities: Collection<AnyEntity>) => void,
  ) {
    const relationMeta = entity[META].fields.items[field].relation;
    if (relationMeta?.multi) {
      if (!onToMany) return;
      const relationEntities = entity[field] as Collection<AnyEntity>;
      onToMany(relationEntities);
    } else {
      if (!onToOne) return;
      const relationEntity = entity[field] as AnyEntity | EmptyValue;
      const processed = onToOne(relationEntity);
      entity[field] = processed;
    }
  }
}