import { useSubmit } from "@remix-run/react";

import { UserRole } from "~/utils/enums";
import { useRootData } from "~/utils/hooks/use-root-data";

export function useUser() {
  const { user } = useRootData();

  if (!user) {
    throw new Error("No user found");
  }

  return user;
}

export const useAuth = () => {
  const submit = useSubmit();
  const user = useUser();

  const isEmployee = user.role === UserRole.EMPLOYEE;
  const isAdmin = user.role === UserRole.ADMIN;
  const isCustomer = user.role === UserRole.CUSTOMER;

  const signOut = () => {
    return submit(null, {
      action: "/logout",
      method: "POST",
      navigate: false,
    });
  };

  const name = `${user.firstName} ${user.lastName}`;

  return {
    signOut,
    isEmployee,
    isAdmin,
    isCustomer,
    user: {
      ...user,
      name,
    },
  };
};
