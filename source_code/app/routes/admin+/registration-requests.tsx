import { type ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Clock, MailCheck, MapPin, Phone, User, X } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";

import { db } from "~/lib/prisma.server";
import { EmployeeRegistrationRequestStatus, UserRole } from "~/utils/enums";

export async function loader() {
  const employeeRequests = await db.employeeRegistrationRequest.findMany({
    where: {
      status: EmployeeRegistrationRequestStatus.PENDING,
    },
  });

  return json({ employeeRequests });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const requestId = formData.get("requestId") as string;
  const action = formData.get("action") as "APPROVED" | "REJECTED";

  const registrationRequest = await db.employeeRegistrationRequest.findUnique({
    where: { id: requestId },
  });

  if (!registrationRequest) {
    return json({ success: false, error: "Registration request not found" }, { status: 404 });
  }

  if (action === "APPROVED") {
    await db.employee.create({
      data: {
        firstName: registrationRequest.firstName,
        lastName: registrationRequest.lastName,
        email: registrationRequest.email,
        password: registrationRequest.password,
        phoneNo: registrationRequest.phoneNo,
        dob: registrationRequest.dob,
        street: registrationRequest.street,
        city: registrationRequest.city,
        state: registrationRequest.state,
        zipcode: registrationRequest.zipcode,
        gender: registrationRequest.gender,
        ssn: registrationRequest.ssn,
        role: UserRole.EMPLOYEE,
      },
    });

    await db.employeeRegistrationRequest.delete({
      where: { id: requestId },
    });

    return redirectWithSuccess("/admin/registration-requests", "Employee approved successfully");
  }

  await db.employeeRegistrationRequest.delete({
    where: { id: requestId },
  });

  return redirectWithSuccess("/admin/registration-requests", "Employee rejected successfully");
}

export default function RegistrationRequests() {
  const { employeeRequests } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900">Employee Registration Requests</h2>
        <p className="mt-1 text-sm text-gray-500">
          Review and manage employee registration applications
        </p>
      </div>

      {employeeRequests.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
          <div className="mx-auto size-12 rounded-full bg-gray-50 p-3">
            <MailCheck className="size-6 text-gray-400" />
          </div>
          <h3 className="mt-2 font-medium text-gray-900">No pending requests</h3>
          <p className="mt-1 text-sm text-gray-500">No employee registration requests to review.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {employeeRequests.map((request) => (
            <div
              key={request.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-gray-100">
                      <User className="size-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{request.email}</p>
                    </div>
                  </div>
                  <div className="flex size-6 items-center justify-center rounded-full bg-yellow-100">
                    <Clock className="size-3 text-yellow-600" />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="size-4" />
                    {request.phoneNo}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="size-4 shrink-0" />
                    <span>
                      {request.street}, {request.city}, {request.state} {request.zipcode}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <Form method="post" className="flex-1">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="APPROVED" />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                    >
                      Approve
                    </button>
                  </Form>
                  <Form method="post" className="flex-1">
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="action" value="REJECTED" />
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                    >
                      Reject
                    </button>
                  </Form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
