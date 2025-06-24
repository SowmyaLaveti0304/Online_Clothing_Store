import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Group, Table, Title } from "@mantine/core";
import { db } from "~/lib/prisma.server";
import { formatDate } from "~/utils/misc";

export async function loader() {
  const customers = await db.customer.findMany({});

  return json({ customers });
}

export default function CustomersIndex() {
  const { customers } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-8">
      <Group justify="space-between" align="center">
        <Title order={2}>Customers</Title>
      </Group>

      <Table withTableBorder highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>DOB</Table.Th>
            <Table.Th>Gender</Table.Th>
            <Table.Th>Address</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {customers.map((customer) => (
            <Table.Tr key={customer.id}>
              <Table.Td>
                {customer.firstName} {customer.lastName}
              </Table.Td>
              <Table.Td>{customer.email}</Table.Td>
              <Table.Td>{customer.phoneNo}</Table.Td>
              <Table.Td>{formatDate(new Date(customer.dob))}</Table.Td>
              <Table.Td>{customer.gender}</Table.Td>
              <Table.Td>{`${customer.street}, ${customer.city}, ${customer.state} ${customer.zipcode}`}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  );
}
