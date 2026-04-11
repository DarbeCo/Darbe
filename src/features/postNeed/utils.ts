import {
  isValidDate,
  isValidName,
  isValidNumber,
  isValidStreetName,
} from "../../utils/formUtils/formUtils";

// TODO: Update types, value could be anything honestly
export const validateField = (name: string, value?: any) => {
  let error = "";

  switch (name) {
    case "city":
    case "locationName":
    case "eventName":
      if (!isValidName(value)) {
        error = "Please enter a valid event name";
      }
      break;
    case "eventDate":
      if (!isValidDate(value)) {
        error = "Please enter a valid date format: MM-DD-YYYY";
      }
      break;
    case "zipCode":
    case "maxVolunteerCount":
      if (!isValidNumber(value)) {
        error = "Please enter a valid number of volunteers";
      }
      break;
    case "startTime":
      if (value === "") {
        error = "Start time required";
      }
      break;
    case "streetName":
      if (!isValidStreetName(value)) {
        error = "Please enter a valid street name";
      }
      break;
    default:
      break;
  }

  return error;
};
