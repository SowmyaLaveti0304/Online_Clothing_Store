import * as React from "react";
import { PasswordInput, Select, TextInput } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { ShoppingBag } from "lucide-react";
import { jsonWithError } from "remix-toast";

import { db } from "~/lib/prisma.server";
import { createUserSession } from "~/lib/session.server";
import { createHash } from "~/utils/encryption";
import { UserRole } from "~/utils/enums";
import { badRequest, safeRedirect } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RegisterSchema } from "~/utils/zod.schema";

interface ActionData {
  fieldErrors?: inferErrors<typeof RegisterSchema>;
  success: boolean;
}

const genderOptions = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const { fieldErrors, fields } = await validateAction(request, RegisterSchema);

  if (fieldErrors) {
    return badRequest<ActionData>({
      fieldErrors,
      success: false,
    });
  }

  if (fields.role === UserRole.CUSTOMER) {
    const existingEmployee = await db.employee.findUnique({
      where: {
        email: fields.email,
      },
    });

    if (existingEmployee) {
      return jsonWithError<ActionData>(
        {
          fieldErrors: {
            email: "Email already exists",
          },
          success: false,
        },
        "Email already exists",
      );
    }

    const createdCustomer = await db.customer.create({
      data: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        password: await createHash(fields.password),
        street: fields.street,
        city: fields.city,
        state: fields.state,
        zipcode: fields.zip,
        dob: fields.dob,
        phoneNo: fields.phoneNo,
        role: UserRole.CUSTOMER,
        gender: fields.gender,
      },
    });
    return createUserSession({
      redirectTo: safeRedirect("/"),
      request,
      role: createdCustomer.role,
      userId: createdCustomer.id,
    });
  }

  if (fields.role === UserRole.EMPLOYEE) {
    const existingEmployeeRegistrationRequest = await db.employeeRegistrationRequest.findUnique({
      where: {
        email: fields.email,
      },
    });

    const existingEmployeeWithEmail = await db.employee.findUnique({
      where: {
        email: fields.email,
      },
    });

    if (existingEmployeeRegistrationRequest || existingEmployeeWithEmail) {
      return jsonWithError<ActionData>(
        {
          fieldErrors: { email: "Email already exists" },
          success: false,
        },
        "Email already exists",
      );
    }

    await db.employeeRegistrationRequest.create({
      data: {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        password: await createHash(fields.password),
        street: fields.street,
        city: fields.city,
        state: fields.state,
        zipcode: fields.zip,
        dob: fields.dob,
        phoneNo: fields.phoneNo,
        gender: fields.gender,
        ssn: fields.ssn ?? "",
      },
    });

    return jsonWithError<ActionData>(
      {
        success: true,
        fieldErrors: undefined,
      },
      "Registration request submitted. Please wait for admin approval.",
    );
  }
};

