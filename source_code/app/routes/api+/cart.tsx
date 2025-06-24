import { json, redirect, type ActionFunctionArgs } from "@remix-run/node";
import { db } from "~/lib/prisma.server";
import { requireUser } from "~/lib/session.server";

export async function action({ request }: ActionFunctionArgs) {
  try {
    const user = await requireUser(request);
    const formData = await request.formData();
    const intent = formData.get("intent")?.toString();

    switch (intent) {
      case "add-item": {
        const variantId = formData.get("variantId")?.toString();
        const quantity = Number.parseInt(formData.get("quantity")?.toString() || "1");

        if (!variantId) {
          return json({ error: "Invalid variant ID" }, { status: 400 });
        }

        const existingItem = await db.cartItem.findFirst({
          where: {
            customerId: user.id,
            variantId,
          },
        });

        if (existingItem) {
          await db.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity },
          });
        } else {
          await db.cartItem.create({
            data: {
              quantity,
              customerId: user.id,
              variantId,
            },
          });
        }

        break;
      }

      case "remove-item": {
        const itemId = formData.get("itemId")?.toString();
        if (!itemId) {
          return json({ error: "Invalid item ID" }, { status: 400 });
        }

        await db.cartItem.delete({
          where: { id: itemId },
        });
        break;
      }

      case "clear-cart": {
        await db.cartItem.deleteMany({
          where: { customerId: user.id },
        });
        break;
      }

      default:
        return json({ error: "Invalid intent" }, { status: 400 });
    }

    const items = await db.cartItem.findMany({
      where: { customerId: user.id },
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return json({ items });
  } catch (error) {
    if (error instanceof Response && error.status === 401) {
      const url = new URL(request.url);
      return redirect(`/login?redirectTo=${encodeURIComponent(url.pathname)}`);
    }
    console.error("Cart operation failed:", error);
    return json({ error: "Operation failed" }, { status: 500 });
  }
}
