import {
  ActionIcon,
  Button,
  Card,
  Container,
  Grid,
  Group,
  Image,
  Stack,
  Text,
  Title,
  Badge,
  Modal,
  Table,
  Tooltip,
} from "@mantine/core";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Edit, Eye, Plus } from "lucide-react";
import { requireUser } from "~/lib/session.server";
import { db } from "~/lib/prisma.server";
import type { ClothType } from "~/utils/enums";
import { useDisclosure } from "@mantine/hooks";
import * as React from "react";

type LoaderData = {
  products: Array<{
    id: string;
    name: string;
    description: string;
    image: string;
    type: ClothType;
    slug: string;
    category: {
      name: string;
    } | null;
    variants: Array<{
      price: number;
      quantity: number;
      size: string;
      color: string;
      targetAudience: string;
      guarantee: number;
    }>;
  }>;
};

const CARD_HEIGHT = 420; // Total card height
const IMAGE_HEIGHT = 200; // Fixed image height

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request);

  const products = await db.product.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      variants: {
        select: {
          price: true,
          quantity: true,
          size: true,
          color: true,
          targetAudience: true,
          guarantee: true,
        },
      },
    },
  });

  return json({ products });
}

export default function ProductsIndex() {
  const { products } = useLoaderData<LoaderData>();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedProduct, setSelectedProduct] = React.useState<LoaderData["products"][0] | null>(
    null,
  );

  const getLowestPrice = (variants: LoaderData["products"][0]["variants"]) => {
    if (variants.length === 0) {
      return 0;
    }
    return Math.min(...variants.map((v) => v.price));
  };

  const getTotalQuantity = (variants: LoaderData["products"][0]["variants"]) => {
    return variants.reduce((acc, curr) => acc + curr.quantity, 0);
  };

  const handleViewVariants = (product: LoaderData["products"][0]) => {
    setSelectedProduct(product);
    open();
  };

  return (
    <Container size="xl" px={0}>
      <Stack gap="xl">
        <Group justify="space-between" align="center">
          <Title order={2}>Products</Title>
          <Button component={Link} to="new" leftSection={<Plus size={16} />} variant="filled">
            Add Product
          </Button>
        </Group>

        <Grid>
          {products.map((product) => (
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={product.id}>
              <Card
                withBorder
                shadow="sm"
                padding="lg"
                radius="md"
                h={CARD_HEIGHT}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Card.Section style={{ height: IMAGE_HEIGHT }}>
                  <Image
                    src={product.image}
                    height="100%"
                    alt={product.name}
                    fallbackSrc="https://placehold.co/400x200?text=No+Image"
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </Card.Section>

                <Stack
                  gap="md"
                  mt="md"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    justifyContent: "space-between",
                  }}
                >
                  <Stack gap="xs" style={{ minHeight: 0 }}>
                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                      <Stack gap={2} style={{ minWidth: 0 }}>
                        <Text fw={500} size="lg" lineClamp={1}>
                          {product.name}
                        </Text>
                        <Text size="sm" c="dimmed" lineClamp={1}>
                          {product.category?.name || "Uncategorized"}
                        </Text>
                      </Stack>
                      <Group gap="xs" ml="auto">
                        <Tooltip label="View Variants">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => handleViewVariants(product)}
                          >
                            <Eye size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit Product">
                          <ActionIcon
                            component={Link}
                            to={`${product.id}/edit`}
                            variant="subtle"
                            size="sm"
                          >
                            <Edit size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>

                    <Text size="sm" c="dimmed" lineClamp={2} style={{ flex: 1 }}>
                      {product.description}
                    </Text>

                    <Group gap="xs">
                      <Badge variant="light" color="dark">
                        {product.type}
                      </Badge>
                      <Badge variant="outline" color="gray">
                        Stock: {getTotalQuantity(product.variants)}
                      </Badge>
                    </Group>
                  </Stack>

                  <Group justify="space-between" align="center" wrap="nowrap">
                    <Text size="xl" fw={700} c="dark.9">
                      ${getLowestPrice(product.variants).toFixed(2)}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>

        <Modal
          opened={opened}
          onClose={close}
          size="lg"
          title={
            <Text fw={600} size="lg">
              {selectedProduct?.name} Variants
            </Text>
          }
        >
          {selectedProduct && (
            <Table withTableBorder highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Size</Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Price</Table.Th>
                  <Table.Th>Stock</Table.Th>
                  <Table.Th>Target Audience</Table.Th>
                  <Table.Th>Guarantee (months)</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {selectedProduct.variants.map((variant, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  <Table.Tr key={index}>
                    <Table.Td>{variant.size}</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Badge color={variant.color.toLowerCase()} variant="dot">
                          {variant.color}
                        </Badge>
                      </Group>
                    </Table.Td>
                    <Table.Td>${variant.price.toFixed(2)}</Table.Td>
                    <Table.Td>{variant.quantity}</Table.Td>
                    <Table.Td>{variant.targetAudience}</Table.Td>
                    <Table.Td>{variant.guarantee}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
