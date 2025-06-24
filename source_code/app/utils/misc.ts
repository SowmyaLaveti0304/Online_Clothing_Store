import ObjectID from "bson-objectid";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string): string {
  const nameParts = name.split(/[^a-zA-Z]+/);
  let initials = "";

  for (const part of nameParts) {
    if (part.length > 0) {
      initials += part[0];
    }

    if (initials.length >= 2) {
      break;
    }
  }

  return initials.toUpperCase();
}

export const extractShortId = (id: string) => {
  return id.slice(-6).toUpperCase();
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const convertTimeToDate = (time: string) => {
  const currentDate = new Date();
  const [hours, minutes] = time.split(":").map(Number);

  const date = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    hours,
    minutes,
  );

  return date;
};

export const convertDateToTime = (date: Date | string) => {
  let _date: Date;
  if (typeof date === "string") {
    _date = new Date(date);
  } else {
    _date = date;
  }

  return `${_date.getHours()}:${_date.getMinutes()}`;
};

export function convertScheduleTimeToDate(time: {
  endTime: string;
  startTime: string;
}): {
  endDate: Date;
  startDate: Date;
} {
  const startDate = convertTimeToDate(time.startTime);
  const endDate = convertTimeToDate(time.endTime);

  // Adjust endDate to the next day if endTime is past midnight (after startTime)
  if (endDate < startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return { startDate, endDate };
}

export const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatTime = (time: Date | string) => {
  let _time: Date;
  if (typeof time === "string") {
    _time = new Date(time);
  } else {
    _time = time;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(_time);
};

export const createBookId = () => {
  return ObjectID().toString();
};
