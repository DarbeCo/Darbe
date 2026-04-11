// TODO: refactor for proper types, but its used to ensure dates are good for edit fields
export const prepareData = (dates: any, parent: any) => {
  const startString = `${dates.startMonth} ${dates.startYear}`;
  const endString = `${dates.endMonth} ${dates.endYear}`;
  const startDate = isNaN(Date.parse(startString))
    ? undefined
    : new Date(startString);
  const endDate = isNaN(Date.parse(endString))
    ? undefined
    : new Date(endString);

  parent.startDate = startDate;
  parent.endDate = endDate;

  return parent;
};

// TODO: Update types
export const prepareLicenseDates = (dates: any) => {
  const startString = `${dates.issueMonth} ${dates.issueYear}`;
  const endString = `${dates.expirationMonth} ${dates.expirationYear}`;

  const issueDate = isNaN(Date.parse(startString))
    ? undefined
    : new Date(startString);
  let expirationDate;

  if (dates.doesNotExpire) {
    expirationDate = undefined;
  } else {
    expirationDate = isNaN(Date.parse(endString))
      ? undefined
      : new Date(endString);
  }

  return { issueDate, expirationDate };
};
