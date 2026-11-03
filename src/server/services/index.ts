/**
 * Build every service from a set of repositories + infrastructure ports.
 * Framework-free: used by `container.ts` (app) and by tests (memory repos).
 *
 * @module
 */
import type { PasswordHasher } from "../auth/password";
import type { Repositories } from "../repositories/interfaces";
import { AuthService } from "./auth.service";
import { BillService } from "./bill.service";
import { EventService } from "./event.service";

export interface ServiceDeps {
  repos: Repositories;
  hasher: PasswordHasher;
}

export function createServices({ repos, hasher }: ServiceDeps) {
  return {
    auth: new AuthService(repos.users, hasher),
    events: new EventService(repos),
    bills: new BillService(repos),
  };
}

export type Services = ReturnType<typeof createServices>;
