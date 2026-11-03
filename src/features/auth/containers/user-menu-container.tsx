"use client";

import { useTranslations } from "next-intl";
import { UserMenu } from "../components/user-menu";
import { useCurrentUser, useLogout } from "../hooks/use-auth";

/** Header user menu: current user + logout. */
export function UserMenuContainer() {
  const t = useTranslations("auth");
  const me = useCurrentUser();
  const logout = useLogout();
  return (
    <UserMenu
      email={me.data?.email ?? null}
      loading={me.isPending}
      onLogout={() => logout.mutate()}
      labels={{ login: t("login.title"), register: t("register.title"), logout: t("logout"), myEvents: t("myEvents") }}
    />
  );
}
