export const parseEventDateAsLocalDate = (eventDate: Date | string) => {
  if (eventDate instanceof Date) {
    return eventDate;
  }

  const [year, month, day] = eventDate.split("T")[0].split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day);
  }

  return new Date(eventDate);
};

export const getEventTimeParts = (eventTime = 0) => {
  const hour = Math.floor(eventTime);
  const fraction = Number((eventTime - hour).toFixed(2));

  if (fraction === 0) {
    return { hour, minute: 0 };
  }

  if (fraction === 0.5) {
    return { hour, minute: 30 };
  }

  const minute = Math.round(fraction * 100);

  return {
    hour,
    minute: Math.min(Math.max(minute, 0), 59),
  };
};

export const parseEventDateTimeAsLocalDate = (
  eventDate: Date | string,
  eventTime = 0
) => {
  const localDate = parseEventDateAsLocalDate(eventDate);
  const { hour, minute } = getEventTimeParts(eventTime);

  return new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    hour,
    minute
  );
};
