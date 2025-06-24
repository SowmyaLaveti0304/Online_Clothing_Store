import { Button, Container, Group, Paper, Select, Stack, TextInput, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";
import * as z from "zod";
import { db } from "~/lib/prisma.server";
import { Gender, UserRole } from "~/utils/enums";
import { badRequest } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RegisterSchema } from "~/utils/zod.schema";

const EditEmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),

  street: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(5, "ZIP code must be at least 5 characters"),
  role: z.enum(Object.values(UserRole) as [string, ...string[]]).optional(),
  ssn: z.string().regex(/^\d{9}$/, "SSN must be 9 digits"),
  dob: z
    .string()
    .refine((date) => !Number.isNaN(Date.parse(date)), {
      message: "Invalid date format",
    })
    .transform((date) => new Date(date)),
  phoneNo: z.string().min(10, "Phone number must be at least 10 digits"),
  gender: z.nativeEnum(Gender),
});

type ActionData = {
  fieldErrors?: inferErrors<typeof EditEmployeeSchema>;
  success: boolean;
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;

  if (!id) {
    return redirect("/admin/employee");
  }

  const employee = await db.employee.findUnique({
    where: { id: params.id },
  });

  if (!employee) {
    return redirect("/admin/employee");
  }

  return json({ employee });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const employeeId = params.id;

  if (!employeeId) {
    return redirect("/admin/employee");
  }

  const { fields, fieldErrors } = await validateAction(request, EditEmployeeSchema);

  if (fieldErrors) {
    return json({ fieldErrors, fields });
  }

  const existingEmployeeWithEmail = await db.employee.findUnique({
    where: {
      email: fields.email,
      NOT: {
        id: employeeId,
      },
    },
  });

  if (existingEmployeeWithEmail) {
    return badRequest({
      fieldErrors: {
        email: "Email already exists",
      },
      success: false,
    });
  }

  await db.employee.update({
    where: { id: employeeId },
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      phoneNo: fields.phoneNo,
      dob: fields.dob,
      street: fields.street,
      city: fields.city,
      state: fields.state,
      zipcode: fields.zip,
      gender: fields.gender,
      role: UserRole.EMPLOYEE,
      ssn: fields.ssn ?? "",
    },
  });

  return redirectWithSuccess("/admin/employee", "Employee updated successfully");
}

export default function EditEmployee() {
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";
  const navigate = useNavigate();
  const { employee } = useLoaderData<typeof loader>();

  return (
    <Container size="xl" px={0}>
      <Stack gap="xl">
        <Group justify="space-between">
          <Group>
            <Button
              variant="subtle"
              onClick={() => navigate(-1)}
              leftSection={<ArrowLeft size={16} />}
            >
              Back
            </Button>
            <Title order={2}>New Employee</Title>
          </Group>
        </Group>

        <Paper withBorder radius="md" p="xl">
          <fetcher.Form method="post">
            <input type="hidden" name="id" value={employee.id} />
            <Stack gap="lg">
              <Group grow align="flex-start">
                <Stack gap="md">
                  <Title order={4}>Personal Information</Title>
                  <TextInput
                    name="firstName"
                    label="First Name"
                    placeholder="Enter first name"
                    error={fetcher.data?.fieldErrors?.firstName}
                    required
                    defaultValue={employee.firstName}
                  />
                  <TextInput
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter last name"
                    error={fetcher.data?.fieldErrors?.lastName}
                    required
                    defaultValue={employee.lastName}
                  />
                  <TextInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="employee@company.com"
                    error={fetcher.data?.fieldErrors?.email}
                    required
                    defaultValue={employee.email}
                  />
                  <TextInput
                    name="phoneNo"
                    label="Phone Number"
                    placeholder="(123) 456-7890"
                    error={fetcher.data?.fieldErrors?.phoneNo}
                    required
                    defaultValue={employee.phoneNo}
                  />
                  <Select
                    name="gender"
                    label="Gender"
                    placeholder="Select gender"
                    data={Object.values(Gender)}
                    error={fetcher.data?.fieldErrors?.gender}
                    required
                    defaultValue={employee.gender}
                  />
                </Stack>

                <Stack gap="md">
                  <Title order={4}>Security Details</Title>
                  <TextInput
                    name="ssn"
                    label="SSN"
                    maxLength={9}
                    placeholder="123456789"
                    error={fetcher.data?.fieldErrors?.ssn}
                    defaultValue={employee.ssn}
                    required
                  />
                  <DatePickerInput
                    name="dob"
                    label="Date of Birth"
                    placeholder="Select date"
                    error={fetcher.data?.fieldErrors?.dob}
                    required
                    clearable={false}
                    defaultValue={new Date(employee.dob)}
                  />
                </Stack>
              </Group>

              <Stack gap="md">
                <Title order={4}>Address Information</Title>
                <TextInput
                  name="street"
                  label="Street Address"
                  placeholder="1234 Main St"
                  error={fetcher.data?.fieldErrors?.street}
                  required
                  defaultValue={employee.street}
                />

                <Group grow>
                  <TextInput
                    name="city"
                    label="City"
                    placeholder="City"
                    error={fetcher.data?.fieldErrors?.city}
                    required
                    defaultValue={employee.city}
                  />
                  <TextInput
                    name="state"
                    label="State"
                    placeholder="State"
                    error={fetcher.data?.fieldErrors?.state}
                    required
                    defaultValue={employee.state}
                  />
                  <TextInput
                    name="zip"
                    label="ZIP Code"
                    placeholder="12345"
                    error={fetcher.data?.fieldErrors?.zip}
                    required
                    defaultValue={employee.zipcode}
                  />
                </Group>
              </Stack>

              <Group justify="flex-end" mt="xl">
                <Button type="submit" variant="filled" loading={isSubmitting} size="md">
                  Update Employee
                </Button>
              </Group>
            </Stack>
          </fetcher.Form>
        </Paper>
      </Stack>
    </Container>
  );
}
