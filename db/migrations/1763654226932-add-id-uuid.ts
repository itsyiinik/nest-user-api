import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdUuid1763654226932 implements MigrationInterface {
    name = 'AddIdUuid1763654226932'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "mega"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "mega" character varying`);
    }

}
