import { Button, Container, Group, Paper, Stack, TextInput, Title } from "@mantine/core";
import { type ActionFunctionArgs, json } from "@remix-run/node";
import { useFetcher, useNavigate } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";
import * as z from "zod";
import { db } from "~/lib/prisma.server";
import { badRequest } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";

const CreateCategorySchema = z.object({
  name: z.string().min(1, "First name is required"),
});

type ActionData = {
  fieldErrors?: inferErrors<typeof CreateCategorySchema>;
  success: boolean;
};

export async function action({ request }: ActionFunctionArgs) {
  const { fields, fieldErrors } = await validateAction(request, CreateCategorySchema);

  if (fieldErrors) {
    return json({ fieldErrors, fields });
  }

  const existingCategoryWithName = await db.category.findUnique({
    where: {
      name: fields.name,
    },
  });

  if (existingCategoryWithName) {
    return badRequest({
      fieldErrors: {
        name: "Email already exists",
      },
      success: false,
    });
  }

  await db.category.create({
    data: {
      name: fields.name,
    },
  });

  return redirectWithSuccess("/admin/categories", "Category created successfully");
}

export default function NewCategory() {
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";
  const navigate = useNavigate();

  return (
    <Container size="xl" px={0}>
      <Stack gap="xl">
        <Group justify="flex-start" align="center">
          <Button
            variant="subtle"
            onClick={() => navigate(-1)}
            leftSection={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          <Title order={2}>New Category</Title>
        </Group>

        <Paper withBorder radius="md" p="xl">
          <fetcher.Form method="post">
            <Stack gap="md">
              <TextInput
                name="name"
                label="Name"
                placeholder="Enter category name"
                required
                error={fetcher.data?.fieldErrors?.name}
                style={{ maxWidth: 400 }}
                w="100%"
              />

              <Group justify="flex-start" mt="md">
                <Button type="submit" variant="filled" loading={isSubmitting} size="md">
                  Create Category
                </Button>
              </Group>
            </Stack>
          </fetcher.Form>
        </Paper>
      </Stack>
    </Container>
  );
}
