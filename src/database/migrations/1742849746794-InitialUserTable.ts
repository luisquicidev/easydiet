import {MigrationInterface, QueryRunner, Table, TableIndex} from "typeorm";

export class InitialUserTable1742849746794 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Criar enum para roles
        await queryRunner.query(`
            CREATE TYPE "user_role_enum" AS ENUM ('user', 'nutritionist', 'admin')
        `);

        // Criar tabela de usuários
        await queryRunner.createTable(
            new Table({
                name: 'users',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'password',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'role',
                        type: 'user_role_enum',
                        default: "'user'",
                    },
                    {
                        name: 'refresh_token',
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

        // Criar índice para melhorar a performance de buscas por email
        await queryRunner.createIndex(
            'users',
            new TableIndex({
                name: 'IDX_USERS_EMAIL',
                columnNames: ['email'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remover índice
        await queryRunner.dropIndex('users', 'IDX_USERS_EMAIL');

        // Remover tabela
        await queryRunner.dropTable('users');

        // Remover enum type
        await queryRunner.query(`DROP TYPE "user_role_enum"`);
    }
}
