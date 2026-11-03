import bcrypt from "bcryptjs";

/** Port used by services so they don't depend on bcrypt directly (and tests can stub it). */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, hash: string): Promise<boolean>;
}

/** bcrypt, cost 10 (ADR 0003). Also used for share-link passcodes. */
export const bcryptHasher: PasswordHasher = {
  hash: (plain) => bcrypt.hash(plain, 10),
  verify: (plain, hash) => bcrypt.compare(plain, hash),
};

/** Fast fake for tests. Never use in app code. */
export const fakeHasher: PasswordHasher = {
  hash: async (plain) => `hashed:${plain}`,
  verify: async (plain, hash) => hash === `hashed:${plain}`,
};
