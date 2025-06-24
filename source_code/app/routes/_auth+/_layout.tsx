import type { LoaderFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";

import { validateUserRole } from "~/lib/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await validateUserRole(request, null);
  return null;
};

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[45%_55%]">
        {/* Left side - Fashion Image */}
        <div className="relative hidden bg-neutral-900 lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900/90 to-stone-900/90" />
          <img
            alt="Fashion Store"
            className="size-full object-cover"
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&auto=format&fit=crop"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
            <h1 className="font-serif text-4xl font-light tracking-wide">Clothing Store</h1>
            <p className="mt-4 text-center text-sm uppercase tracking-[0.2em]">
              Your Fashion Destination
            </p>
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex items-center justify-center p-4 sm:p-8 lg:p-12">
          <div className="w-full max-w-[440px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
