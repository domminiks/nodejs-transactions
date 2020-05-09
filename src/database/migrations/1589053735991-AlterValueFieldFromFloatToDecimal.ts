import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export default class AlterValueFieldFromFloatToDecimal1589053735991
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transactions', 'value');
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'value',
        type: 'decimal',
        scale: 2,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transactions', 'value');
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'value',
        type: 'float',
      }),
    );
  }
}
