import { Button } from "@mantine/core";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { Link, useFetcher, useNavigate } from "@remix-run/react";
import { MinusIcon, PlusIcon, TrashIcon } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { type CheckoutFormValues, CheckoutModal } from "~/components/checkout-modal";
import { useCart } from "~/context/CartContext";
import { db } from "~/lib/prisma.server";
import { requireUser } from "~/lib/session.server";
import { OrderStatus, OrderType } from "~/utils/enums";

type ActionData = {
  success: boolean;
  message?: string;
  orderId?: string;
};

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (!intent) {
    return json<ActionData>({ success: false, message: "Invalid request" }, { status: 400 });
  }

  switch (intent) {
    case "place-order": {
      const orderData = JSON.parse(formData.get("orderData") as string);

      try {
        await db.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              type: orderData.orderType,
              status: OrderStatus.PENDING,
              userId: user.id,
              ...(orderData.orderType === OrderType.DELIVERY
                ? {
                    street: orderData.street,
                    apt: orderData.apt,
                    city: orderData.city,
                    state: orderData.state,
                    zipcode: orderData.zipcode,
                  }
                : { pickupTime: orderData.pickupTime ? new Date(orderData.pickupTime) : null }),
              productVariants: {
                connect: orderData.items.map((item: any) => ({ id: item.variantId })),
              },
              payment: {
                create: {
                  amount: orderData.totalAmount,
                  paymentMethod: orderData.paymentMethod,
                  address: orderData.orderType === OrderType.DELIVERY ? orderData.address : null,
                  userId: user.id,
                },
              },
            },
          });
          return order;
        });

        return json<ActionData>({ success: true });
      } catch (error) {
        console.error("Checkout error:", error);
        return json<ActionData>(
          { success: false, message: "Failed to process checkout" },
          { status: 400 },
        );
      }
    }

    default:
      return json<ActionData>({ success: false, message: "Invalid intent" }, { status: 400 });
  }
}

export default function Cart() {
  const { itemsInCart, removeItemFromCart, totalPrice, clearCart, addItemToCart, isLoading } =
    useCart();
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();

  const handleCheckout = async (values: CheckoutFormValues) => {
    const orderData = {
      ...values,
      items: itemsInCart.map((item) => ({
        variantId: item.variant.id,
        productId: item.variant.product.id,
        name: item.variant.product.name,
        price: item.variant.price,
        quantity: item.quantity,
        size: item.variant.size,
        color: item.variant.color,
        image: item.variant.product.image,
      })),
      totalAmount: totalPrice,
      pickupTime: values.pickupTime?.toISOString() || null,
    };

    const formData = new FormData();
    formData.append("intent", "place-order");
    formData.append("orderData", JSON.stringify(orderData));

    fetcher.submit(formData, {
      method: "POST",
    });
  };

  React.useEffect(() => {
    if (fetcher.state === "idle") {
      if (fetcher.data?.success) {
        setIsCheckoutModalOpen(false);
        clearCart();
        toast.success("Order placed successfully!");
        navigate("/order-history");
      }
    }
  }, [fetcher.state, fetcher.data]);

  if (isLoading) {
    return <div>Loading cart...</div>;
  }

  if (itemsInCart.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Your cart is empty</h2>
          <p className="mt-2 text-gray-500">Start shopping to add items to your cart.</p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Shopping Cart</h1>
        <Button variant="outline" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="mt-8">
        <div className="flow-root">
          <ul className="-my-6 divide-y divide-gray-200">
            {itemsInCart.map((item) => (
              <li key={item.id} className="flex py-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={item.variant.product.image || "/placeholder-product.jpg"}
                    alt={item.variant.product.name}
                    className="h-full w-full object-cover object-center"
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col">
                  <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                      <h3>{item.variant.product.name}</h3>
                      <p className="ml-4">${(item.variant.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      Size: {item.variant.size} | Color: {item.variant.color.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity > 1) {
                            addItemToCart(item.variant, item.quantity - 1);
                          }
                        }}
                        className="p-1 rounded-md border border-gray-300 hover:border-gray-400"
                        disabled={item.quantity <= 1}
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                      <button
                        type="button"
                        onClick={() => {
                          addItemToCart(item.variant, item.quantity + 1);
                        }}
                        className="p-1 rounded-md border border-gray-300 hover:border-gray-400"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex">
                      <button
                        type="button"
                        onClick={() => removeItemFromCart(item.id)}
                        className="inline-flex items-center gap-2 font-medium text-red-600 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 py-6">
        <div className="flex justify-between text-base font-medium text-gray-900">
          <p>Subtotal</p>
          <p>${totalPrice.toFixed(2)}</p>
        </div>
        <div className="mt-6">
          <Button onClick={() => setIsCheckoutModalOpen(true)}>Checkout</Button>
        </div>
        <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
          <p>
            or{" "}
            <Link to="/products" className="font-medium text-gray-900 hover:text-gray-800">
              Continue Shopping
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </p>
        </div>
      </div>

      <CheckoutModal
        opened={isCheckoutModalOpen}
        onClose={() => setIsCheckoutModalOpen(false)}
        totalAmount={totalPrice}
        onSubmit={handleCheckout}
      />
    </div>
  );
}
