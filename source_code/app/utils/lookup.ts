import type { BloodGroup } from "./constants";

export const BLOOD_GROUP_OPTIONS = [
	{ label: "A+", value: "A+" },
	{ label: "A-", value: "A-" },
	{ label: "B+", value: "B+" },
	{ label: "B-", value: "B-" },
	{ label: "AB+", value: "AB+" },
	{ label: "AB-", value: "AB-" },
	{ label: "O+", value: "O+" },
	{ label: "O-", value: "O-" },
] as const;

export type SelectOption<T = string> = {
	label: string;
	value: T;
};

export const getBloodGroupLabel = (value: BloodGroup) => {
	return (
		BLOOD_GROUP_OPTIONS.find((option) => option.value === value)?.label ?? value
	);
};
