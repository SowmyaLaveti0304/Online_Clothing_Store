import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { Button, Group, Table, Title } from "@mantine/core";
import { PencilIcon, PlusIcon } from "lucide-react";
import { db } from "~/lib/prisma.server";
import { formatDate } from "~/utils/misc";

export async function loader() {
  const employees = await db.employee.findMany({});

  return json({ employees });
}

export default function EmployeesIndex() {
  const { employees } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col gap-8">
      <Group justify="space-between" align="center">
        <Title order={2}>Employees</Title>
        <Button component={Link} to="new" leftSection={<PlusIcon size={16} />} variant="filled">
          Add Employee
        </Button>
      </Group>

      <Table withTableBorder highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Phone</Table.Th>
            <Table.Th>SSN</Table.Th>
            <Table.Th>DOB</Table.Th>
            <Table.Th>Gender</Table.Th>
            <Table.Th>Address</Table.Th>
            <Table.Th style={{ width: 100 }}>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {employees.map((employee) => (
            <Table.Tr key={employee.id}>
              <Table.Td>
                {employee.firstName} {employee.lastName}
              </Table.Td>
              <Table.Td>{employee.email}</Table.Td>
              <Table.Td>{employee.phoneNo}</Table.Td>
              <Table.Td>{employee.ssn}</Table.Td>
              <Table.Td>{formatDate(new Date(employee.dob))}</Table.Td>
              <Table.Td>{employee.gender}</Table.Td>
              <Table.Td>{`${employee.street}, ${employee.city}, ${employee.state} ${employee.zipcode}`}</Table.Td>
              <Table.Td>
                <Button
                  component={Link}
                  to={`${employee.id}/edit`}
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
