import { useAppSelector } from "../../services/hooks";
import { EventMatches } from "../events/eventMatches/EventMatches";
import { selectUserType } from "../users/selectors";
import { VolunteerMatches } from "../volunteerMatches/VolunteerMatches";

export const Matches = () => {
  const userType = useAppSelector(selectUserType);

  if (userType === "individual") {
    return <EventMatches />;
  }
  if (userType !== "individual") {
    return <VolunteerMatches />;
  }
};
