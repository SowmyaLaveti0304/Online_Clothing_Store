import { Badge, Select } from "@mantine/core";
import { DeliveryStatus, OrderStatus, OrderType, ReturnStatus, ReturnMethod } from "@prisma/client";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { db } from "~/lib/prisma.server";
import invariant from "tiny-invariant";

export async function loader() {
  const [orders, employees] = await Promise.all([
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        status: true,
        type: true,
        street: true,
        apt: true,
        city: true,
        state: true,
        zipcode: true,
        pickupTime: true,
        returnStatus: true,
        returnMethod: true,
        returnReason: true,
        returnRequestAt: true,
        payment: {
          select: {
            amount: true,
            paymentMethod: true,
          },
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        delivery: {
          select: {
            id: true,
            status: true,
            deliveryPerson: {
              select: {
                id: true,
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
    }),
    db.employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    }),
  ]);

  return json({ orders, employees });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  invariant(intent, "Invalid intent");

  const orderId = formData.get("orderId")?.toString();
  invariant(orderId, "Invalid order id");

  switch (intent) {
    case "update-status": {
      const status = formData.get("status")?.toString() as OrderStatus;
      invariant(status, "Invalid status");

      const order = await db.order.findUnique({
        where: { id: orderId },
        include: { user: true },
      });
      invariant(order, "Order not found");

      await db.order.update({
        where: { id: orderId },
        data: { status },
      });

      return json({ success: true });
    }

    case "assign-delivery": {
      const employeeId = formData.get("employeeId")?.toString();
      invariant(employeeId, "Invalid employee id");

      await db.$transaction(async (tx) => {
        await tx.delivery.create({
          data: {
            status: DeliveryStatus.PENDING,
            deliveryPerson: {
              connect: { id: employeeId },
            },
            order: {
              connect: { id: orderId },
            },
          },
        });

        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.ASSIGNED_TO_DELIVERY },
        });
      });

      return json({ success: true });
    }

    case "update-return-status": {
      const returnStatus = formData.get("returnStatus")?.toString() as ReturnStatus;
      invariant(returnStatus, "Invalid return status");

      await db.order.update({
        where: { id: orderId },
        data: { returnStatus },
      });

      return json({ success: true });
    }

    default:
      return json({ success: false, message: "Invalid intent" }, { status: 400 });
  }
}

function getAvailableStatuses(order: {
  status: OrderStatus;
  type: OrderType;
  delivery?: { id: string; status: DeliveryStatus } | null;
}) {
  // If order is in a final state (completed, cancelled, or rejected)
  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.COMPLETED ||
    order.status === OrderStatus.REJECTED
  ) {
    return [order.status]; // Return only current status, preventing changes
  }

  // For pickup orders
  if (order.type === OrderType.PICKUP) {
    switch (order.status) {
      case OrderStatus.PENDING:
        return [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.REJECTED];
      case OrderStatus.ACCEPTED:
        return [OrderStatus.ACCEPTED, OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED];
      case OrderStatus.READY_FOR_PICKUP:
        return [OrderStatus.READY_FOR_PICKUP, OrderStatus.COMPLETED, OrderStatus.CANCELLED];
      default:
        return [order.status];
    }
  }

  // For delivery orders
  if (!order.delivery) {
    // Before delivery partner assignment
    switch (order.status) {
      case OrderStatus.PENDING:
        return [OrderStatus.PENDING, OrderStatus.ACCEPTED, OrderStatus.REJECTED];
      case OrderStatus.ACCEPTED:
        // After acceptance, admin can assign delivery partner
        return [OrderStatus.ACCEPTED, OrderStatus.CANCELLED];
      default:
        return [order.status];
    }
  }

  // After delivery partner is assigned
  switch (order.delivery.status) {
    case DeliveryStatus.PENDING:
      return [OrderStatus.ASSIGNED_TO_DELIVERY, OrderStatus.REJECTED, OrderStatus.CANCELLED];
    case DeliveryStatus.PICKED_UP:
    case DeliveryStatus.IN_TRANSIT:
      // Admin can only view status while delivery is in progress
      return [OrderStatus.ASSIGNED_TO_DELIVERY];
    case DeliveryStatus.DELIVERED:
      // Can mark as completed after delivery
      return [OrderStatus.COMPLETED];
    case DeliveryStatus.FAILED:
    case DeliveryStatus.REJECTED:
      // Can mark as cancelled if delivery fails
      return [OrderStatus.REJECTED];
    default:
      return [order.status];
  }
}

function getStatusColor(status: OrderStatus) {
  switch (status) {
    case OrderStatus.CANCELLED:
      return "red";
    case OrderStatus.COMPLETED:
      return "green";
    case OrderStatus.READY_FOR_PICKUP:
      return "yellow";
    case OrderStatus.ACCEPTED:
      return "blue";
    case OrderStatus.ASSIGNED_TO_DELIVERY:
      return "indigo";
    default:
      return "gray";
  }
}

