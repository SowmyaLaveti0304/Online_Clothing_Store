import type { ReactNode } from "react";

type PageHeadingProps = {
	title: string;
	children?: ReactNode;
};

export function PageHeading({ title, children }: PageHeadingProps) {
	return (
		<div className="flex items-center justify-between">
			<h1 className="text-lg font-semibold text-gray-900">{title}</h1>
			{children}
		</div>
	);
}
