import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Button, Group, Table, Title } from "@mantine/core";
import { PencilIcon, PlusIcon } from "lucide-react";
import { db } from "~/lib/prisma.server";

export async function loader() {
  const categories = await db.category.findMany({});

  return json({ categories });
}

export default function CategoriesIndex() {
  const { categories } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-8">
      <Group justify="space-between" align="center">
        <Title order={2}>Categories</Title>
        <Button component={Link} to="new" leftSection={<PlusIcon size={16} />} variant="filled">
          Add Category
        </Button>
      </Group>

      <Table withTableBorder highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th style={{ width: 100 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {categories.map((category) => (
            <Table.Tr key={category.id}>
              <Table.Td>{category.name}</Table.Td>
              <Table.Td>
                <Button
                  component={Link}
                  to={`${category.id}/edit`}
                  variant="subtle"
                  size="sm"
                  p={0}
                >
                  <PencilIcon size={16} />
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
