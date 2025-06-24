import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { requireUser } from "~/lib/session.server";
import { db } from "~/lib/prisma.server";
import { OrderType } from "@prisma/client";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);

  const payments = await db.payment.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      order: {
        select: {
          id: true,
          type: true,
          status: true,
          productVariants: {
            select: {
              product: {
                select: {
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return json({ payments });
}

export default function Payments() {
  const { payments } = useLoaderData<typeof loader>();

  function generatePaymentNumber(paymentId: string) {
    const shortId = paymentId.slice(-6).toUpperCase();
    return `PAY-${shortId}`;
  }

  function generateOrderNumber(orderId: string) {
    const shortId = orderId.slice(-6).toUpperCase();
    return `ORD-${shortId}`;
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Payment History</h1>

      <div className="space-y-8">
        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No payments found</p>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      Payment made on {format(new Date(payment.createdAt), "PPP")}
                    </p>
                    <p className="text-sm text-gray-500">
                      Payment ID: {generatePaymentNumber(payment.id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Order ID: {generateOrderNumber(payment.order.id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {payment.paymentMethod.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex -space-x-4">
                      {payment.order.productVariants.map((variant, index) => (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                          key={index}
                          className="h-12 w-12 rounded-full border-2 border-white overflow-hidden"
                        >
                          <img
                            src={variant.product.image}
                            alt={variant.product.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">
                        {payment.order.productVariants
                          .map((variant) => variant.product.name)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-sm">
                  <div>
                    <p className="text-gray-500">Order Type: {payment.order.type}</p>
                    {payment.order.type === OrderType.DELIVERY && payment.address && (
                      <p className="text-gray-500">Delivery Address: {payment.address}</p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        payment.order.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : payment.order.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {payment.order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
