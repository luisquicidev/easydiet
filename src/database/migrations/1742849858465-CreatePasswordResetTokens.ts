import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreatePasswordResetTokens1742849858465 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'password_reset_tokens',
                columns: [
                    {
                        name: 'id',
                        type: 'integer',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'user_id',
                        type: 'integer',
                        isNullable: false,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
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

        // Criar chave estrangeira para relacionar com a tabela de usuários
        await queryRunner.createForeignKey(
            'password_reset_tokens',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Primeiro remover a chave estrangeira
        const table = await queryRunner.getTable('password_reset_tokens');
        const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1,
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('password_reset_tokens', foreignKey);
        }

        // Depois remover a tabela
        await queryRunner.dropTable('password_reset_tokens');
    }
}
