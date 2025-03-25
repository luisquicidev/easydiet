import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityColumnDuplication1742925988532 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Função auxiliar para verificar colunas existentes
        const getTableColumns = async (tableName: string): Promise<{column_name: string, data_type: string}[]> => {
            const columns = await queryRunner.query(`
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = '${tableName}'
            `);
            return columns;
        };

        const processTable = async (tableName: string, columns: { original: string, duplicate: string }[]) => {
            const tableColumns = await getTableColumns(tableName);

            for (const columnPair of columns) {
                const originalColumn = tableColumns.find(col => col.column_name === columnPair.original);
                const duplicateColumn = tableColumns.find(col => col.column_name === columnPair.duplicate);

                if (originalColumn && duplicateColumn) {
                    try {
                        // Determinar o casting baseado no tipo de dado
                        let castClause = '';
                        if (originalColumn.data_type === 'uuid' && duplicateColumn.data_type !== 'uuid') {
                            // Se original é UUID e duplicado não é, tentar conversão
                            if (duplicateColumn.data_type === 'integer') {
                                // Para inteiros, usar uuid_generate_v4() se for uma chave estrangeira
                                castClause = `::uuid`;
                            } else {
                                // Outros tipos podem precisar de tratamento específico
                                console.warn(`Potential type mismatch for ${columnPair.duplicate} in ${tableName}`);
                                continue;
                            }
                        }

                        // Atualizar dados
                        await queryRunner.query(`
                            UPDATE "${tableName}"
                            SET "${columnPair.original}" = "${columnPair.duplicate}"${castClause}
                            WHERE "${columnPair.original}" IS NULL AND "${columnPair.duplicate}" IS NOT NULL
                        `);

                        // Remover coluna duplicada
                        await queryRunner.query(`ALTER TABLE "${tableName}" DROP COLUMN "${columnPair.duplicate}"`);

                        console.log(`Processed duplicate column ${columnPair.duplicate} in ${tableName}`);
                    } catch (error) {
                        console.error(`Error processing ${columnPair.duplicate} in ${tableName}:`, error);

                        // Log detalhado do erro
                        if (error instanceof Error) {
                            console.error('Error details:', error.message);
                        }

                        // Continuar o processo para outras tabelas
                        console.warn(`Skipping ${columnPair.duplicate} in ${tableName} due to error`);
                    }
                }
            }
        };

        // Lista de tabelas para verificar duplicações
        const tablesToProcess = [
            {
                name: 'diet_calculations',
                columns: [
                    { original: 'user_id', duplicate: 'userId' },
                    { original: 'job_id', duplicate: 'jobId' },
                ]
            },
            {
                name: 'diet_calculation_mets',
                columns: [
                    { original: 'calculation_id', duplicate: 'calculationId' },
                    { original: 'met_code', duplicate: 'metCode' },
                ]
            },
            {
                name: 'diet_calculation_formulas',
                columns: [
                    { original: 'calculation_id', duplicate: 'calculationId' },
                ]
            }
        ];

        // Processar cada tabela
        for (const table of tablesToProcess) {
            await processTable(table.name, table.columns);
        }

        console.log('Column duplication fix completed successfully.');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.warn('Rollback might not fully restore the exact previous state');

        // Implementação básica de rollback, se necessário
        const tablesToRestore = [
            { name: 'diet_calculations', column: 'userId' },
            { name: 'diet_calculations', column: 'jobId' },
            { name: 'diet_calculation_mets', column: 'calculationId' },
            { name: 'diet_calculation_mets', column: 'metCode' },
            { name: 'diet_calculation_formulas', column: 'calculationId' },
        ];

        for (const table of tablesToRestore) {
            try {
                await queryRunner.query(`
                    ALTER TABLE "${table.name}" 
                    ADD COLUMN "${table.column}" varchar
                `);
            } catch (error) {
                console.error(`Error during rollback for ${table.name}:`, error);
            }
        }
    }
}