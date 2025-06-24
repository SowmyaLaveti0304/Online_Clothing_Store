import { ActionIcon } from "@mantine/core";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";

import { cn } from "~/utils/misc";

function BackButton({ href }: { href: string }) {
	return (
		<ActionIcon color="dark" component={Link} to={href} variant="subtle">
			<ArrowLeft className="h-4 w-4" />
		</ActionIcon>
	);
}

function Layout({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex h-screen flex-col bg-gray-100", className)}>
			{children}
		</div>
	);
}

type PageHeaderProps = {
	action?: React.ReactNode;
	backButtonHref?: string;
} & (
	| {
			children: React.ReactNode;
			icon?: never;
			title?: never;
	  }
	| {
			children?: never;
			icon?: React.ReactNode;
			title: string;
	  }
);

function Header(props: PageHeaderProps): React.ReactElement {
	const { action, backButtonHref } = props;

	return (
		<div className="sticky top-0 z-10 flex min-h-[64px] items-center justify-between bg-white px-4 py-2 shadow-sm text-red-600">
			<div className="flex w-full items-center gap-1.5">
				<div
					className={cn(
						"flex flex-1 flex-row items-center gap-4",
						backButtonHref ? "pl-0" : "pl-1.5",
					)}
				>
					{backButtonHref ? <BackButton href={backButtonHref} /> : null}

					{props.children ?? (
						<div className="flex w-full items-center gap-2">
							{props.icon}

							<h1 className="flex max-w-[50%] truncate text-xl font-semibold">
								{props.title}
							</h1>
						</div>
					)}
				</div>
			</div>

			<div className="inline-flex gap-2">{action}</div>
		</div>
	);
}

function Content({ children }: { children: React.ReactNode }) {
	return <div className="flex-1 overflow-auto p-4 bg-white">{children}</div>;
}

export const Page = {
	Header,
	Layout,
	Content,
};
