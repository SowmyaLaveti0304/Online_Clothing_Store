import type { LoaderFunctionArgs } from "@remix-run/node";

import { validateUserRole } from "~/lib/session.server";

export const loader = ({ request }: LoaderFunctionArgs) => {
	return validateUserRole(request, null);
};
