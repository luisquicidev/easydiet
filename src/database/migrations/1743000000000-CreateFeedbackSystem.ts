import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreateFeedbackSystem1743000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Criar os tipos enum necessários
        await queryRunner.query(`
            CREATE TYPE "feedback_status_enum" AS ENUM ('pending', 'followed', 'modified', 'custom')
        `);

        await queryRunner.query(`
            CREATE TYPE "mood_enum" AS ENUM ('great', 'good', 'neutral', 'bad', 'terrible')
        `);

        await queryRunner.query(`
            CREATE TYPE "modification_type_enum" AS ENUM ('quantity', 'replacement', 'custom')
        `);

        // 2. Criar a tabela meal_feedback
        await queryRunner.createTable(
            new Table({
                name: 'meal_feedback',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'meal_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'date',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'feedback_status_enum',
                        isNullable: false,
                    },
                    {
                        name: 'satisfaction_rating',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'energy_level',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'hunger_level',
                        type: 'integer',
                        isNullable: true,
                    },
                    {
                        name: 'mood',
                        type: 'mood_enum',
                        isNullable: true,
                    },
                    {
                        name: 'comments',
                        type: 'text',
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

        // 3. Criar a tabela meal_feedback_foods
        await queryRunner.createTable(
            new Table({
                name: 'meal_feedback_foods',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'feedback_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'food_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'is_alternative',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'is_custom',
                        type: 'boolean',
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'unit',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'protein',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'carbs',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'fat',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'calories',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
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

        // 4. Criar a tabela meal_feedback_modifications
        await queryRunner.createTable(
            new Table({
                name: 'meal_feedback_modifications',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'feedback_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'original_food_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'modification_type',
                        type: 'modification_type_enum',
                        isNullable: false,
                    },
                    {
                        name: 'original_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'new_quantity',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'replacement_food_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'custom_food_name',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'reason',
                        type: 'text',
                        isNullable: true,
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

        // 5. Criar a tabela daily_feedback_summary
        await queryRunner.createTable(
            new Table({
                name: 'daily_feedback_summary',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'date',
                        type: 'date',
                        isNullable: false,
                    },
                    {
                        name: 'overall_adherence',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'average_satisfaction',
                        type: 'decimal',
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'average_energy',
                        type: 'decimal',
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'average_hunger',
                        type: 'decimal',
                        precision: 3,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'dominant_mood',
                        type: 'mood_enum',
                        isNullable: true,
                    },
                    {
                        name: 'key_insights',
                        type: 'text',
                        isArray: true,
                        isNullable: true,
                    },
                    {
                        name: 'ai_suggestions',
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

        // 6. Criar a tabela feedback_patterns
        await queryRunner.createTable(
            new Table({
                name: 'feedback_patterns',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'pattern_type',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'pattern_data',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'confidence_score',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'last_updated',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true,
        );

        // 7. Criar a view materializada
        await queryRunner.query(`
            CREATE MATERIALIZED VIEW user_feedback_analysis AS
            SELECT 
                mf.user_id,
                mf.date,
                mf.status,
                mf.satisfaction_rating,
                mf.energy_level,
                mf.hunger_level,
                mf.mood,
                mff.name as food_name,
                mff.is_alternative,
                mff.is_custom,
                mff.quantity,
                mfm.modification_type,
                mfm.reason as modification_reason,
                dfs.overall_adherence,
                dfs.average_satisfaction,
                dfs.key_insights,
                dfs.ai_suggestions
            FROM meal_feedback mf
            LEFT JOIN meal_feedback_foods mff ON mf.id = mff.feedback_id
            LEFT JOIN meal_feedback_modifications mfm ON mf.id = mfm.feedback_id
            LEFT JOIN daily_feedback_summary dfs ON mf.user_id = dfs.user_id AND mf.date = dfs.date
            WHERE mf.date >= NOW() - INTERVAL '90 days'
            WITH DATA
        `);

        // 8. Adicionar as chaves estrangeiras
        await queryRunner.createForeignKey(
            'meal_feedback',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'meal_feedback',
            new TableForeignKey({
                columnNames: ['meal_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meals',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'meal_feedback_foods',
            new TableForeignKey({
                columnNames: ['feedback_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'meal_feedback',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'meal_feedback_foods',
            new TableForeignKey({
                columnNames: ['food_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meal_foods',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'meal_feedback_modifications',
            new TableForeignKey({
                columnNames: ['feedback_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'meal_feedback',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'meal_feedback_modifications',
            new TableForeignKey({
                columnNames: ['original_food_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meal_foods',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'meal_feedback_modifications',
            new TableForeignKey({
                columnNames: ['replacement_food_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_meal_foods',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.createForeignKey(
            'daily_feedback_summary',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'feedback_patterns',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // 9. Criar índices
        await queryRunner.query(`
            CREATE INDEX idx_meal_feedback_user_date ON meal_feedback(user_id, date);
            CREATE INDEX idx_meal_feedback_foods_feedback ON meal_feedback_foods(feedback_id);
            CREATE INDEX idx_daily_feedback_summary_user_date ON daily_feedback_summary(user_id, date);
            CREATE INDEX idx_feedback_patterns_user ON feedback_patterns(user_id);
            CREATE INDEX idx_meal_feedback_status ON meal_feedback(status);
            CREATE INDEX idx_meal_feedback_modifications_type ON meal_feedback_modifications(modification_type);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Remover índices
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_meal_feedback_user_date;
            DROP INDEX IF EXISTS idx_meal_feedback_foods_feedback;
            DROP INDEX IF EXISTS idx_daily_feedback_summary_user_date;
            DROP INDEX IF EXISTS idx_feedback_patterns_user;
            DROP INDEX IF EXISTS idx_meal_feedback_status;
            DROP INDEX IF EXISTS idx_meal_feedback_modifications_type;
        `);

        // 2. Remover view materializada
        await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS user_feedback_analysis`);

        // 3. Remover tabelas
        await queryRunner.dropTable('feedback_patterns');
        await queryRunner.dropTable('daily_feedback_summary');
        await queryRunner.dropTable('meal_feedback_modifications');
        await queryRunner.dropTable('meal_feedback_foods');
        await queryRunner.dropTable('meal_feedback');

        // 4. Remover tipos enum
        await queryRunner.query(`DROP TYPE IF EXISTS feedback_status_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS mood_enum`);
        await queryRunner.query(`DROP TYPE IF EXISTS modification_type_enum`);
    }
} 