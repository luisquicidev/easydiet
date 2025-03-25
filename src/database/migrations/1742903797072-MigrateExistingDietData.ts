import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateExistingDietData1742903797072 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Buscar todos os planos de dieta existentes
        const existingPlans = await queryRunner.query(`
            SELECT * FROM diet_plans
            WHERE calculation_id IS NULL
        `);

        // 2. Para cada plano, criar um registro de cálculo correspondente
        for (const plan of existingPlans) {
            // Criar registro na tabela diet_calculations
            const calculationResult = await queryRunner.query(`
                INSERT INTO diet_calculations
                (user_id, job_id, tmb, ger, activity_level, objective_pct, status_phase, created_at, updated_at)
                VALUES
                ($1, $2, $3, $4, $5, $6, 1, $7, $8)
                RETURNING id
            `, [
                plan.user_id,
                plan.job_id,
                plan.tmb || 0,
                plan.tmb || 0, // Usar tmb como ger por padrão, já que não temos esse valor
                plan.activity_level || 1.2,
                0, // Valor padrão para objective_pct
                plan.created_at,
                plan.updated_at
            ]);

            const calculationId = calculationResult[0].id;

            // Atualizar o plano com a referência ao cálculo
            await queryRunner.query(`
                UPDATE diet_plans
                SET calculation_id = $1
                WHERE id = $2
            `, [calculationId, plan.id]);

            // 3. Se o plano tem dados em planData, extrair macronutrientes se possível
            if (plan.plan_data && typeof plan.plan_data === 'object') {
                try {
                    // Tenta extrair macronutrientes do planData (adaptado à estrutura existente)
                    if (plan.plan_data.macronutrients) {
                        await queryRunner.query(`
                            UPDATE diet_plans
                            SET protein = $1, carbs = $2, fat = $3
                            WHERE id = $4
                        `, [
                            plan.plan_data.macronutrients.protein || 0,
                            plan.plan_data.macronutrients.carbs || 0,
                            plan.plan_data.macronutrients.fat || 0,
                            plan.id
                        ]);
                    }

                    // Adicionar fórmulas utilizadas, se disponíveis
                    if (plan.plan_data.formulas) {
                        const formulaNames = Object.keys(plan.plan_data.formulas);
                        for (const formulaName of formulaNames) {
                            await queryRunner.query(`
                                INSERT INTO diet_calculation_formulas
                                (calculation_id, formula_name, formula_value)
                                VALUES
                                ($1, $2, $3)
                            `, [
                                calculationId,
                                formulaName,
                                plan.plan_data.formulas[formulaName] || 0
                            ]);
                        }
                    }

                    // Migrar informações de MET, se disponíveis
                    if (plan.plan_data.mets && Array.isArray(plan.plan_data.mets)) {
                        for (const met of plan.plan_data.mets) {
                            // Verificar se temos uma referência de MET correspondente
                            const metCode = await this.findBestMatchingMetCode(queryRunner, met.met);

                            if (metCode) {
                                await queryRunner.query(`
                                    INSERT INTO diet_calculation_mets
                                    (calculation_id, met_code, met_factor, frequency_per_week, duration_minutes)
                                    VALUES
                                    ($1, $2, $3, $4, $5)
                                `, [
                                    calculationId,
                                    metCode,
                                    met.factor || 0,
                                    1, // Valores padrão para frequência/duração
                                    60
                                ]);
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Erro ao migrar dados do plano ${plan.id}:`, error);
                    // Continuar com o próximo plano
                }
            }
        }

        // 4. Tornar a coluna calculation_id não nula após a migração
        await queryRunner.query(`
            ALTER TABLE diet_plans 
            ALTER COLUMN calculation_id SET NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Não implementamos down para esta migração, pois seria complexo reverter
        // a transformação de dados. Se necessário, backups devem ser feitos antes
        // de executar esta migração.
    }

    /**
     * Tenta encontrar o código MET mais próximo na tabela met_references
     */
    private async findBestMatchingMetCode(queryRunner: QueryRunner, metDescription: string): Promise<string | null> {
        try {
            // Primeiro, tenta uma correspondência exata na descrição
            const exactMatch = await queryRunner.query(`
                SELECT code FROM met_references
                WHERE LOWER(description) = LOWER($1)
                LIMIT 1
            `, [metDescription]);

            if (exactMatch && exactMatch.length > 0) {
                return exactMatch[0].code;
            }

            // Segundo, tenta uma correspondência parcial
            const partialMatch = await queryRunner.query(`
                SELECT code FROM met_references
                WHERE LOWER(description) LIKE LOWER($1)
                LIMIT 1
            `, [`%${metDescription}%`]);

            if (partialMatch && partialMatch.length > 0) {
                return partialMatch[0].code;
            }

            // Se não encontrar, retorna o primeiro código da tabela (ou algum código padrão)
            const defaultCode = await queryRunner.query(`
                SELECT code FROM met_references
                LIMIT 1
            `);

            if (defaultCode && defaultCode.length > 0) {
                return defaultCode[0].code;
            }

            return null;
        } catch (error) {
            console.error('Erro ao buscar código MET:', error);
            return null;
        }
    }
}
