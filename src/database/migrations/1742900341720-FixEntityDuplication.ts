import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEntityDuplication1742900341720 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verificar quais colunas duplicadas existem antes de tentar corrigir

        // 1. Verificar UserLoginHistory (user_id vs userId)
        const loginHistoryColumns = await this.getTableColumns(queryRunner, 'user_login_history');
        if (loginHistoryColumns.includes('user_id') && loginHistoryColumns.includes('userId')) {
            // Move data from camelCase to snake_case if needed
            await queryRunner.query(`
                UPDATE user_login_history
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_login_history DROP COLUMN "userId"`);
        }

        // 2. Verificar PasswordResetToken (user_id vs userId)
        const passwordResetColumns = await this.getTableColumns(queryRunner, 'password_reset_tokens');
        if (passwordResetColumns.includes('user_id') && passwordResetColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE password_reset_tokens
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE password_reset_tokens DROP COLUMN "userId"`);
        }

        // 3. Verificar UserBiometrics (user_id vs userId)
        const biometricsColumns = await this.getTableColumns(queryRunner, 'user_biometrics');
        if (biometricsColumns.includes('user_id') && biometricsColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE user_biometrics
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_biometrics DROP COLUMN "userId"`);
        }

        // 4. Verificar UserActivity (user_id vs userId e met_code vs metCode)
        const activityColumns = await this.getTableColumns(queryRunner, 'user_activities');
        if (activityColumns.includes('user_id') && activityColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE user_activities
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_activities DROP COLUMN "userId"`);
        }
        if (activityColumns.includes('met_code') && activityColumns.includes('metCode')) {
            await queryRunner.query(`
                UPDATE user_activities
                SET met_code = "metCode"
                WHERE met_code IS NULL AND "metCode" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_activities DROP COLUMN "metCode"`);
        }

        // 5. Verificar UserMetCalculation (user_id vs userId)
        const metCalcColumns = await this.getTableColumns(queryRunner, 'user_met_calculations');
        if (metCalcColumns.includes('user_id') && metCalcColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE user_met_calculations
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_met_calculations DROP COLUMN "userId"`);
        }

        // 6. Verificar UserNutritionGoal (user_id vs userId)
        const nutritionGoalColumns = await this.getTableColumns(queryRunner, 'user_nutrition_goals');
        if (nutritionGoalColumns.includes('user_id') && nutritionGoalColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE user_nutrition_goals
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_nutrition_goals DROP COLUMN "userId"`);
        }

        // 7. Verificar UserFoodPreference (user_id vs userId)
        const foodPrefColumns = await this.getTableColumns(queryRunner, 'user_food_preferences');
        if (foodPrefColumns.includes('user_id') && foodPrefColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE user_food_preferences
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE user_food_preferences DROP COLUMN "userId"`);
        }

        // 8. Verificar DietGenerationJob (user_id vs userId)
        const dietJobColumns = await this.getTableColumns(queryRunner, 'diet_generation_jobs');
        if (dietJobColumns.includes('user_id') && dietJobColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE diet_generation_jobs
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE diet_generation_jobs DROP COLUMN "userId"`);
        }

        // 9. Verificar DietPlan (user_id vs userId e job_id vs jobId)
        const dietPlanColumns = await this.getTableColumns(queryRunner, 'diet_plans');
        if (dietPlanColumns.includes('user_id') && dietPlanColumns.includes('userId')) {
            await queryRunner.query(`
                UPDATE diet_plans
                SET user_id = "userId"
                WHERE user_id IS NULL AND "userId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE diet_plans DROP COLUMN "userId"`);
        }
        if (dietPlanColumns.includes('job_id') && dietPlanColumns.includes('jobId')) {
            await queryRunner.query(`
                UPDATE diet_plans
                SET job_id = "jobId"::uuid
                WHERE job_id IS NULL AND "jobId" IS NOT NULL
            `);
            await queryRunner.query(`ALTER TABLE diet_plans DROP COLUMN "jobId"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Como estamos corrigindo um problema, a reversão seria recriar as colunas duplicadas
        // Isso não é recomendado, mas vamos implementar para manter a simetria da migração

        // 1. Restaurar coluna userId em UserLoginHistory
        await queryRunner.query(`ALTER TABLE user_login_history ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE user_login_history SET "userId" = user_id`);

        // 2. Restaurar coluna userId em PasswordResetToken
        await queryRunner.query(`ALTER TABLE password_reset_tokens ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE password_reset_tokens SET "userId" = user_id`);

        // 3. Restaurar coluna userId em UserBiometrics
        await queryRunner.query(`ALTER TABLE user_biometrics ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE user_biometrics SET "userId" = user_id`);

        // 4. Restaurar colunas userId e metCode em UserActivity
        await queryRunner.query(`ALTER TABLE user_activities ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE user_activities SET "userId" = user_id`);
        await queryRunner.query(`ALTER TABLE user_activities ADD COLUMN "metCode" varchar`);
        await queryRunner.query(`UPDATE user_activities SET "metCode" = met_code`);

        // 5. Restaurar coluna userId em UserMetCalculation
        await queryRunner.query(`ALTER TABLE user_met_calculations ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE user_met_calculations SET "userId" = user_id`);

        // 6. Restaurar coluna userId em UserNutritionGoal
        await queryRunner.query(`ALTER TABLE user_nutrition_goals ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE user_nutrition_goals SET "userId" = user_id`);

        // 7. Restaurar coluna userId em UserFoodPreference
        await queryRunner.query(`ALTER TABLE user_food_preferences ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE user_food_preferences SET "userId" = user_id`);

        // 8. Restaurar coluna userId em DietGenerationJob
        await queryRunner.query(`ALTER TABLE diet_generation_jobs ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE diet_generation_jobs SET "userId" = user_id`);

        // 9. Restaurar colunas userId e jobId em DietPlan
        await queryRunner.query(`ALTER TABLE diet_plans ADD COLUMN "userId" integer`);
        await queryRunner.query(`UPDATE diet_plans SET "userId" = user_id`);
        await queryRunner.query(`ALTER TABLE diet_plans ADD COLUMN "jobId" uuid`);
        await queryRunner.query(`UPDATE diet_plans SET "jobId" = job_id`);
    }

    /**
     * Função auxiliar para verificar quais colunas existem em uma tabela
     */
    private async getTableColumns(queryRunner: QueryRunner, tableName: string): Promise<string[]> {
        const columns = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = '${tableName}'
        `);
        return columns.map(column => column.column_name);
    }
}
