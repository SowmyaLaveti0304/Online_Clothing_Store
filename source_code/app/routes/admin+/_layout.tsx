import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { ClipboardList, Folder, InboxIcon, LogOut, Store, Users } from "lucide-react";

import { type NavItem, SidebarNav } from "~/components/sidebar-nav";
import { requireUser, validateUserRole } from "~/lib/session.server";
import { UserRole } from "~/utils/enums";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await validateUserRole(request, UserRole.ADMIN);
  const user = await requireUser(request);
  return json({ user });
};

function getPageTitle(pathname: string) {
  switch (pathname) {
    case "/admin/registration-requests":
      return "Registration Requests";
    case "/admin/customers":
      return "Customers";
    case "/admin/employee":
      return "Employees";
    case "/admin/orders":
      return "Orders";
    case "/admin/products":
      return "Products";
    case "/admin/categories":
      return "Categories";
    default:
      return "";
  }
}

const adminNavItems: NavItem[] = [
  {
    label: "Categories",
    to: "/admin/categories",
    icon: Folder,
  },
  {
    label: "Products",
    to: "/admin/products",
    icon: Store,
  },
  {
    label: "Customers",
    to: "/admin/customers",
    icon: Users,
  },
  {
    label: "Employees",
    to: "/admin/employee",
    icon: Users,
  },
  {
    label: "Orders",
    to: "/admin/orders",
    icon: ClipboardList,
  },
  {
    label: "Registration Requests",
    to: "/admin/registration-requests",
    icon: InboxIcon,
  },
];

export default function AdminLayout() {
  const { user } = useLoaderData<typeof loader>();
  const location = useLocation();
  const title = getPageTitle(location.pathname);

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 hidden w-72 lg:block">
        <SidebarNav
          title="Clothing Store"
          subTitle="Admin Portal"
          items={adminNavItems}
          footer={
            <Form action="/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 text-sm font-medium text-gray-300 transition hover:text-white"
              >
                <LogOut className="size-5" />
                Sign Out
              </button>
            </Form>
          }
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-72">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <h1 className="text-xl font-medium text-gray-900">{title}</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {/* Profile */}
                <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1.5">
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
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
