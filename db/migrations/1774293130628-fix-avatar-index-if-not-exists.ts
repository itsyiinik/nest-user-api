import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixAvatarIndexIfNotExists1774293130628
  implements MigrationInterface
{
  name = 'FixAvatarIndexIfNotExists1774293130628';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_ba97551be2400b9f2466dad818" ON "user_avatar" ("userId", "deletedAt", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_ba97551be2400b9f2466dad818"`,
    );
  }
}
