/**
 * Build every service from a set of repositories + infrastructure ports.
 * Framework-free: used by `container.ts` (app) and by tests (memory repos).
 *
 * @module
 */
import type { PasswordHasher } from "../auth/password";
import type { Repositories } from "../repositories/interfaces";
import { AuthService } from "./auth.service";

export interface ServiceDeps {
  repos: Repositories;
  hasher: PasswordHasher;
}

export function createServices({ repos, hasher }: ServiceDeps) {
  return {
    auth: new AuthService(repos.users, hasher),
  };
}

export type Services = ReturnType<typeof createServices>;
