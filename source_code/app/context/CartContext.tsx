import { cleanNotifications, showNotification } from "@mantine/notifications";
import type { Product, ProductVariant, CartItem as PrismaCartItem } from "@prisma/client";
import { CheckCircleIcon, MinusCircleIcon, PlusCircleIcon } from "lucide-react";
import * as React from "react";
import { useFetcher, type FetcherWithComponents, useRouteLoaderData } from "@remix-run/react";
import type { DateToString } from "~/utils/types";
import { useCartData } from "~/utils/hooks/use-cart-data";

export type CartItem = DateToString<
  PrismaCartItem & {
    variant: ProductVariant & {
      product: Product;
    };
  }
>;

interface ICartContext {
  itemsInCart: Array<CartItem>;
  addItemToCart: (variant: ProductVariant & { product: Product }, quantity: number) => void;
  removeItemFromCart: (itemId: CartItem["id"]) => void;
  clearCart: () => void;
  totalPrice: number;
  isLoading: boolean;
}

const CartContext = React.createContext<ICartContext | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const initialCartItems = useCartData();
  const [items, setItems] = React.useState<CartItem[]>(initialCartItems);
  const fetcher = useFetcher() as FetcherWithComponents<{ items: CartItem[] }>;
  const isLoading = fetcher.state !== "idle";

  // Update items when initial cart data changes (user switches)
  React.useEffect(() => {
    setItems(initialCartItems);
  }, [initialCartItems]);

  // Update items when fetcher data changes (cart operations)
  React.useEffect(() => {
    if (fetcher.data?.items) {
      setItems(fetcher.data.items);
    }
  }, [fetcher.data]);

  const totalPrice = items.reduce((acc, item) => acc + item.variant.price * item.quantity, 0);

  const clearCart = React.useCallback(() => {
    if (isLoading) {
      return; // Prevent multiple submissions
    }
    cleanNotifications();
    fetcher.submit({ intent: "clear-cart" }, { method: "POST", action: "/api/cart" });
    showNotification({
      title: "Successfully cleared",
      message: "All items in the cart are cleared",
      icon: <CheckCircleIcon className="h-7 w-7" />,
      color: "green",
    });
  }, [fetcher, isLoading]);

  const addItemToCart = React.useCallback(
    (variant: ProductVariant & { product: Product }, quantity: number) => {
      if (isLoading) {
        return; // Prevent multiple submissions
      }
      fetcher.submit(
        {
          intent: "add-item",
          variantId: variant.id,
          quantity: quantity.toString(),
        },
        { method: "POST", action: "/api/cart" },
      );
      showNotification({
        title: "Successfully added",
        message: "Item added to cart",
        icon: <PlusCircleIcon className="h-7 w-7" />,
        color: "green",
      });
    },
    [fetcher, isLoading],
  );

  const removeItemFromCart = React.useCallback(
    (itemId: CartItem["id"]) => {
      if (isLoading) {
        return; // Prevent multiple submissions
      }
      fetcher.submit(
        {
          intent: "remove-item",
          itemId,
        },
        { method: "POST", action: "/api/cart" },
      );
      showNotification({
        title: "Successfully removed",
        message: "Item removed from cart",
        icon: <MinusCircleIcon className="h-7 w-7" />,
        color: "red",
      });
    },
    [fetcher, isLoading],
  );

  const value = React.useMemo(
    () => ({
      itemsInCart: items,
      totalPrice,
      addItemToCart,
      removeItemFromCart,
      clearCart,
      isLoading,
    }),
    [items, totalPrice, addItemToCart, removeItemFromCart, clearCart, isLoading],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("`useCart()` must be used within a <CartProvider />");
  }
  return context;
}
