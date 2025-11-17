import { MigrationInterface, QueryRunner } from "typeorm";

export class ForceEmailOnlyAuthentication1763386054471 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update authentication_settings in system_configs table to force email-only mode
        // This migration corrects any existing SMS or "both" authentication configurations
        
        const configQuery = `
            UPDATE "system_configs" 
            SET "value" = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        jsonb_set(
                            "value",
                            '{settings,email,enabled}',
                            'true'::jsonb
                        ),
                        '{settings,sms,enabled}',
                        'false'::jsonb
                    ),
                    '{settings,both,enabled}',
                    'false'::jsonb
                ),
                '{settings,both,otpDeliveryMethod}',
                '"email"'::jsonb
            )
            WHERE "key" = 'authentication_settings'
        `;
        
        await queryRunner.query(configQuery);
        
        console.log('✅ Authentication settings migrated to email-only mode');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Note: We cannot reliably restore previous settings as we don't know what they were
        // This migration is designed to be one-way for security/compliance reasons
        console.log('⚠️  Rollback not recommended: Cannot restore previous authentication settings');
        console.log('⚠️  Manual intervention required if you need to re-enable SMS authentication');
    }

}
