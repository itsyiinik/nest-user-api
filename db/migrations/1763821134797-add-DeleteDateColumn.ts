import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeleteDateColumn1763821134797 implements MigrationInterface {
    name = 'AddDeleteDateColumn1763821134797'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "deletedAt"`);
    }

}
