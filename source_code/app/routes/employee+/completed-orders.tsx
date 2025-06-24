import { Badge } from "@mantine/core";
import { DeliveryStatus } from "@prisma/client";
import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { db } from "~/lib/prisma.server";
import { requireUser } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const completedDeliveries = await db.delivery.findMany({
    where: {
      deliveryPersonId: user.id,
      status: {
        in: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED, DeliveryStatus.REJECTED],
      },
    },
    include: {
      order: {
        include: {
          payment: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phoneNo: true,
            },
          },
          productVariants: {
            include: {
              product: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return json({ completedDeliveries });
}

function getStatusColor(status: DeliveryStatus) {
  switch (status) {
    case DeliveryStatus.REJECTED:
    case DeliveryStatus.FAILED:
      return "red";
    case DeliveryStatus.DELIVERED:
      return "green";
    default:
      return "gray";
  }
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default function CompletedOrders() {
  const { completedDeliveries } = useLoaderData<typeof loader>();

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Completed Deliveries</h1>

      <div className="space-y-8">
        {completedDeliveries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No completed deliveries found</p>
        ) : (
          completedDeliveries.map(({ id, status, order, updatedAt }) => (
            <div key={id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Completed on {format(new Date(updatedAt), "PPP")}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        Customer: {order.user.firstName} {order.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{order.user.email}</p>
                      <p className="text-sm text-gray-500">Phone: {order.user.phoneNo}</p>
                    </div>
                  </div>

                  <Badge color={getStatusColor(status)} size="lg">
                    {formatStatusLabel(status)}
                  </Badge>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">Delivery Address:</p>
                  <p className="text-sm text-gray-500">
                    {order.street}, {order.apt}, {order.city}, {order.state}, {order.zipcode}
                  </p>
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

                {order.payment && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        Total: ${order.payment.amount.toFixed(2)}
                      </p>
                      <p className="text-gray-500 mt-1">
                        Payment Method: {formatStatusLabel(order.payment.paymentMethod)}
                      </p>
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
