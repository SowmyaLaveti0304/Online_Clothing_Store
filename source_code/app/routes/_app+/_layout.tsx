import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import {
  CreditCardIcon,
  LogOut,
  ShoppingBag,
  ShoppingBagIcon,
  SparklesIcon,
  ShoppingCartIcon,
} from "lucide-react";

import { requireUser, validateUserRole } from "~/lib/session.server";
import { UserRole } from "~/utils/enums";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await validateUserRole(request, UserRole.CUSTOMER);
  const user = await requireUser(request);
  return json({ user });
};

const navItems = [
  {
    label: "Products",
    to: "/products",
    icon: SparklesIcon,
  },
  {
    label: "Orders",
    to: "/order-history",
    icon: ShoppingBagIcon,
  },
  {
    label: "Payments",
    to: "/payments",
    icon: CreditCardIcon,
  },
];

export default function AppLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="rounded-xl bg-gray-900 p-2">
                <ShoppingBag className="size-5 text-white" />
              </div>
              <span className="text-lg font-medium">Clothing Store</span>
            </Link>

            {/* Main Navigation */}
            <div className="hidden lg:block">
              <ul className="flex items-center gap-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.to;

                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-offset-2 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                          isActive
                            ? "bg-gray-900 text-white hover:bg-gray-800"
                            : "text-gray-700 hover:text-gray-900"
                        }`}
                      >
                        <Icon className={`size-4 ${!isActive && "group-hover:text-gray-900"}`} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Profile Menu */}
            <div className="flex items-center gap-4">
              {/* Cart Icon */}
              <Link
                to="/cart"
                className="flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              >
                <ShoppingCartIcon className="size-5" />
              </Link>

              <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
                <div className="flex size-7 items-center justify-center rounded-full bg-gray-900 text-sm font-medium text-white">
                  {user.firstName[0]}
                  {user.lastName[0]}
                </div>
                <div className="hidden text-sm md:block">
                  <p className="font-medium text-gray-700">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <Form action="/logout" method="post">
                <button
                  type="submit"
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                >
                  <LogOut className="size-5" />
                </button>
              </Form>
            </div>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
