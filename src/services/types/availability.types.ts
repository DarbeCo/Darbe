interface AvailabilityOptions {
  start?: string;
  end?: string;
  open?: boolean;
}

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type Availability = {
  [key in DayOfWeek]?: AvailabilityOptions;
};
