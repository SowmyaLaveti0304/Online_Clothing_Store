import {
  Button,
  Container,
  Group,
  Paper,
  PasswordInput,
  Select,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useFetcher, useNavigate } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";
import * as z from "zod";
import { db } from "~/lib/prisma.server";
import { createHash } from "~/utils/encryption";
import { Gender, UserRole } from "~/utils/enums";
import { badRequest } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";
import { RegisterSchema } from "~/utils/zod.schema";

const CreateEmployeeSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
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
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password and confirm password must match",
        path: ["confirmPassword", "password"],
      });
    }
    return true;
  });

type ActionData = {
  fieldErrors?: inferErrors<typeof CreateEmployeeSchema>;
  success: boolean;
};

export async function action({ request }: ActionFunctionArgs) {
  const { fields, fieldErrors } = await validateAction(request, CreateEmployeeSchema);

  if (fieldErrors) {
    return json({ fieldErrors, fields });
  }

  const existingEmployeeWithEmail = await db.employee.findUnique({
    where: {
      email: fields.email,
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

  await db.employee.create({
    data: {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      password: await createHash(fields.password),
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

  return redirectWithSuccess("/admin/employee", "Employee created successfully");
}

export default function NewEmployee() {
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";
  const navigate = useNavigate();

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
                  />
                  <TextInput
                    name="lastName"
                    label="Last Name"
                    placeholder="Enter last name"
                    error={fetcher.data?.fieldErrors?.lastName}
                    required
                  />
                  <TextInput
                    name="email"
                    label="Email"
                    type="email"
                    placeholder="employee@company.com"
                    error={fetcher.data?.fieldErrors?.email}
                    required
                  />
                  <TextInput
                    name="phoneNo"
                    label="Phone Number"
                    placeholder="(123) 456-7890"
                    error={fetcher.data?.fieldErrors?.phoneNo}
                    required
                  />
                  <Select
                    name="gender"
                    label="Gender"
                    placeholder="Select gender"
                    data={Object.values(Gender)}
                    error={fetcher.data?.fieldErrors?.gender}
                    required
                  />
                </Stack>

                <Stack gap="md">
                  <Title order={4}>Security Details</Title>
                  <PasswordInput
                    name="password"
                    label="Password"
                    placeholder="Enter password"
                    error={fetcher.data?.fieldErrors?.password}
                    required
                  />
                  <PasswordInput
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm password"
                    error={fetcher.data?.fieldErrors?.confirmPassword}
                    required
                  />
                  <TextInput
                    name="ssn"
                    label="SSN"
                    maxLength={9}
                    placeholder="123456789"
                    error={fetcher.data?.fieldErrors?.ssn}
                    required
                  />
                  <DatePickerInput
                    name="dob"
                    label="Date of Birth"
                    placeholder="Select date"
                    error={fetcher.data?.fieldErrors?.dob}
                    required
                    clearable={false}
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
                />

                <Group grow>
                  <TextInput
                    name="city"
                    label="City"
                    placeholder="City"
                    error={fetcher.data?.fieldErrors?.city}
                    required
                  />
                  <TextInput
                    name="state"
                    label="State"
                    placeholder="State"
                    error={fetcher.data?.fieldErrors?.state}
                    required
                  />
                  <TextInput
                    name="zip"
                    label="ZIP Code"
                    placeholder="12345"
                    error={fetcher.data?.fieldErrors?.zip}
                    required
                  />
                </Group>
              </Stack>

              <Group justify="flex-end" mt="xl">
                <Button type="submit" variant="filled" loading={isSubmitting} size="md">
                  Create Employee
                </Button>
              </Group>
            </Stack>
          </fetcher.Form>
        </Paper>
      </Stack>
    </Container>
  );
}
