import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Outlet, useLoaderData, useLocation } from "@remix-run/react";
import { ClipboardList, Folder, InboxIcon, LogOut, Store, Users } from "lucide-react";

import { type NavItem, SidebarNav } from "~/components/sidebar-nav";
import { db } from "~/lib/prisma.server";
import { requireUser, requireUserId, validateUserRole } from "~/lib/session.server";
import { ResetPasswordModal } from "~/routes/resources+/reset-password";
import { UserRole } from "~/utils/enums";
import { useAuth } from "~/utils/hooks/use-auth";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request);
  await validateUserRole(request, UserRole.EMPLOYEE);

  const employee = await db.employee.findUnique({ where: { id: userId } });

  return json({ hasResetPassword: employee!.hasResetPassword });
};

function getPageTitle(pathname: string) {
  switch (pathname) {
    case "/employee/orders":
      return "Orders";
    case "/employee/completed-orders":
      return "Completed Orders";
    default:
      return "";
  }
}

const employeeNavItems: NavItem[] = [
  {
    label: "Orders",
    to: "/employee/orders",
    icon: ClipboardList,
  },
  {
    label: "Completed Orders",
    to: "/employee/completed-orders",
    icon: ClipboardList,
  },
];

export default function EmployeeLayout() {
  const { hasResetPassword } = useLoaderData<typeof loader>();
  const location = useLocation();
  const title = getPageTitle(location.pathname);
  const { user } = useAuth();

  return (
    <div className="relative flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 hidden w-72 lg:block">
        <SidebarNav
          title="Clothing Store"
          subTitle="Employee Portal"
          items={employeeNavItems}
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

        <ResetPasswordModal
          hasResetPassword={hasResetPassword}
          onClose={() => {}}
          userId={user.id}
        />
      </div>
    </div>
  );
}
