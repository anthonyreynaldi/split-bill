import { z } from "zod";
import { VALIDATION } from "./common";

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: VALIDATION.invalidEmail }));

/** Input for `register` action. */
export const RegisterInput = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(8, { error: VALIDATION.passwordTooShort })
    .max(72, { error: VALIDATION.tooLong }), // bcrypt limit
});
export type RegisterInput = z.infer<typeof RegisterInput>;

/** Input for `login` action. */
export const LoginInput = z.object({
  email: EmailSchema,
  password: z.string().min(1, { error: VALIDATION.required }),
});
export type LoginInput = z.infer<typeof LoginInput>;

/** The logged-in user as seen by the client. Never includes the password hash. */
export const SessionUserDto = z.object({
  id: z.string(),
  email: z.string(),
});
export type SessionUserDto = z.infer<typeof SessionUserDto>;
