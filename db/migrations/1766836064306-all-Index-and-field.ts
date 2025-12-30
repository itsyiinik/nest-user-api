import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllIndexAndField1766836064306 implements MigrationInterface {
  name = 'AllIndexAndField1766836064306';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "balance" SET DEFAULT '0'`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ba97551be2400b9f2466dad818" ON "user_avatar" ("userId", "deletedAt", "createdAt") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ba97551be2400b9f2466dad818"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "balance" SET DEFAULT 0.00`,
    );
  }
}
