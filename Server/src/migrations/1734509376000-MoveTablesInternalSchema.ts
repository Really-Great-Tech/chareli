import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveTablesInternalSchema1734509376000
  implements MigrationInterface
{
  name = 'MoveTablesInternalSchema1734509376000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure internal schema exists
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS internal`);

    // Move signup_analytics table from public to internal schema
    await queryRunner.query(
      `ALTER TABLE public.signup_analytics SET SCHEMA internal`
    );

    // Move otps table from public to internal schema
    await queryRunner.query(`ALTER TABLE public.otps SET SCHEMA internal`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Move tables back to public schema
    await queryRunner.query(
      `ALTER TABLE internal.signup_analytics SET SCHEMA public`
    );

    await queryRunner.query(`ALTER TABLE internal.otps SET SCHEMA public`);
  }
}
