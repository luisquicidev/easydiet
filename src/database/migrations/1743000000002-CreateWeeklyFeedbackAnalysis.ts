import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeeklyFeedbackAnalysis1743000000002 implements MigrationInterface {
  name = 'CreateWeeklyFeedbackAnalysis1743000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enums
    await queryRunner.query(`
      CREATE TYPE "public"."recommendation_type_enum" AS ENUM (
        'maintain_plan',
        'minor_adjustments',
        'significant_changes',
        'complete_restructure'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."recommendation_status_enum" AS ENUM (
        'pending',
        'approved',
        'rejected',
        'implemented'
      )
    `);

    // Criar tabela de análise
    await queryRunner.query(`
      CREATE TABLE "weekly_feedback_analysis" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "weekly_feedback_id" uuid NOT NULL,
        "recommendation_type" "public"."recommendation_type_enum" NOT NULL DEFAULT 'minor_adjustments',
        "status" "public"."recommendation_status_enum" NOT NULL DEFAULT 'pending',
        "analysis_summary" text NOT NULL,
        "key_insights" text[] NOT NULL,
        "recommended_changes" jsonb NOT NULL,
        "confidence_score" float NOT NULL,
        "implementation_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_weekly_feedback_analysis" PRIMARY KEY ("id"),
        CONSTRAINT "FK_weekly_feedback_analysis_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_weekly_feedback_analysis_feedback" FOREIGN KEY ("weekly_feedback_id") REFERENCES "weekly_feedback"("id") ON DELETE CASCADE
      )
    `);

    // Criar tabela de histórico
    await queryRunner.query(`
      CREATE TABLE "recommendation_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "analysis_id" uuid NOT NULL,
        "recommendation_type" "public"."recommendation_type_enum" NOT NULL,
        "status" "public"."recommendation_status_enum" NOT NULL DEFAULT 'pending',
        "implementation_date" TIMESTAMP,
        "feedback_notes" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_recommendation_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_recommendation_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recommendation_history_analysis" FOREIGN KEY ("analysis_id") REFERENCES "weekly_feedback_analysis"("id") ON DELETE CASCADE
      )
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX "IDX_weekly_feedback_analysis_user" ON "weekly_feedback_analysis" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_weekly_feedback_analysis_feedback" ON "weekly_feedback_analysis" ("weekly_feedback_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recommendation_history_user" ON "recommendation_history" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recommendation_history_analysis" ON "recommendation_history" ("analysis_id")
    `);

    // Criar view materializada
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW "recommendation_analysis_history" AS
      SELECT
        rh.id,
        rh.user_id,
        rh.analysis_id,
        rh.recommendation_type,
        rh.status,
        rh.implementation_date,
        rh.feedback_notes,
        wfa.analysis_summary,
        wfa.key_insights,
        wfa.recommended_changes,
        wfa.confidence_score,
        rh.created_at,
        rh.updated_at
      FROM recommendation_history rh
      JOIN weekly_feedback_analysis wfa ON wfa.id = rh.analysis_id
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recommendation_analysis_history_user" ON "recommendation_analysis_history" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_recommendation_analysis_history_analysis" ON "recommendation_analysis_history" ("analysis_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover view materializada
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS "recommendation_analysis_history"`);

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recommendation_history_analysis"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_recommendation_history_user"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_weekly_feedback_analysis_feedback"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_weekly_feedback_analysis_user"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE IF EXISTS "recommendation_history"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "weekly_feedback_analysis"`);

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."recommendation_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."recommendation_type_enum"`);
  }
} 