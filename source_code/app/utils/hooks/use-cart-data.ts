import { useRouteLoaderData } from "@remix-run/react";
import type { CartItem } from "~/context/CartContext";
import type { loader } from "~/root";

export function useCartData() {
  const data = useRouteLoaderData<typeof loader>("root");
  return (data?.cartItems as CartItem[]) ?? [];
}