export default function Register() {
  const fetcher = useFetcher<ActionData>();
  const [role, setRole] = React.useState<UserRole>(UserRole.CUSTOMER);
  const isPending = fetcher.state === "submitting";

  React.useEffect(() => {
    if (fetcher.data?.success && role === UserRole.EMPLOYEE) {
      window.location.href = "/registration-pending";
    }
  }, [fetcher.data, role]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-neutral-100 p-3">
            <ShoppingBag className="size-8 text-neutral-800" />
          </div>
        </div>
        <h2 className="mt-6 text-center font-serif text-3xl font-light tracking-wide text-neutral-900">
          Create Account
        </h2>
        <p className="mt-2 text-center text-sm uppercase tracking-wider text-neutral-600">
          Join us for exclusive fashion updates
        </p>
      </div>

      <fetcher.Form className="mx-auto max-w-xl space-y-6" method="post">
        <fieldset disabled={isPending}>
          <div className="space-y-5">
            {/* Account Type */}
            <Select
              classNames={{
                label: "block text-sm uppercase tracking-wider text-neutral-700",
                input:
                  "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
              }}
              data={Object.values(UserRole)
                .filter((role) => role !== UserRole.ADMIN)
                .map((role) => ({
                  label: role,
                  value: role,
                }))}
              label="Account Type"
              name="role"
              onChange={(value) => setRole(value as UserRole)}
              value={role}
            />

            {/* Account Details */}
            <div className="space-y-4">
              <TextInput
                classNames={{
                  root: "space-y-1",
                  label: "block text-sm uppercase tracking-wider text-neutral-700",
                  input:
                    "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                  error: "text-sm text-red-600",
                }}
                error={fetcher.data?.fieldErrors?.email}
                label="Email"
                name="email"
                required
                type="email"
              />

              <PasswordInput
                classNames={{
                  root: "space-y-1",
                  label: "block text-sm uppercase tracking-wider text-neutral-700",
                  input:
                    "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                  innerInput: "h-[42px]",
                  error: "text-sm text-red-600",
                }}
                error={fetcher.data?.fieldErrors?.password}
                label="Password"
                name="password"
                required
              />

              <PasswordInput
                classNames={{
                  root: "space-y-1",
                  label: "block text-sm uppercase tracking-wider text-neutral-700",
                  input:
                    "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                  innerInput: "h-[42px]",
                  error: "text-sm text-red-600",
                }}
                error={fetcher.data?.fieldErrors?.confirmPassword}
                label="Confirm Password"
                name="confirmPassword"
                required
              />
            </div>

            {/* Personal Information */}
            <div className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.firstName}
                  label="First Name"
                  name="firstName"
                  required
                />
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.lastName}
                  label="Last Name"
                  name="lastName"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  classNames={{
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  data={genderOptions}
                  error={fetcher.data?.fieldErrors?.gender}
                  label="Gender"
                  name="gender"
                  required
                />
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.phoneNo}
                  label="Phone Number"
                  name="phoneNo"
                  required
                />
              </div>

              <DatePickerInput
                classNames={{
                  root: "space-y-1",
                  label: "block text-sm uppercase tracking-wider text-neutral-700",
                  input:
                    "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                  error: "text-sm text-red-600",
                }}
                error={fetcher.data?.fieldErrors?.dob}
                label="Date of Birth"
                maxDate={new Date()}
                name="dob"
                required
              />

              {role === UserRole.EMPLOYEE && (
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.ssn}
                  label="SSN"
                  name="ssn"
                  required
                />
              )}
            </div>

            {/* Address Information */}
            <div className="space-y-4 pt-4">
              <TextInput
                classNames={{
                  root: "space-y-1",
                  label: "block text-sm uppercase tracking-wider text-neutral-700",
                  input:
                    "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                  error: "text-sm text-red-600",
                }}
                error={fetcher.data?.fieldErrors?.street}
                label="Street Address"
                name="street"
                required
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.city}
                  label="City"
                  name="city"
                  required
                />
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.state}
                  label="State"
                  name="state"
                  required
                />
                <TextInput
                  classNames={{
                    root: "space-y-1",
                    label: "block text-sm uppercase tracking-wider text-neutral-700",
                    input:
                      "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 focus:border-neutral-900 focus:ring-neutral-900",
                    error: "text-sm text-red-600",
                  }}
                  error={fetcher.data?.fieldErrors?.zip}
                  label="ZIP Code"
                  name="zip"
                  required
                />
              </div>
            </div>
          </div>

          <button
            className="mt-8 w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-70"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account...
              </span>
            ) : (
              "Create Account"
            )}
          </button>
        </fieldset>
      </fetcher.Form>

      <p className="mt-8 text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link
          className="font-medium text-neutral-900 transition-colors hover:text-neutral-700"
          to="/login"
        >
          Sign in
        </Link>
      </p>

      <div className="mt-8 text-center text-xs text-neutral-500">
        <p>© 2024 Clothing Store. All rights reserved.</p>
      </div>
    </div>
  );
}
