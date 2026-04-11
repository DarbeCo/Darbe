import { UserState } from "../features/users/userSlice";
import {
  DATE_CONSTANTS,
  stateAbbreviations,
  zipCodeRanges,
} from "./CommonConstants";
import { DefaultTime, MonthAtTime, NTimeAgo } from "./CommonDateFormats";
import { TimeVariants } from "./CommonTypes";

export const turnNumberIntoString = (num: number) => {
  switch (num) {
    case 0:
      return "zero";
    case 1:
      return "one";
    case 2:
      return "two";
    case 3:
      return "three";
    case 4:
      return "four";
    case 5:
      return "five";
    case 6:
      return "six";
    default:
      return "out of Range";
  }
};

export const capitalizeFirstLetter = (str: string | undefined) => {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeHyphenatedString = (str: string) => {
  return str
    .split("-")
    .map((word) => capitalizeFirstLetter(word))
    .join("-");
};

export const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const splitStringndCapitalize = (
  str: string | undefined,
  all: boolean
) => {
  if (!str) {
    return "";
  }

  return str
    .split(/(?=[A-Z])/)
    .map((word) => capitalizeFirstLetter(word))
    .join(all ? " " : "");
};

export const getUserDisplayName = (user: Partial<UserState> | undefined) => {
  if (!user) {
    return "";
  }
  if (user?.fullName) {
    return user.fullName;
  }
  if (user?.organizationName) {
    return user.organizationName;
  }
  if (user?.nonprofitName) {
    return user.nonprofitName;
  }
};

export const getUserStateFromZip = (zip: string | undefined) => {
  if (!zip) {
    return null;
  }

  const zipcode = parseInt(zip, 10);

  for (const range of zipCodeRanges) {
    if (zipcode >= range.start && zipcode <= range.end) {
      return { st: range.st, state: range.state };
    }
  }

  return null;
};

export const getStateInitials = (state: string | undefined) => {
  if (!state) {
    return undefined;
  }

  const lowercaseConcatState = state.toLowerCase().replace(/\s/g, "");

  return stateAbbreviations[lowercaseConcatState];
};

export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const pluralize = (count: number, noun: string, suffix = "s") =>
  `${noun}${count !== 1 ? suffix : ""}`;

export const formatDateTime = (timestamp?: Date | string, variant?: TimeVariants) => {
  if (!timestamp) {
    return "";
  }
  
  const date = new Date(timestamp ?? "");
  let formatDateTime;

  switch (variant) {
    case DATE_CONSTANTS.MONTH_AT_TIME: {
      formatDateTime = MonthAtTime(date);
      break;
    }
    case DATE_CONSTANTS.N_TIME_AGO: {
      formatDateTime = NTimeAgo(date);
      break;
    }
    case DATE_CONSTANTS.SHORT_MONTH_YEAR: {
      formatDateTime = `${date.toLocaleString("default", {
        month: "short",
      })} ${date.getFullYear()}`;
      break;
    }
    case DATE_CONSTANTS.YEAR_ONLY: {
      formatDateTime = date.getFullYear();
      break;
    }
    default:
      formatDateTime = DefaultTime(date);
  }

  return formatDateTime;
};

export const formatDarbeTimeToString = (time: number | undefined) => {
  if (typeof time === "string" || time === undefined) {
    throw new Error("Invalid input: time must not be a string");
  }

  const hour = Math.floor(time);
  const minute = time % 1 === 0 ? "00" : "30";
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;

  return `${displayHour}:${minute} ${period}`;
};

export const isValidArray = (arr: any[] | undefined) => {
  if (!arr) {
    return false;
  }

  return Array.isArray(arr) && arr.length > 0;
};
