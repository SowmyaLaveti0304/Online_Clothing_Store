import { Link } from "@remix-run/react";
import { CheckCircle, ShoppingBag } from "lucide-react";

export default function RegistrationPending() {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-center">
          <div className="rounded-full bg-neutral-100 p-3">
            <ShoppingBag className="size-8 text-neutral-800" />
          </div>
        </div>
        <h2 className="mt-6 text-center font-serif text-3xl font-light tracking-wide text-neutral-900">
          Registration Pending
        </h2>
        <p className="mt-2 text-center text-sm uppercase tracking-wider text-neutral-600">
          Awaiting Admin Approval
        </p>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center justify-center rounded-xl bg-neutral-50 p-6 text-center">
          <div className="mb-4 rounded-full bg-neutral-100 p-3">
            <CheckCircle className="size-8 text-neutral-800" />
          </div>
          <p className="text-sm text-neutral-600">
            Your registration request has been submitted and is pending admin approval. You will
            receive an email once your account has been approved.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-700"
          >
            Return to Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-neutral-500">
        <p>© 2024 Clothing Store. All rights reserved.</p>
      </div>
    </div>
  );
}
