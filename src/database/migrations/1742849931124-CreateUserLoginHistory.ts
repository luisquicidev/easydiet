import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class CreateUserLoginHistory1742849931124 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'user_login_history',
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
                        name: 'ip_address',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'user_agent',
                        type: 'varchar',
                        isNullable: true,
                    },
                    {
                        name: 'status',
                        type: 'varchar',
                        default: "'success'",
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
            'user_login_history',
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
        const table = await queryRunner.getTable('user_login_history');
        const foreignKey = table?.foreignKeys.find(
            (fk) => fk.columnNames.indexOf('user_id') !== -1,
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('user_login_history', foreignKey);
        }

        // Depois remover a tabela
        await queryRunner.dropTable('user_login_history');
    }
}
