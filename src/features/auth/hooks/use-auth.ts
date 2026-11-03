"use client";
/**
 * Auth view logic: TanStack Query/Form + Server Actions.
 * Containers call these hooks; views never do.
 */
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoginInput, RegisterInput } from "@/shared/dto";
import { unwrap } from "@/shared/lib/result";
import { getCurrentUser, login, logout, register } from "@/server/actions/auth.actions";
import { useRouter } from "@/i18n/navigation";

export const authKeys = { me: ["auth", "me"] as const };

/** The logged-in user (`null` when logged out). */
export function useCurrentUser() {
  return useQuery({ queryKey: authKeys.me, queryFn: () => unwrap(getCurrentUser(undefined)) });
}

/** Login or register form: same fields, different action and validation schema. */
export function useAuthForm(mode: "login" | "register") {
  const qc = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (v: { email: string; password: string }) => unwrap(mode === "login" ? login(v) : register(v)),
    onSuccess: (user) => {
      qc.setQueryData(authKeys.me, user);
      router.push("/events");
    },
  });
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onSubmit: mode === "login" ? LoginInput : RegisterInput },
    onSubmit: ({ value }) => mutation.mutateAsync(value).catch(() => undefined),
  });
  return { form, mutation };
}

/** Log out, clear all cached data, go home. */
export function useLogout() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => unwrap(logout(undefined)),
    onSuccess: () => {
      qc.clear();
      qc.setQueryData(authKeys.me, null);
      router.push("/");
    },
  });
}
