import {
  Button,
  Container,
  Group,
  Paper,
  Stack,
  TextInput,
  Title,
  Select,
  Textarea,
  NumberInput,
  Divider,
  ActionIcon,
  Text,
} from "@mantine/core";
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData } from "@remix-run/react";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";
import * as z from "zod";
import { db } from "~/lib/prisma.server";
import { ClothType, Color, Size, TargetAudience } from "~/utils/enums";
import { badRequest } from "~/utils/misc.server";
import type { inferErrors } from "~/utils/validation";
import * as React from "react";

const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Must be a valid URL"),
  type: z.nativeEnum(ClothType),
  categoryId: z.string().min(1, "Category is required"),
  "variants[]": z
    .array(
      z.object({
        size: z.nativeEnum(Size),
        color: z.nativeEnum(Color),
        price: z.coerce.number().min(0, "Price must be greater than 0"),
        quantity: z.coerce.number().min(0, "Quantity must be greater than 0"),
        guarantee: z.coerce.number().min(1, "Guarantee must be at least 1 month").default(1),
        targetAudience: z.nativeEnum(TargetAudience),
      }),
    )
    .min(1, "At least one variant is required"),
});

type ActionData = {
  fieldErrors?: inferErrors<typeof CreateProductSchema>;
  success?: boolean;
};

type LoaderData = {
  categories: Array<{
    id: string;
    name: string;
  }>;
};

export async function loader() {
  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return json({ categories });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Process variants data
  const variantsData: any[] = [];
  const variantKeys = Object.keys(rawData).filter((key) => key.startsWith("variants["));

  // Group variant data by index
  const variantIndices = new Set(
    variantKeys.map((key) => key.match(/variants\[(\d+)\]/)?.[1]).filter(Boolean),
  );

  variantIndices.forEach((index) => {
    const variant = {
      size: formData.get(`variants[${index}].size`),
      color: formData.get(`variants[${index}].color`),
      price: formData.get(`variants[${index}].price`),
      quantity: formData.get(`variants[${index}].quantity`),
      guarantee: formData.get(`variants[${index}].guarantee`) || "1",
      targetAudience: formData.get(`variants[${index}].targetAudience`),
    };
    variantsData.push(variant);
  });

  const dataToValidate = {
    name: formData.get("name"),
    description: formData.get("description"),
    image: formData.get("image"),
    type: formData.get("type"),
    categoryId: formData.get("categoryId"),
    "variants[]": variantsData,
  };

  const result = CreateProductSchema.safeParse(dataToValidate);

  if (!result.success) {
    const fieldErrors = result.error.issues.reduce((acc: any, issue) => {
      const key = issue.path[0];
      acc[key] = issue.message;
      return acc;
    }, {});

    return badRequest<ActionData>({ fieldErrors });
  }

  await db.product.create({
    data: {
      name: result.data.name,
      description: result.data.description,
      image: result.data.image,
      type: result.data.type,
      categoryId: result.data.categoryId,
      variants: {
        create: result.data["variants[]"].map((variant) => ({
          size: variant.size,
          color: variant.color,
          price: variant.price,
          quantity: variant.quantity,
          guarantee: variant.guarantee,
          targetAudience: variant.targetAudience,
        })),
      },
    },
  });

  return redirectWithSuccess("/admin/products", "Product created successfully");
}

export default function NewProduct() {
  const { categories } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state !== "idle";

  const [variants, setVariants] = React.useState([
    {
      size: "",
      color: "",
      price: "",
      quantity: "",
      guarantee: "6",
      targetAudience: "",
    },
  ]);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        size: "",
        color: "",
        price: "",
        quantity: "",
        guarantee: "6",
        targetAudience: "",
      },
    ]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

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
            <Title order={2}>New Product</Title>
          </Group>
        </Group>

        <Paper withBorder radius="md" p="xl">
          <fetcher.Form method="post">
            <Stack gap="lg">
              <Stack gap="md">
                <Title order={4}>Product Information</Title>
                <TextInput
                  name="name"
                  label="Name"
                  placeholder="Product name"
                  error={fetcher.data?.fieldErrors?.name}
                  required
                />
                <Textarea
                  name="description"
                  label="Description"
                  placeholder="Product description"
                  error={fetcher.data?.fieldErrors?.description}
                  required
                />
                <TextInput
                  name="image"
                  label="Image URL"
                  placeholder="https://example.com/image.jpg"
                  error={fetcher.data?.fieldErrors?.image}
                  required
                />
                <Group grow>
                  <Select
                    name="type"
                    label="Material Type"
                    placeholder="Select material"
                    data={Object.values(ClothType)}
                    error={fetcher.data?.fieldErrors?.type}
                    required
                  />
                  <Select
                    name="categoryId"
                    label="Category"
                    placeholder="Select category"
                    data={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                    error={fetcher.data?.fieldErrors?.categoryId}
                    required
                  />
                </Group>
              </Stack>

              <Divider />

              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={4}>Product Variants</Title>
                  <Button
                    size="sm"
                    variant="light"
                    leftSection={<Plus size={16} />}
                    onClick={addVariant}
                  >
                    Add Variant
                  </Button>
                </Group>

                {variants.map((_, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <Paper key={index} withBorder p="md">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={500}>Variant {index + 1}</Text>
                        {variants.length > 1 && (
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => removeVariant(index)}
                          >
                            <Trash size={16} />
                          </ActionIcon>
                        )}
                      </Group>

                      <Group grow>
                        <Select
                          name={`variants[${index}].size`}
                          label="Size"
                          placeholder="Select size"
                          data={Object.values(Size)}
                          required
                        />
                        <Select
                          name={`variants[${index}].color`}
                          label="Color"
                          placeholder="Select color"
                          data={Object.values(Color)}
                          required
                        />
                      </Group>

                      <Group grow>
                        <NumberInput
                          name={`variants[${index}].price`}
                          label="Price"
                          placeholder="0.00"
                          min={0}
                          required
                          decimalScale={2}
                          fixedDecimalScale
                        />
                        <NumberInput
                          name={`variants[${index}].quantity`}
                          label="Quantity"
                          placeholder="0"
                          min={0}
                          required
                        />
                      </Group>

                      <Group grow>
                        <NumberInput
                          name={`variants[${index}].guarantee`}
                          label="Guarantee (months)"
                          placeholder="6"
                          min={0}
                          defaultValue={6}
                          required
                        />
                        <Select
                          name={`variants[${index}].targetAudience`}
                          label="Target Audience"
                          placeholder="Select audience"
                          data={Object.values(TargetAudience)}
                          required
                        />
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Group justify="flex-end" mt="xl">
                <Button type="submit" loading={isSubmitting}>
                  Create Product
                </Button>
              </Group>
            </Stack>
          </fetcher.Form>
        </Paper>
      </Stack>
    </Container>
  );
}
