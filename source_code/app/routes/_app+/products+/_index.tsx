import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { db } from "~/lib/prisma.server";

export async function loader() {
  const products = await db.product.findMany({
    include: {
      category: true,
    },
  });

  return json({ products });
}

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <div className="bg-neutral-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-neutral-900 text-center mb-3">Our Collection</h1>
          <p className="text-neutral-600 text-center max-w-2xl mx-auto text-lg">
            Discover our latest collection of premium clothing designed for style and comfort
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link
              to={`/products/${product.id}/view`}
              key={product.id}
              className="group bg-white rounded-xl border border-neutral-200/70 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <img
                  src={product.image || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Category Tag */}
                <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium text-neutral-700 shadow-sm">
                  {product.category?.name}
                </span>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2 group-hover:text-neutral-700 transition-colors">
                    {product.name}
                  </h2>
                  <p className="text-neutral-600 text-sm line-clamp-2">{product.description}</p>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to={`/products/${product.id}/view`}
                    className="inline-flex items-center text-neutral-900 font-medium group-hover:translate-x-1 transition-transform duration-200"
                  >
                    View Details
                    <svg
                      className="w-5 h-5 ml-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-neutral-900 mb-2">No products found</h3>
            <p className="text-neutral-600">Check back later for new arrivals.</p>
          </div>
        )}
      </div>
    </div>
  );
}
