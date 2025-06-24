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
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useNavigate, useLoaderData } from "@remix-run/react";
import { ArrowLeft, Plus, Trash } from "lucide-react";
import { redirectWithSuccess } from "remix-toast";
import * as z from "zod";
import { db } from "~/lib/prisma.server";
import { ClothType, Color, Size, TargetAudience } from "~/utils/enums";
import { badRequest, notFound } from "~/utils/misc.server";
import type { inferErrors } from "~/utils/validation";
import * as React from "react";

const UpdateProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.string().url("Must be a valid URL"),
  type: z.nativeEnum(ClothType),
  categoryId: z.string().min(1, "Category is required"),
  "variants[]": z
    .array(
      z.object({
        id: z.string().optional(), // For existing variants
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
  fieldErrors?: inferErrors<typeof UpdateProductSchema>;
  success?: boolean;
};

type LoaderData = {
  product: {
    id: string;
    name: string;
    description: string;
    image: string;
    type: ClothType;
    categoryId: string;
    variants: Array<{
      id: string;
      size: Size;
      color: Color;
      price: number;
      quantity: number;
      guarantee: number;
      targetAudience: TargetAudience;
    }>;
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
};

export async function loader({ params }: LoaderFunctionArgs) {
  const product = await db.product.findUnique({
    where: { id: params.id },
    include: {
      variants: true,
    },
  });

  if (!product) {
    throw notFound("Product not found");
  }

  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  return json({ product, categories });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const rawData = Object.fromEntries(formData);

  // Process variants data
  const variantsData: any[] = [];
  const variantKeys = Object.keys(rawData).filter((key) => key.startsWith("variants["));

  const variantIndices = new Set(
    variantKeys.map((key) => key.match(/variants\[(\d+)\]/)?.[1]).filter(Boolean),
  );

  variantIndices.forEach((index) => {
    const variant = {
      id: formData.get(`variants[${index}].id`) || undefined,
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

  const result = UpdateProductSchema.safeParse(dataToValidate);

  if (!result.success) {
    const fieldErrors = result.error.issues.reduce((acc: any, issue) => {
      const key = issue.path[0];
      acc[key] = issue.message;
      return acc;
    }, {});

    return badRequest<ActionData>({ fieldErrors });
  }

  // Get existing variant IDs
  const existingVariants = await db.productVariant.findMany({
    where: { productId: params.id },
    select: { id: true },
  });

  const existingVariantIds = new Set(existingVariants.map((v) => v.id));

  // Separate new and existing variants
  const newVariants = result.data["variants[]"].filter((v) => !v.id || v.id.startsWith("new-"));
  const existingVariantsToUpdate = result.data["variants[]"].filter(
    (v) => v.id && !v.id.startsWith("new-"),
  );

  // Find variants to delete
  const variantsToDelete = [...existingVariantIds].filter(
    (id) => !existingVariantsToUpdate.find((v) => v.id === id),
  );

  await db.$transaction([
    // Delete removed variants
    ...variantsToDelete.map((id) =>
      db.productVariant.delete({
        where: { id },
      }),
    ),

    // Update existing variants
    ...existingVariantsToUpdate.map((variant) =>
      db.productVariant.update({
        where: { id: variant.id },
        data: {
          size: variant.size,
          color: variant.color,
          price: variant.price,
          quantity: variant.quantity,
          guarantee: variant.guarantee,
          targetAudience: variant.targetAudience,
        },
      }),
    ),

    // Create new variants
    db.product.update({
      where: { id: params.id },
      data: {
        name: result.data.name,
        description: result.data.description,
        image: result.data.image,
        type: result.data.type,
        categoryId: result.data.categoryId,
        variants: {
          create: newVariants.map((variant) => ({
            size: variant.size,
            color: variant.color,
            price: variant.price,
            quantity: variant.quantity,
            guarantee: variant.guarantee,
            targetAudience: variant.targetAudience,
          })),
        },
      },
    }),
  ]);

  return redirectWithSuccess("/admin/products", "Product updated successfully");
}

export default function EditProduct() {
  const { product, categories } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();
  const navigate = useNavigate();
  const isSubmitting = fetcher.state !== "idle";

  const [variants, setVariants] = React.useState(product.variants);

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        id: `new-${Date.now()}`, // Temporary ID for new variants
        size: Size.SMALL,
        color: Color.BLACK,
        price: 0,
        quantity: 0,
        guarantee: 6,
        targetAudience: TargetAudience.UNISEX,
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
            <Title order={2}>Edit Product</Title>
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
                  defaultValue={product.name}
                  error={fetcher.data?.fieldErrors?.name}
                  required
                />
                <Textarea
                  name="description"
                  label="Description"
                  defaultValue={product.description}
                  error={fetcher.data?.fieldErrors?.description}
                  required
                />
                <TextInput
                  name="image"
                  label="Image URL"
                  defaultValue={product.image}
                  error={fetcher.data?.fieldErrors?.image}
                  required
                />
                <Group grow>
                  <Select
                    name="type"
                    label="Material Type"
                    data={Object.values(ClothType)}
                    defaultValue={product.type}
                    error={fetcher.data?.fieldErrors?.type}
                    required
                  />
                  <Select
                    name="categoryId"
                    label="Category"
                    data={categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    }))}
                    defaultValue={product.categoryId}
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

                {variants.map((variant, index) => (
                  <Paper key={variant.id} withBorder p="md">
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

                      <input type="hidden" name={`variants[${index}].id`} value={variant.id} />

                      <Group grow>
                        <Select
                          name={`variants[${index}].size`}
                          label="Size"
                          data={Object.values(Size)}
                          defaultValue={variant.size}
                          required
                        />
                        <Select
                          name={`variants[${index}].color`}
                          label="Color"
                          data={Object.values(Color)}
                          defaultValue={variant.color}
                          required
                        />
                      </Group>

                      <Group grow>
                        <NumberInput
                          name={`variants[${index}].price`}
                          label="Price"
                          min={0}
                          defaultValue={variant.price}
                          required
                          decimalScale={2}
                          fixedDecimalScale
                        />
                        <NumberInput
                          name={`variants[${index}].quantity`}
                          label="Quantity"
                          min={0}
                          defaultValue={variant.quantity}
                          required
                        />
                      </Group>

                      <Group grow>
                        <NumberInput
                          name={`variants[${index}].guarantee`}
                          label="Guarantee (months)"
                          min={1}
                          defaultValue={variant.guarantee}
                          required
                        />
                        <Select
                          name={`variants[${index}].targetAudience`}
                          label="Target Audience"
                          data={Object.values(TargetAudience)}
                          defaultValue={variant.targetAudience}
                          required
                        />
                      </Group>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Group justify="flex-end" mt="xl">
                <Button type="submit" loading={isSubmitting}>
                  Update Product
                </Button>
              </Group>
            </Stack>
          </fetcher.Form>
        </Paper>
      </Stack>
    </Container>
  );
}
