import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

// Fix Farcaster identity constraint to allow null ens_domain and wallet_address
export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop the existing constraint
  pgm.dropConstraint('users', 'check_identity_data');
  
  // Add the updated constraint with more flexible Farcaster rules
  pgm.sql(`
    ALTER TABLE users ADD CONSTRAINT check_identity_data
    CHECK (
      (identity_type = 'legacy' AND wallet_address IS NULL) OR
      (identity_type = 'ens' AND ens_domain IS NOT NULL AND wallet_address IS NOT NULL) OR
      (identity_type = 'universal_profile' AND up_address IS NOT NULL) OR
      (identity_type = 'anonymous' AND is_anonymous = TRUE) OR
      (identity_type = 'farcaster')
    );
  `);
}

// Revert to the previous stricter constraint
export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop the flexible constraint
  pgm.dropConstraint('users', 'check_identity_data');
  
  // Restore the previous constraint that required both fields
  pgm.sql(`
    ALTER TABLE users ADD CONSTRAINT check_identity_data
    CHECK (
      (identity_type = 'legacy' AND wallet_address IS NULL) OR
      (identity_type = 'ens' AND ens_domain IS NOT NULL AND wallet_address IS NOT NULL) OR
      (identity_type = 'universal_profile' AND up_address IS NOT NULL) OR
      (identity_type = 'anonymous' AND is_anonymous = TRUE) OR
      (identity_type = 'farcaster' AND ens_domain IS NOT NULL AND wallet_address IS NOT NULL)
    );
  `);
}
