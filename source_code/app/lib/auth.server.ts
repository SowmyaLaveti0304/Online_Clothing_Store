import type { Admin, Employee, Customer } from "@prisma/client";
import bcrypt from "bcryptjs";

import { db } from "~/lib/prisma.server";
import { UserRole } from "~/utils/enums";

type AnyUser = Admin | Employee | Customer;

type AdminReturn = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  role: typeof UserRole.ADMIN;
};

type EmployeeReturn = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  role: typeof UserRole.EMPLOYEE;
};

type _UserReturn = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  role: typeof UserRole.CUSTOMER;
};

export type UserReturn = AdminReturn | EmployeeReturn | _UserReturn;

export async function getUserById(id: AnyUser["id"]): Promise<UserReturn | null> {
  const [admin, employee, user] = await Promise.all([
    db.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    }),
    db.employee.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    }),
    db.customer.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    }),
  ]);

  if (admin) {
    return {
      ...admin,
      role: UserRole.ADMIN,
    } as AdminReturn;
  }

  if (employee) {
    return {
      ...employee,
      role: UserRole.EMPLOYEE,
    } as EmployeeReturn;
  }

  if (user) {
    return {
      ...user,
      role: UserRole.CUSTOMER,
    } as _UserReturn;
  }

  return null;
}

export async function verifyLogin(email: string, password: string): Promise<UserReturn | null> {
  const [admin, employee, user] = await Promise.all([
    db.admin.findUnique({ where: { email } }),
    db.employee.findUnique({ where: { email } }),
    db.customer.findUnique({ where: { email } }),
  ]);

  if (admin && (await bcrypt.compare(password, admin.password))) {
    const { password: _password, ...rest } = admin;
    return { ...rest, role: UserRole.ADMIN } as AdminReturn;
  }

  if (employee && (await bcrypt.compare(password, employee.password))) {
    const { password: _password, ...rest } = employee;
    return { ...rest, role: UserRole.EMPLOYEE } as EmployeeReturn;
  }

  if (user && (await bcrypt.compare(password, user.password))) {
    const { password: _password, ...rest } = user;
    return { ...rest, role: UserRole.CUSTOMER } as _UserReturn;
  }

  return null;
}
