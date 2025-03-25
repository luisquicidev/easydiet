import {MigrationInterface, QueryRunner, TableColumn} from "typeorm";

export class UpdateUserFoodPreferencesMacros1742871864467 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Adicionar apenas colunas de macronutrientes essenciais à tabela user_food_preferences
        await queryRunner.addColumns('user_food_preferences', [
            new TableColumn({
                name: 'external_id',
                type: 'integer',
                isNullable: true,
            }),
            new TableColumn({
                name: 'calories',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'carbohydrates',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'proteins',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'fats',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'source',
                type: 'varchar',
                length: '50',
                isNullable: true,
            })
        ]);

        // Criar um índice para pesquisas mais rápidas por external_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_USER_FOOD_PREFERENCES_EXTERNAL_ID" 
            ON "user_food_preferences" ("external_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover o índice
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_USER_FOOD_PREFERENCES_EXTERNAL_ID"
        `);

        // Remover as colunas adicionadas
        await queryRunner.dropColumns('user_food_preferences', [
            'external_id',
            'calories',
            'carbohydrates',
            'proteins',
            'fats',
            'source'
        ]);
    }

}
