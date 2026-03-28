import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOutboxDeadLetterStatus1774380000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "outbox_status_enum" ADD VALUE IF NOT EXISTS 'DEAD_LETTER'`,
    );
  }

  public async down(): Promise<void> {}
}
