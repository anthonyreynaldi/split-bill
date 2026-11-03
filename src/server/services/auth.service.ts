import type { LoginInput, RegisterInput, SessionUserDto } from "@/shared/dto";
import { AppError } from "@/shared/lib/result";
import type { User } from "@/domain/types";
import type { PasswordHasher } from "../auth/password";
import type { UserRepository } from "../repositories/interfaces";

const toDto = (u: User): SessionUserDto => ({ id: u.id, email: u.email });

/**
 * Registration and login (temporary custom auth, ADR 0003).
 * Doesn't know about cookies: actions start or end the session.
 */
export class AuthService {
  /** Hash of a random string, so unknown emails still take one bcrypt compare (timing). */
  private dummyHash: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {
    this.dummyHash = hasher.hash(crypto.randomUUID());
  }

  /** @throws AppError(`EMAIL_TAKEN`) */
  async register(input: RegisterInput): Promise<SessionUserDto> {
    if (await this.users.findByEmail(input.email)) throw new AppError("EMAIL_TAKEN");
    const user = await this.users.create({
      email: input.email,
      passwordHash: await this.hasher.hash(input.password),
    });
    return toDto(user);
  }

  /** @throws AppError(`INVALID_CREDENTIALS`), the same for an unknown email or a wrong password. */
  async login(input: LoginInput): Promise<SessionUserDto> {
    const user = await this.users.findByEmail(input.email);
    const ok = await this.hasher.verify(input.password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !ok) throw new AppError("INVALID_CREDENTIALS");
    return toDto(user);
  }

  /** The user behind a session id, or null if it no longer exists. */
  async getUser(userId: string): Promise<SessionUserDto | null> {
    const user = await this.users.findById(userId);
    return user ? toDto(user) : null;
  }
}
