import { Button, Modal, Select, Textarea } from "@mantine/core";
import { OrderStatus, OrderType, DeliveryStatus, ReturnMethod, ReturnStatus } from "@prisma/client";
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { db } from "~/lib/prisma.server";
import { requireUser } from "~/lib/session.server";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const orders = await db.order.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      payment: {
        select: {
          amount: true,
          paymentMethod: true,
        },
      },
      delivery: {
        select: {
          status: true,
          deliveryPerson: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      productVariants: {
        select: {
          id: true,
          size: true,
          color: true,
          price: true,
          quantity: true,
          product: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  return json({ orders });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const orderId = formData.get("orderId")?.toString();
  const actionType = formData.get("actionType")?.toString();

  if (!orderId) {
    return json({ success: false, message: "Order ID is required" }, { status: 400 });
  }

  try {
    if (actionType === "cancel") {
      await db.order.update({
        where: {
          id: orderId,
          userId: user.id,
        },
        data: {
          status: OrderStatus.CANCELLED,
        },
      });
    } else if (actionType === "return") {
      const returnMethod = formData.get("returnMethod")?.toString();
      const returnReason = formData.get("returnReason")?.toString();

      if (!returnMethod || !returnReason) {
        return json(
          { success: false, message: "Return method and reason are required" },
          { status: 400 },
        );
      }

      await db.order.update({
        where: {
          id: orderId,
          userId: user.id,
        },
        data: {
          returnStatus: ReturnStatus.PENDING,
          returnMethod: returnMethod as ReturnMethod,
          returnReason: returnReason,
          returnRequestAt: new Date(),
        },
      });
    }

    return json({ success: true });
  } catch (error) {
    console.error("Failed to process order action:", error);
    return json({ success: false, message: "Failed to process request" }, { status: 400 });
  }
}

function generateOrderNumber(orderId: string) {
  const shortId = orderId.slice(-6).toUpperCase();
  return `ORD-${shortId}`;
}

function getDeliveryStatusColor(status: DeliveryStatus) {
  switch (status) {
    case DeliveryStatus.REJECTED:
    case DeliveryStatus.FAILED:
      return "bg-red-100 text-red-800";
    case DeliveryStatus.DELIVERED:
      return "bg-green-100 text-green-800";
    case DeliveryStatus.PENDING:
      return "bg-gray-100 text-gray-800";
    case DeliveryStatus.PICKED_UP:
      return "bg-yellow-100 text-yellow-800";
    case DeliveryStatus.IN_TRANSIT:
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getReturnStatusColor(status: ReturnStatus) {
  switch (status) {
    case ReturnStatus.REJECTED:
      return "bg-red-100 text-red-800";
    case ReturnStatus.APPROVED:
      return "bg-blue-100 text-blue-800";
    case ReturnStatus.RECEIVED:
      return "bg-yellow-100 text-yellow-800";
    case ReturnStatus.REFUNDED:
      return "bg-green-100 text-green-800";
    case ReturnStatus.CANCELLED:
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function OrderHistory() {
  const { orders } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [returnMethod, setReturnMethod] = useState<ReturnMethod | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const handleCancelOrder = (orderId: string, isCompleted: boolean) => {
    if (isCompleted) {
      setSelectedOrder(orderId);
      setReturnModalOpen(true);
    } else {
      const formData = new FormData();
      formData.append("orderId", orderId);
      formData.append("actionType", "cancel");
      fetcher.submit(formData, { method: "POST" });
    }
  };

  const handleReturnSubmit = () => {
    if (!selectedOrder || !returnMethod || !returnReason) {
      return;
    }

    const formData = new FormData();
    formData.append("orderId", selectedOrder);
    formData.append("actionType", "return");
    formData.append("returnMethod", returnMethod);
    formData.append("returnReason", returnReason);
    fetcher.submit(formData, { method: "POST" });
    setReturnModalOpen(false);
    resetReturnForm();
  };

  const resetReturnForm = () => {
    setSelectedOrder(null);
    setReturnMethod(null);
    setReturnReason("");
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Order History</h1>

      <div className="space-y-8">
        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders found</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order placed on {format(new Date(order.createdAt), "PPP")}
                    </p>
                    <p className="text-sm text-gray-500">
                      Order ID: {generateOrderNumber(order.id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        order.status === OrderStatus.CANCELLED
                          ? "bg-red-100 text-red-800"
                          : order.status === OrderStatus.COMPLETED
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                    {(order.status === OrderStatus.PENDING ||
                      (order.status === OrderStatus.COMPLETED && !order.returnStatus)) && (
                      <Button
                        variant="outline"
                        color="red"
                        size="sm"
                        onClick={() =>
                          handleCancelOrder(order.id, order.status === OrderStatus.COMPLETED)
                        }
                        loading={fetcher.state !== "idle"}
                      >
                        {order.status === OrderStatus.COMPLETED ? "Return Order" : "Cancel Order"}
                      </Button>
                    )}
                  </div>
                </div>

                {order.type === OrderType.DELIVERY && order.delivery && (
                  <div className="mb-4 mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Delivery Details</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Delivery Agent: {order.delivery.deliveryPerson.firstName}{" "}
                          {order.delivery.deliveryPerson.lastName}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getDeliveryStatusColor(
                          order.delivery.status,
                        )}`}
                      >
                        Delivery Status: {order.delivery.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                )}

                {order.returnStatus && (
                  <div className="mb-4 mt-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Return Details</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Return initiated by you on{" "}
                          {format(new Date(order.returnRequestAt!), "PPP")}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Return Method: {order.returnMethod?.replace(/_/g, " ")}
                        </p>
                        {order.returnReason && (
                          <p className="text-sm text-gray-600 mt-1">Reason: {order.returnReason}</p>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getReturnStatusColor(
                          order.returnStatus,
                        )}`}
                      >
                        Return Status: {order.returnStatus.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mt-6 divide-y divide-gray-200">
                  {order.productVariants.map((variant) => (
                    <div key={variant.id} className="flex py-4 gap-4">
                      <div className="h-20 w-20 flex-shrink-0">
                        <img
                          src={variant.product.image || "/placeholder-product.jpg"}
                          alt={variant.product.name}
                          className="h-full w-full object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h3 className="text-sm font-medium text-gray-900">
                            {variant.product.name}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Size: {variant.size} | Color: {variant.color.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium text-gray-900">Order Type: {order.type}</p>
                      {order.type === OrderType.DELIVERY &&
                        order.street &&
                        order.city &&
                        order.state &&
                        order.zipcode && (
                          <p className="text-gray-500 mt-1">
                            Delivery Address: {order.street}, {order.apt}, {order.city},{" "}
                            {order.state},{order.zipcode}
                          </p>
                        )}
                      {order.type === OrderType.PICKUP && order.pickupTime && (
                        <p className="text-gray-500 mt-1">
                          Pickup Time: {format(new Date(order.pickupTime), "PPp")}
                        </p>
                      )}
                    </div>
                    {order.payment && (
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          Total: ${order.payment.amount.toFixed(2)}
                        </p>
                        <p className="text-gray-500 mt-1">
                          Payment Method: {order.payment.paymentMethod.replace(/_/g, " ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Modal
        opened={returnModalOpen}
        onClose={() => {
          setReturnModalOpen(false);
          resetReturnForm();
        }}
        title="Return Order"
      >
        <div className="space-y-4">
          <Select
            label="Return Method"
            placeholder="Select return method"
            data={[
              { value: ReturnMethod.UPS_STORE, label: "UPS Store" },
              { value: ReturnMethod.IN_STORE, label: "In Store" },
            ]}
            value={returnMethod}
            onChange={(value) => setReturnMethod(value as ReturnMethod)}
            required
          />
          <Textarea
            label="Return Reason"
            placeholder="Please provide a reason for return"
            value={returnReason}
            onChange={(e) => setReturnReason(e.currentTarget.value)}
            required
            minRows={3}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setReturnModalOpen(false);
                resetReturnForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReturnSubmit}
              loading={fetcher.state !== "idle"}
              disabled={!returnMethod || !returnReason}
            >
              Submit Return Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
