/* Test helper: services wired to fresh in-memory repositories. Not used by app code. */
import { fakeHasher } from "../auth/password";
import { createMemoryRepositories } from "../repositories/memory";
import { createServices } from "./index";

export function createTestServices() {
  const repos = createMemoryRepositories();
  return { repos, services: createServices({ repos, hasher: fakeHasher }) };
}
