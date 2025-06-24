import { Button, Container, Group, Paper, Stack, TextInput, Title } from "@mantine/core";
import { type ActionFunctionArgs, type LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";
import * as z from "zod";
import { db } from "~/lib/prisma.server";
import { badRequest } from "~/utils/misc.server";
import { type inferErrors, validateAction } from "~/utils/validation";

const EditCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "First name is required"),
});

type ActionData = {
  fieldErrors?: inferErrors<typeof EditCategorySchema>;
  success: boolean;
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id;

  if (!id) {
    return redirect("/admin/categories");
  }

  const category = await db.category.findUnique({
    where: {
      id,
    },
  });

  if (!category) {
    return redirect("/admin/categories");
  }

  return json({ category });
};

export async function action({ request, params }: ActionFunctionArgs) {
  const { fields, fieldErrors } = await validateAction(request, EditCategorySchema);

  if (fieldErrors) {
    return json({ fieldErrors, fields });
  }

  const existingCategoryWithName = await db.category.findUnique({
    where: {
      name: fields.name,
      NOT: {
        id: params.id,
      },
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

  await db.category.update({
    where: {
      id: params.id,
    },
    data: {
      name: fields.name,
    },
  });

  return redirectWithSuccess("/admin/categories", "Category updated successfully");
}

export default function EditCategory() {
  const fetcher = useFetcher<ActionData>();
  const isSubmitting = fetcher.state !== "idle";
  const navigate = useNavigate();
  const { category } = useLoaderData<typeof loader>();

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
          <Title order={2}>Update Category</Title>
        </Group>

        <Paper withBorder radius="md" p="xl">
          <fetcher.Form method="post">
            <input type="hidden" name="id" value={category.id} />
            <Stack gap="md">
              <TextInput
                name="name"
                label="Name"
                placeholder="Enter category name"
                required
                error={fetcher.data?.fieldErrors?.name}
                defaultValue={category.name}
                style={{ maxWidth: 400 }}
                w="100%"
              />

              <Group justify="flex-start" mt="md">
                <Button type="submit" variant="filled" loading={isSubmitting} size="md">
                  Update Category
                </Button>
              </Group>
            </Stack>
          </fetcher.Form>
        </Paper>
      </Stack>
    </Container>
  );
}
