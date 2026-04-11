export const UseDateParser = (date: string | Date | undefined) => {
  if (!date) {
    return {
      month: undefined,
      year: undefined,
    };
  }

  let formattedDate = date;

  if (typeof date === "string") {
    formattedDate = new Date(date);
  }

  // getthe month
  const month = formattedDate.toLocaleString("en-US", {
    month: "short",
  });

  // get the year
  const year = formattedDate.toLocaleString("en-US", {
    year: "numeric",
  });

  return {
    month,
    year,
  };
};
