import { Checkbox, PasswordInput, TextInput } from "@mantine/core";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Link, useFetcher } from "@remix-run/react";
import { ShoppingBag } from "lucide-react";

import { verifyLogin } from "~/lib/auth.server";
import { createUserSession } from "~/lib/session.server";
import { badRequest, safeRedirect } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { LoginSchema } from "~/utils/zod.schema";

interface ActionData {
  fieldErrors?: inferErrors<typeof LoginSchema>;
}

export type SearchParams = {
  redirectTo?: string;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { fieldErrors, fields } = await validateAction(request, LoginSchema);

  if (fieldErrors) {
    return badRequest<ActionData>({ fieldErrors });
  }

  const { email, password, redirectTo, remember } = fields;

  const user = await verifyLogin(email, password);
  if (!user) {
    return badRequest<ActionData>({
      fieldErrors: {
        password: "Invalid username or password",
      },
    });
  }

  return createUserSession({
    redirectTo: safeRedirect(redirectTo),
    remember: remember === "on",
    request,
    role: user.role,
    userId: user.id,
  });
};

export default function Login() {
  const fetcher = useFetcher<ActionData>();
  const isPending = fetcher.state !== "idle";

  return (
    <div className="w-full">
      <div className="mb-10">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-neutral-100 p-3">
            <ShoppingBag className="size-8 text-neutral-800" />
          </div>
        </div>
        <h2 className="mt-6 text-center font-serif text-3xl font-light tracking-wide text-neutral-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-center text-sm uppercase tracking-wider text-neutral-600">
          Sign in to your account
        </p>
      </div>

      <fetcher.Form className="mt-8 space-y-6" method="post">
        <fieldset disabled={isPending}>
          <div className="space-y-5">
            <TextInput
              classNames={{
                root: "space-y-1",
                label: "block text-sm uppercase tracking-wider text-neutral-700",
                input:
                  "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 px-4 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-neutral-900",
                error: "mt-1 text-sm text-red-600",
              }}
              error={fetcher.data?.fieldErrors?.email}
              id="email"
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
                  "h-[42px] rounded-lg border-neutral-200 bg-neutral-50 px-4 placeholder-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none focus:ring-neutral-900",
                innerInput: "h-[42px]",
                error: "mt-1 text-sm text-red-600",
              }}
              error={fetcher.data?.fieldErrors?.password}
              id="password"
              label="Password"
              name="password"
              required
            />

            <div className="flex items-center justify-between">
              <Checkbox
                classNames={{
                  input:
                    "h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900",
                  label: "ml-2 text-sm text-neutral-600",
                }}
                id="remember"
                label="Keep me signed in"
                name="remember"
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              className="relative w-full rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2 disabled:opacity-70"
              disabled={isPending}
              type="submit"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </fieldset>
      </fetcher.Form>

      <p className="mt-8 text-center text-sm text-neutral-600">
        New customer?{" "}
        <Link
          className="font-medium text-neutral-900 transition-colors hover:text-neutral-700"
          to="/register"
        >
          Create an account
        </Link>
      </p>

      <div className="mt-8 text-center text-xs text-neutral-500">
        <p>© 2024 Clothing Store. All rights reserved.</p>
      </div>
    </div>
  );
}
