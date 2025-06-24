import { json, redirect, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/prisma.server";
import { useState } from "react";
import { toast } from "sonner";
import type { Color, Size } from "@prisma/client";
import { useCart } from "~/context/CartContext";

export async function loader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) {
    return redirect("/products");
  }

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true,
    },
  });

  if (!product) {
    throw new Response("Product not found", { status: 404 });
  }

  return json({ product });
}

export default function ProductView() {
  const { product } = useLoaderData<typeof loader>();
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const { addItemToCart } = useCart();

  // Find the currently selected variant
  const currentVariant = product.variants.find((v) => v.id === selectedVariant);

  const formatVariantName = (variant: { size: Size; color: Color }) => {
    return `${variant.size} - ${variant.color.replace(/_/g, " ")}`;
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error("Please select a variant");
      return;
    }
    if (!currentVariant) {
      toast.error("Selected variant not found");
      return;
    }
    if (currentVariant.quantity < quantity) {
      toast.error("Not enough stock available");
      return;
    }

    try {
      // Add product data to the variant
      const variantWithProduct = {
        ...currentVariant,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          image: product.image,
          type: product.type,
          categoryId: product.categoryId,
        },
      };
      addItemToCart(variantWithProduct, quantity);
    } catch (error) {
      toast.error("Failed to add item to cart");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4">
        <Link
          to="/products"
          className="inline-flex items-center mb-6 text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Products
        </Link>

        <div className="bg-white rounded-xl border border-neutral-200/70 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image Gallery */}
            <div className="p-6 lg:p-8">
              <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100">
                <img
                  src={product.image || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="p-6 lg:p-8">
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-3xl font-bold text-neutral-900">{product.name}</h1>
                  <span className="px-3 py-1 bg-neutral-100 rounded-full text-sm font-medium text-neutral-600">
                    {product.category?.name}
                  </span>
                </div>
                <p className="text-neutral-600 text-lg mb-6">{product.description}</p>

                {currentVariant && (
                  <div className="flex items-baseline gap-2 mb-8">
                    <div className="text-2xl font-bold text-neutral-900">
                      ${(currentVariant.price * quantity).toFixed(2)}
                    </div>
                    {quantity > 1 && (
                      <span className="text-sm text-neutral-600">
                        (${currentVariant.price.toFixed(2)} each)
                      </span>
                    )}
                  </div>
                )}

                {/* Variant Selection */}
                {product.variants.length > 0 && (
                  <div className="mb-6">
                    <span
                      id="variant-label"
                      className="block text-sm font-medium text-neutral-700 mb-2"
                    >
                      Select Size & Color
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="variant-label"
                      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                    >
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          type="button"
                          onClick={() => setSelectedVariant(variant.id)}
                          className={`
                            px-4 py-3 text-sm font-medium rounded-lg border
                            ${variant.quantity === 0 ? "opacity-50 cursor-not-allowed" : ""}
                            ${
                              selectedVariant === variant.id
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                            }
                          `}
                          disabled={variant.quantity === 0}
                        >
                          <span>{formatVariantName(variant)}</span>
                          {variant.quantity === 0 && (
                            <span className="block text-xs mt-1">Out of Stock</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-8">
                  <span
                    id="quantity-label"
                    className="block text-sm font-medium text-neutral-700 mb-2"
                  >
                    Quantity
                  </span>
                  <fieldset className="flex items-center gap-2" aria-labelledby="quantity-label">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 rounded-md border border-neutral-200 hover:border-neutral-300"
                      aria-label="Decrease quantity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 rounded-md border border-neutral-200 hover:border-neutral-300"
                      aria-label="Increase quantity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                  </fieldset>
                </div>

                {/* Add to Cart Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-4 bg-neutral-900 text-white font-medium rounded-lg hover:bg-neutral-800 transition-colors duration-200"
                  disabled={!currentVariant || currentVariant.quantity === 0}
                >
                  {!currentVariant
                    ? "Select a Variant"
                    : currentVariant.quantity === 0
                      ? "Out of Stock"
                      : "Add to Cart"}
                </button>

                {/* Additional Information */}
                <div className="mt-8 pt-8 border-t border-neutral-200">
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Product Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <svg
                        className="w-6 h-6 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <div>
                        <h4 className="font-medium text-neutral-900">Material</h4>
                        <p className="text-neutral-600">{product.type}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <svg
                        className="w-6 h-6 text-neutral-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <div>
                        <h4 className="font-medium text-neutral-900">Guarantee</h4>
                        <p className="text-neutral-600">
                          {currentVariant
                            ? `${currentVariant.guarantee} months warranty`
                            : "Select a variant"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
