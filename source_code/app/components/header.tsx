import type { ReactNode } from "react";
import { PageHeading } from "./page-heading";

type HeaderProps = {
	title: string;
	children?: ReactNode;
};

export function Header({ title, children }: HeaderProps) {
	return (
		<header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-lg sm:px-6">
			<div className="flex h-16 items-center justify-between">
				<PageHeading title={title} />
				{children}
			</div>
		</header>
	);
}
