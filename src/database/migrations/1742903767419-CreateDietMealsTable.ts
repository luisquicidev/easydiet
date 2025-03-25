import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreateDietMealsTable1742903767419 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Criar a tabela DietMeal
        await queryRunner.createTable(
            new Table({
                name: 'diet_meals',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'plan_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'sort_order',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'protein',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'carbs',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'fat',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'calories',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'how_to',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'is_customized',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'customization_reason',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'available_ingredients',
                        type: 'text',
                        isArray: true,
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // 2. Criar a tabela DietMealFood
        await queryRunner.createTable(
            new Table({
                name: 'diet_meal_foods',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'meal_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'grams',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'protein',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'carbs',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'fat',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'calories',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'alternative_group',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'sort_order',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // 3. Criar a tabela DietMealAlternative
        await queryRunner.createTable(
            new Table({
                name: 'diet_meal_alternatives',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'original_meal_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'protein',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'carbs',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'fat',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'calories',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'how_to',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'sort_order',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // 4. Criar a tabela DietMealAlternativeFood
        await queryRunner.createTable(
            new Table({
                name: 'diet_meal_alternative_foods',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'alternative_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'grams',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'protein',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'carbs',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'fat',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'calories',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'sort_order',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // Criar chaves estrangeiras
        await queryRunner.createForeignKey(
            'diet_meals',
            new TableForeignKey({
                columnNames: ['plan_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_plans',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_meal_foods',
            new TableForeignKey({
                columnNames: ['meal_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meals',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_meal_alternatives',
            new TableForeignKey({
                columnNames: ['original_meal_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meals',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_meal_alternative_foods',
            new TableForeignKey({
                columnNames: ['alternative_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meal_alternatives',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover chaves estrangeiras
        const alternativeFoodsTable = await queryRunner.getTable('diet_meal_alternative_foods');
        const alternativeIdFK = alternativeFoodsTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('alternative_id') !== -1,
        );
        if (alternativeIdFK) {
            await queryRunner.dropForeignKey('diet_meal_alternative_foods', alternativeIdFK);
        }

        const alternativesTable = await queryRunner.getTable('diet_meal_alternatives');
        const originalMealIdFK = alternativesTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('original_meal_id') !== -1,
        );
        if (originalMealIdFK) {
            await queryRunner.dropForeignKey('diet_meal_alternatives', originalMealIdFK);
        }

        const mealFoodsTable = await queryRunner.getTable('diet_meal_foods');
        const mealIdFK = mealFoodsTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('meal_id') !== -1,
        );
        if (mealIdFK) {
            await queryRunner.dropForeignKey('diet_meal_foods', mealIdFK);
        }

        const mealsTable = await queryRunner.getTable('diet_meals');
        const planIdFK = mealsTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('plan_id') !== -1,
        );
        if (planIdFK) {
            await queryRunner.dropForeignKey('diet_meals', planIdFK);
        }

        // Remover tabelas
        await queryRunner.dropTable('diet_meal_alternative_foods');
        await queryRunner.dropTable('diet_meal_alternatives');
        await queryRunner.dropTable('diet_meal_foods');
        await queryRunner.dropTable('diet_meals');
    }
}