function getDeliveryStatusColor(status: DeliveryStatus) {
  switch (status) {
    case DeliveryStatus.REJECTED:
    case DeliveryStatus.FAILED:
      return "red";
    case DeliveryStatus.DELIVERED:
      return "green";
    case DeliveryStatus.PENDING:
      return "gray";
    case DeliveryStatus.PICKED_UP:
      return "yellow";
    case DeliveryStatus.IN_TRANSIT:
      return "blue";
    default:
      return "gray";
  }
}

function generateOrderNumber(orderId: string) {
  const shortId = orderId.slice(-6).toUpperCase();
  return `ORD-${shortId}`;
}

function formatStatusLabel(status: string) {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getReturnStatusColor(status: ReturnStatus) {
  switch (status) {
    case ReturnStatus.REJECTED:
      return "red";
    case ReturnStatus.APPROVED:
      return "blue";
    case ReturnStatus.RECEIVED:
      return "yellow";
    case ReturnStatus.REFUNDED:
      return "green";
    case ReturnStatus.CANCELLED:
      return "gray";
    default:
      return "gray";
  }
}

function isReturnStatusFinal(status: ReturnStatus) {
  return status === ReturnStatus.REFUNDED || status === ReturnStatus.CANCELLED;
}

export default function OrdersIndex() {
  const { orders, employees } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleStatusChange = (orderId: string, status: string) => {
    const formData = new FormData();
    formData.append("intent", "update-status");
    formData.append("orderId", orderId);
    formData.append("status", status);
    fetcher.submit(formData, { method: "POST" });
  };

  const handleDeliveryAssignment = (orderId: string, employeeId: string) => {
    const formData = new FormData();
    formData.append("intent", "assign-delivery");
    formData.append("orderId", orderId);
    formData.append("employeeId", employeeId);
    fetcher.submit(formData, { method: "POST" });
  };

  const handleReturnStatusChange = (orderId: string, returnStatus: string) => {
    const formData = new FormData();
    formData.append("intent", "update-return-status");
    formData.append("orderId", orderId);
    formData.append("returnStatus", returnStatus);
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Manage Orders</h1>

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
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        Customer: {order.user.firstName} {order.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{order.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge color={getStatusColor(order.status)} size="lg">
                      {formatStatusLabel(order.status)}
                    </Badge>

                    {order.delivery ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-sm">
                          <span className="font-medium">Delivery Partner: </span>
                          {order.delivery.deliveryPerson.firstName}{" "}
                          {order.delivery.deliveryPerson.lastName}
                        </div>
                        <Badge color={getDeliveryStatusColor(order.delivery.status)}>
                          Delivery Status: {formatStatusLabel(order.delivery.status)}
                        </Badge>
                        {!["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status) && (
                          <Select
                            value={order.status}
                            onChange={(value) => value && handleStatusChange(order.id, value)}
                            data={getAvailableStatuses(order).map((status) => ({
                              value: status,
                              label: formatStatusLabel(status),
                            }))}
                            className="w-48"
                          />
                        )}
                      </div>
                    ) : (
                      <>
                        {!["COMPLETED", "CANCELLED", "REJECTED"].includes(order.status) ? (
                          <Select
                            value={order.status}
                            onChange={(value) => value && handleStatusChange(order.id, value)}
                            data={getAvailableStatuses(order).map((status) => ({
                              value: status,
                              label: formatStatusLabel(status),
                            }))}
                            className="w-48"
                          />
                        ) : null}
                        {order.type === OrderType.DELIVERY &&
                          order.status === OrderStatus.ACCEPTED &&
                          !order.delivery && (
                            <Select
                              placeholder="Assign Delivery Agent"
                              onChange={(value) =>
                                value && handleDeliveryAssignment(order.id, value)
                              }
                              data={employees.map((emp) => ({
                                value: emp.id,
                                label: `${emp.firstName} ${emp.lastName}`,
                              }))}
                              className="w-48"
                            />
                          )}
                      </>
                    )}
                  </div>
                </div>

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

                {order.returnStatus && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Return Request</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Requested on: {format(new Date(order.returnRequestAt!), "PPP")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Return Method: {order.returnMethod?.replace(/_/g, " ")}
                        </p>
                        {order.returnReason && (
                          <p className="text-sm text-gray-600">Reason: {order.returnReason}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Badge color={getReturnStatusColor(order.returnStatus)}>
                          Return Status: {formatStatusLabel(order.returnStatus)}
                        </Badge>
                        {!isReturnStatusFinal(order.returnStatus) && (
                          <Select
                            value={order.returnStatus}
                            onChange={(value) => value && handleReturnStatusChange(order.id, value)}
                            data={Object.values(ReturnStatus).map((status) => ({
                              value: status,
                              label: formatStatusLabel(status),
                            }))}
                            className="w-48"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
