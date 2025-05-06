import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWeeklyFeedbackSystem1743000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar enum para status do feedback semanal
    await queryRunner.query(`
      CREATE TYPE weekly_feedback_status AS ENUM (
        'pending',
        'completed',
        'skipped'
      );
    `);

    // Criar enum para tipo de medida
    await queryRunner.query(`
      CREATE TYPE measurement_type AS ENUM (
        'weight',
        'chest',
        'waist',
        'hip',
        'thigh',
        'arm',
        'bmi',
        'body_fat',
        'muscle_mass',
        'water_percentage',
        'custom'
      );
    `);

    // Criar enum para tipo de objetivo
    await queryRunner.query(`
      CREATE TYPE goal_type AS ENUM (
        'weight_loss',
        'weight_gain',
        'muscle_gain',
        'maintenance',
        'health_improvement',
        'custom'
      );
    `);

    // Criar tabela de feedback semanal
    await queryRunner.query(`
      CREATE TABLE weekly_feedback (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        week_start_date DATE NOT NULL,
        week_end_date DATE NOT NULL,
        status weekly_feedback_status NOT NULL DEFAULT 'pending',
        overall_adherence DECIMAL(5,2) NOT NULL,
        goal_progress DECIMAL(5,2) NOT NULL,
        energy_level_avg DECIMAL(3,2) NOT NULL,
        sleep_quality_avg DECIMAL(3,2) NOT NULL,
        stress_level_avg DECIMAL(3,2) NOT NULL,
        workout_completion_rate DECIMAL(5,2) NOT NULL,
        meal_adherence_rate DECIMAL(5,2) NOT NULL,
        challenges_faced TEXT[],
        achievements TEXT[],
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT weekly_feedback_user_week_unique UNIQUE (user_id, week_start_date)
      );
    `);

    // Criar tabela de medidas
    await queryRunner.query(`
      CREATE TABLE measurements (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        weekly_feedback_id UUID NOT NULL REFERENCES weekly_feedback(id),
        measurement_type measurement_type NOT NULL,
        value DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        measurement_date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Criar tabela de objetivos
    await queryRunner.query(`
      CREATE TABLE goals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        weekly_feedback_id UUID NOT NULL REFERENCES weekly_feedback(id),
        goal_type goal_type NOT NULL,
        target_value DECIMAL(10,2) NOT NULL,
        current_value DECIMAL(10,2) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        deadline DATE NOT NULL,
        is_achieved BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Criar tabela de hábitos
    await queryRunner.query(`
      CREATE TABLE habits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id),
        weekly_feedback_id UUID NOT NULL REFERENCES weekly_feedback(id),
        habit_name VARCHAR(100) NOT NULL,
        frequency_per_week INTEGER NOT NULL,
        completed_count INTEGER NOT NULL DEFAULT 0,
        success_rate DECIMAL(5,2) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Criar índices
    await queryRunner.query(`
      CREATE INDEX idx_weekly_feedback_user_id ON weekly_feedback(user_id);
      CREATE INDEX idx_weekly_feedback_dates ON weekly_feedback(week_start_date, week_end_date);
      CREATE INDEX idx_measurements_user_id ON measurements(user_id);
      CREATE INDEX idx_measurements_weekly_feedback_id ON measurements(weekly_feedback_id);
      CREATE INDEX idx_goals_user_id ON goals(user_id);
      CREATE INDEX idx_goals_weekly_feedback_id ON goals(weekly_feedback_id);
      CREATE INDEX idx_habits_user_id ON habits(user_id);
      CREATE INDEX idx_habits_weekly_feedback_id ON habits(weekly_feedback_id);
    `);

    // Criar view materializada para histórico de medidas
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW measurement_history AS
      SELECT 
        m.user_id,
        m.measurement_type,
        m.value,
        m.unit,
        m.measurement_date,
        wf.week_start_date,
        wf.week_end_date
      FROM measurements m
      JOIN weekly_feedback wf ON m.weekly_feedback_id = wf.id
      ORDER BY m.measurement_date DESC;
    `);

    // Criar view materializada para progresso de objetivos
    await queryRunner.query(`
      CREATE MATERIALIZED VIEW goal_progress_history AS
      SELECT 
        g.user_id,
        g.goal_type,
        g.target_value,
        g.current_value,
        g.unit,
        g.deadline,
        g.is_achieved,
        wf.week_start_date,
        wf.week_end_date
      FROM goals g
      JOIN weekly_feedback wf ON g.weekly_feedback_id = wf.id
      ORDER BY wf.week_start_date DESC;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover views materializadas
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS goal_progress_history;`);
    await queryRunner.query(`DROP MATERIALIZED VIEW IF EXISTS measurement_history;`);

    // Remover índices
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_habits_weekly_feedback_id;
      DROP INDEX IF EXISTS idx_habits_user_id;
      DROP INDEX IF EXISTS idx_goals_weekly_feedback_id;
      DROP INDEX IF EXISTS idx_goals_user_id;
      DROP INDEX IF EXISTS idx_measurements_weekly_feedback_id;
      DROP INDEX IF EXISTS idx_measurements_user_id;
      DROP INDEX IF EXISTS idx_weekly_feedback_dates;
      DROP INDEX IF EXISTS idx_weekly_feedback_user_id;
    `);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE IF EXISTS habits;`);
    await queryRunner.query(`DROP TABLE IF EXISTS goals;`);
    await queryRunner.query(`DROP TABLE IF EXISTS measurements;`);
    await queryRunner.query(`DROP TABLE IF EXISTS weekly_feedback;`);

    // Remover enums
    await queryRunner.query(`DROP TYPE IF EXISTS goal_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS measurement_type;`);
    await queryRunner.query(`DROP TYPE IF EXISTS weekly_feedback_status;`);
  }
}
