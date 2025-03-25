import {MigrationInterface, QueryRunner, TableColumn, TableForeignKey} from "typeorm";

export class UpdateDietPlanStructure1742903742445 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Adicionar campos novos à tabela diet_plans
        await queryRunner.addColumns('diet_plans', [
            new TableColumn({
                name: 'calculation_id',
                type: 'uuid',
                isNullable: true, // Temporariamente nullable para migração de dados
            }),
            new TableColumn({
                name: 'protein',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'carbs',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'fat',
                type: 'decimal',
                precision: 10,
                scale: 2,
                isNullable: true,
            }),
            new TableColumn({
                name: 'is_active',
                type: 'boolean',
                default: true,
                isNullable: false,
            }),
        ]);

        // 2. Adicionar chave estrangeira para diet_calculations
        await queryRunner.createForeignKey(
            'diet_plans',
            new TableForeignKey({
                name: 'FK_DIET_PLANS_CALCULATION',
                columnNames: ['calculation_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'diet_calculations',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1. Remover chave estrangeira
        await queryRunner.dropForeignKey('diet_plans', 'FK_DIET_PLANS_CALCULATION');

        // 2. Remover colunas adicionadas
        await queryRunner.dropColumns('diet_plans', [
            'calculation_id',
            'protein',
            'carbs',
            'fat',
            'is_active',
        ]);
    }
}
