import { Badge, Select } from "@mantine/core";
import { DeliveryStatus } from "@prisma/client";
import { type ActionFunctionArgs, type LoaderFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import invariant from "tiny-invariant";
import { db } from "~/lib/prisma.server";
import { requireUser } from "~/lib/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const deliveries = await db.delivery.findMany({
    where: {
      deliveryPersonId: user.id,
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
      createdAt: "desc",
    },
  });

  return json({ deliveries });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const deliveryId = formData.get("deliveryId")?.toString();

  invariant(deliveryId, "Delivery ID is required");
  invariant(intent, "Intent is required");

  switch (intent) {
    case "update-delivery-status": {
      const status = formData.get("status") as DeliveryStatus;
      invariant(status, "Status is required");

      const delivery = await db.delivery.findUnique({
        where: { id: deliveryId, deliveryPersonId: user.id },
        include: { order: true },
      });

      invariant(delivery, "Delivery not found");

      await db.$transaction(async (tx) => {
        await tx.delivery.update({
          where: { id: deliveryId },
          data: { status },
        });

        // Update order status if delivery is completed or failed
        if (status === DeliveryStatus.DELIVERED) {
          await tx.delivery.update({
            where: { id: deliveryId },
            data: { status: DeliveryStatus.DELIVERED },
          });
        } else if (status === DeliveryStatus.FAILED || status === DeliveryStatus.REJECTED) {
          await tx.delivery.update({
            where: { id: deliveryId },
            data: { status: DeliveryStatus.REJECTED },
          });
        }
      });

      return json({ success: true });
    }

    default:
      return json({ success: false, message: "Invalid intent" }, { status: 400 });
  }
}

function getAvailableDeliveryStatuses(currentStatus: DeliveryStatus) {
  switch (currentStatus) {
    case DeliveryStatus.PENDING:
      return [DeliveryStatus.PENDING, DeliveryStatus.PICKED_UP, DeliveryStatus.REJECTED];
    case DeliveryStatus.PICKED_UP:
      return [DeliveryStatus.PICKED_UP, DeliveryStatus.IN_TRANSIT, DeliveryStatus.REJECTED];
    case DeliveryStatus.IN_TRANSIT:
      return [
        DeliveryStatus.IN_TRANSIT,
        DeliveryStatus.DELIVERED,
        DeliveryStatus.FAILED,
        DeliveryStatus.REJECTED,
      ];
    case DeliveryStatus.DELIVERED:
      return [DeliveryStatus.DELIVERED];
    case DeliveryStatus.FAILED:
      return [DeliveryStatus.FAILED];
    case DeliveryStatus.REJECTED:
      return [DeliveryStatus.REJECTED];
    default:
      return [DeliveryStatus.PENDING];
  }
}

function formatStatusLabel(status: string | DeliveryStatus | null | undefined): string {
  if (!status) {
    return "";
  }

  // Handle both string and enum values
  const statusString = typeof status === "string" ? status : String(status);

  return statusString
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getStatusColor(status: DeliveryStatus) {
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

function isFinalStatus(status: DeliveryStatus): boolean {
  const finalStatuses: DeliveryStatus[] = [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
    DeliveryStatus.REJECTED,
  ];
  return finalStatuses.includes(status);
}

export default function EmployeeOrders() {
  const { deliveries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const handleStatusChange = (deliveryId: string, status: DeliveryStatus) => {
    const formData = new FormData();
    formData.append("intent", "update-delivery-status");
    formData.append("deliveryId", deliveryId);
    formData.append("status", status);
    fetcher.submit(formData, { method: "POST" });
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">My Deliveries</h1>

      <div className="space-y-8">
        {deliveries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No active deliveries found</p>
        ) : (
          deliveries.map(({ id, status, order }) => (
            <div key={id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Order placed on {format(new Date(order.createdAt), "PPP")}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">
                        Customer: {order.user.firstName} {order.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{order.user.email}</p>
                      <p className="text-sm text-gray-500">Phone: {order.user.phoneNo}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge color={getStatusColor(status)} size="lg">
                      {formatStatusLabel(status)}
                    </Badge>
                    {!isFinalStatus(status) && (
                      <Select
                        value={String(status)}
                        onChange={(value) =>
                          value && handleStatusChange(id, value as DeliveryStatus)
                        }
                        data={getAvailableDeliveryStatuses(status).map((deliveryStatus) => ({
                          value: String(deliveryStatus),
                          label: formatStatusLabel(deliveryStatus),
                        }))}
                        className="w-48"
                      />
                    )}
                  </div>
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
