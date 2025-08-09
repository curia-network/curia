import { ColumnDefinitions, MigrationBuilder } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

// Adds Farcaster to users/authentication_sessions identity constraints
export async function up(pgm: MigrationBuilder): Promise<void> {
  // users.identity_type: extend to include 'farcaster'
  pgm.dropConstraint('users', 'check_identity_type');
  pgm.addConstraint('users', 'check_identity_type', {
    check:
      "identity_type IN ('legacy', 'ens', 'universal_profile', 'anonymous', 'farcaster')",
  });

  // users.check_identity_data: add rule for farcaster
  pgm.dropConstraint('users', 'check_identity_data');
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

  // authentication_sessions.identity_type: extend to include 'farcaster'
  pgm.dropConstraint('authentication_sessions', 'check_session_identity_type');
  pgm.addConstraint('authentication_sessions', 'check_session_identity_type', {
    check: "identity_type IN ('ens', 'universal_profile', 'anonymous', 'farcaster')",
  });
}

// Revert to pre-Farcaster constraints
export async function down(pgm: MigrationBuilder): Promise<void> {
  // users.identity_type: remove 'farcaster'
  pgm.dropConstraint('users', 'check_identity_type');
  pgm.addConstraint('users', 'check_identity_type', {
    check: "identity_type IN ('legacy', 'ens', 'universal_profile', 'anonymous')",
  });

  // users.check_identity_data: remove farcaster rule
  pgm.dropConstraint('users', 'check_identity_data');
  pgm.sql(`
    ALTER TABLE users ADD CONSTRAINT check_identity_data
    CHECK (
      (identity_type = 'legacy' AND wallet_address IS NULL) OR
      (identity_type = 'ens' AND ens_domain IS NOT NULL AND wallet_address IS NOT NULL) OR
      (identity_type = 'universal_profile' AND up_address IS NOT NULL) OR
      (identity_type = 'anonymous' AND is_anonymous = TRUE)
    );
  `);

  // authentication_sessions.identity_type: remove 'farcaster'
  pgm.dropConstraint('authentication_sessions', 'check_session_identity_type');
  pgm.addConstraint('authentication_sessions', 'check_session_identity_type', {
    check: "identity_type IN ('ens', 'universal_profile', 'anonymous')",
  });
}
