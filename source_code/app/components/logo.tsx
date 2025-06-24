export default function Logo() {
	return (
		<div className="grid place-items-center rounded-lg bg-black p-1.5">
			<div className="grid place-items-center rounded-full bg-yellow-300 p-1">
				{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
				<svg
					className="size-3.5"
					fill="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						clipRule="evenodd"
						d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
						fillRule="evenodd"
					/>
				</svg>
			</div>
		</div>
	);
}
