import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreateDietCalculation1742903715343 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Criar a tabela DietCalculation
        await queryRunner.createTable(
            new Table({
                name: 'diet_calculations',
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
                        name: 'tmb',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'ger',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'activity_level',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: 'objective_pct',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
                        isNullable: false,
                    },
                    {
                        name: 'status_phase',
                        type: 'integer',
                        default: 1,
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

        // 2. Criar a tabela DietCalculationFormula
        await queryRunner.createTable(
            new Table({
                name: 'diet_calculation_formulas',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'calculation_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'formula_name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'formula_value',
                        type: 'decimal',
                        precision: 10,
                        scale: 2,
                        isNullable: false,
                    },
                ],
            }),
            true,
        );

        // 3. Criar a tabela DietCalculationMet
        await queryRunner.createTable(
            new Table({
                name: 'diet_calculation_mets',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'calculation_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'met_code',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'met_factor',
                        type: 'decimal',
                        precision: 5,
                        scale: 2,
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
                ],
            }),
            true,
        );

        // Criar as chaves estrangeiras
        await queryRunner.createForeignKey(
            'diet_calculations',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_calculations',
            new TableForeignKey({
                columnNames: ['job_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_generation_jobs',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_calculation_formulas',
            new TableForeignKey({
                columnNames: ['calculation_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_calculations',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_calculation_mets',
            new TableForeignKey({
                columnNames: ['calculation_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_calculations',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'diet_calculation_mets',
            new TableForeignKey({
                columnNames: ['met_code'],
                referencedColumnNames: ['code'],
                referencedTableName: 'met_references',
                onDelete: 'RESTRICT',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover chaves estrangeiras
        const dietCalculationMetTable = await queryRunner.getTable('diet_calculation_mets');
        const metCodeForeignKey = dietCalculationMetTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('met_code') !== -1,
        );
        if (metCodeForeignKey) {
            await queryRunner.dropForeignKey('diet_calculation_mets', metCodeForeignKey);
        }

        const calculationIdForeignKey = dietCalculationMetTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('calculation_id') !== -1,
        );
        if (calculationIdForeignKey) {
            await queryRunner.dropForeignKey('diet_calculation_mets', calculationIdForeignKey);
        }

        const formulaTable = await queryRunner.getTable('diet_calculation_formulas');
        const formulaCalculationIdFK = formulaTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('calculation_id') !== -1,
        );
        if (formulaCalculationIdFK) {
            await queryRunner.dropForeignKey('diet_calculation_formulas', formulaCalculationIdFK);
        }

        const dietCalculationTable = await queryRunner.getTable('diet_calculations');
        const userIdForeignKey = dietCalculationTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('user_id') !== -1,
        );
        if (userIdForeignKey) {
            await queryRunner.dropForeignKey('diet_calculations', userIdForeignKey);
        }

        const jobIdForeignKey = dietCalculationTable?.foreignKeys.find(
            fk => fk.columnNames.indexOf('job_id') !== -1,
        );
        if (jobIdForeignKey) {
            await queryRunner.dropForeignKey('diet_calculations', jobIdForeignKey);
        }

        // Remover tabelas
        await queryRunner.dropTable('diet_calculation_mets');
        await queryRunner.dropTable('diet_calculation_formulas');
        await queryRunner.dropTable('diet_calculations');
    }
}
