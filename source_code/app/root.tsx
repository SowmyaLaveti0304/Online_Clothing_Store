import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "~/styles/tailwind.css";

import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import { type LoaderFunctionArgs, type MetaFunction, json } from "@remix-run/node";
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import { getToast } from "remix-toast";

import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { Toaster } from "sonner";
import { DefaultErrorBoundary } from "~/components/ui/error-boundary";
import { CartProvider } from "~/context/CartContext";
import { db } from "~/lib/prisma.server";
import { getUser } from "~/lib/session.server";
import { useGlobalToast } from "~/utils/hooks/use-global-toast";
import type { CartItem } from "~/context/CartContext";

export async function loader({ request }: LoaderFunctionArgs) {
  const { headers: toastHeaders, toast } = await getToast(request);
  const user = await getUser(request);

  let cartItems: CartItem[] = [];

  if (user) {
    const dbCartItems = await db.cartItem.findMany({
      where: { customerId: user.id },
      include: {
        variant: {
          include: {
            product: true,
          },
        },
      },
    });

    cartItems = dbCartItems.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })) as CartItem[];
  }

  return json({ user, cartItems, toast }, { headers: toastHeaders });
}

export const meta: MetaFunction = () => {
  return [{ title: "Clothing Store" }, { name: "description", content: "Clothing Store" }];
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html className="h-full" lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body className="h-full" suppressHydrationWarning>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { toast } = useLoaderData<typeof loader>();

  useGlobalToast(toast);

  return (
    <CartProvider>
      <MantineProvider
        theme={{
          primaryColor: "dark",
        }}
      >
        <Notifications position="bottom-right" />
        <Toaster
          closeButton
          duration={3000}
          position="top-center"
          richColors
          theme="light"
          visibleToasts={3}
        />
        <ModalsProvider>
          <Outlet />
        </ModalsProvider>
      </MantineProvider>
    </CartProvider>
  );
}

export function ErrorBoundary() {
  return <DefaultErrorBoundary />;
}

export function HydrateFallback() {
  return <h1>Loading...</h1>;
}
