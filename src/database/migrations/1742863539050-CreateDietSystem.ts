import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreateDietSystem1742863539050 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Criar os tipos enum necessários
        await queryRunner.query(`
            CREATE TYPE "diet_job_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed')
        `);

        await queryRunner.query(`
            CREATE TYPE "diet_goal_type_enum" AS ENUM ('weightLoss', 'maintenance', 'weightGain')
        `);

        await queryRunner.query(`
            CREATE TYPE "food_preference_type_enum" AS ENUM ('preference', 'restriction', 'allergy')
        `);

        // 2. Criar a extensão uuid-ossp se ainda não existir
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp"
        `);

        // 3. Criar tabela de referência de METs
        await queryRunner.createTable(
            new Table({
                name: 'met_references',
                columns: [
                    {
                        name: 'code',
                        type: 'varchar',
                        isPrimary: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: false,
                    },
                    {
                        name: 'met_value',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'category',
                        type: 'varchar',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        // 4. Criar tabela de dados biométricos do usuário
        await queryRunner.createTable(
            new Table({
                name: 'user_biometrics',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'weight',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'height',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'age',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'gender',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'lean_mass',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
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

        // 5. Criar tabela de atividades do usuário
        await queryRunner.createTable(
            new Table({
                name: 'user_activities',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'met_code',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'frequency_per_week',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'duration_minutes',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
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

        // 6. Criar tabela para cálculos totais de MET
        await queryRunner.createTable(
            new Table({
                name: 'user_met_calculations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'total_met',
                        type: 'decimal',
                        precision: 8,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'activity_level',
                        type: 'decimal',
                        precision: 3,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'calculation_date',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                        isNullable: false,
                    },
                    {
                        name: 'is_current',
                        type: 'boolean',
                        default: true,
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // 7. Criar tabela de objetivos nutricionais do usuário
        await queryRunner.createTable(
            new Table({
                name: 'user_nutrition_goals',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'goal_type',
                        type: 'diet_goal_type_enum',
                        isNullable: false,
                    },
                    {
                        name: 'calorie_adjustment',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'meals_per_day',
                        type: 'integer',
                        isNullable: false,
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

        // 8. Criar tabela de preferências alimentares
        await queryRunner.createTable(
            new Table({
                name: 'user_food_preferences',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'type',
                        type: 'food_preference_type_enum',
                        isNullable: false,
                    },
                    {
                        name: 'description',
                        type: 'text',
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

        // 9. Criar tabela de jobs de geração de dieta
        await queryRunner.createTable(
            new Table({
                name: 'diet_generation_jobs',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'job_type',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'diet_job_status_enum',
                        default: "'pending'",
                        isNullable: false,
                    },
                    {
                        name: 'input_data',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'result_data',
                        type: 'jsonb',
                        isNullable: true,
                    },
                    {
                        name: 'error_logs',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'progress',
                        type: 'integer',
                        default: 0,
                        isNullable: false,
                    },
                    {
                        name: 'bull_job_id',
                        type: 'varchar',
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

        // 10. Criar tabela de planos alimentares
        await queryRunner.createTable(
            new Table({
                name: 'diet_plans',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'job_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'tmb',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'get',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'met',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'getd',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'activity_level',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'total_calories',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'application',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'plan_data',
                        type: 'jsonb',
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

        // 11. Adicionar chaves estrangeiras

        // FK para user_biometrics
        await queryRunner.createForeignKey(
            'user_biometrics',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para user_activities (user)
        await queryRunner.createForeignKey(
            'user_activities',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para user_activities (met)
        await queryRunner.createForeignKey(
            'user_activities',
            new TableForeignKey({
                columnNames: ['met_code'],
                referencedColumnNames: ['code'],
                referencedTableName: 'met_references',
                onDelete: 'RESTRICT',
            }),
        );

        // FK para user_met_calculations
        await queryRunner.createForeignKey(
            'user_met_calculations',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para user_nutrition_goals
        await queryRunner.createForeignKey(
            'user_nutrition_goals',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para user_food_preferences
        await queryRunner.createForeignKey(
            'user_food_preferences',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para diet_generation_jobs
        await queryRunner.createForeignKey(
            'diet_generation_jobs',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para diet_plans (user)
        await queryRunner.createForeignKey(
            'diet_plans',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // FK para diet_plans (job)
        await queryRunner.createForeignKey(
            'diet_plans',
            new TableForeignKey({
                columnNames: ['job_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_generation_jobs',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover FKs
        const tables = [
            'diet_plans',
            'diet_generation_jobs',
            'user_food_preferences',
            'user_nutrition_goals',
            'user_met_calculations',
            'user_activities',
            'user_biometrics'
        ];

        for (const tableName of tables) {
            const table = await queryRunner.getTable(tableName);
            if (table) {
                const foreignKeys = table.foreignKeys;
                for (const foreignKey of foreignKeys) {
                    await queryRunner.dropForeignKey(tableName, foreignKey);
                }
            }
        }

        // Remover tabelas
        await queryRunner.dropTable('diet_plans', true);
        await queryRunner.dropTable('diet_generation_jobs', true);
        await queryRunner.dropTable('user_food_preferences', true);
        await queryRunner.dropTable('user_nutrition_goals', true);
        await queryRunner.dropTable('user_met_calculations', true);
        await queryRunner.dropTable('user_activities', true);
        await queryRunner.dropTable('user_biometrics', true);
        await queryRunner.dropTable('met_references', true);

        // Remover enums
        await queryRunner.query(`DROP TYPE "diet_job_status_enum"`);
        await queryRunner.query(`DROP TYPE "diet_goal_type_enum"`);
        await queryRunner.query(`DROP TYPE "food_preference_type_enum"`);
    }
}
