import { useSelector } from "react-redux";

import { IconButton } from "@mui/material";
import { NavLink } from "react-router-dom";
import { CustomSvgs } from "../customSvgs/CustomSvgs";
import { MESSAGING_ROUTE } from "../../routes/route.constants";
import { selectUser } from "../../features/users/selectors";

export const MessagingIcon = () => {
  const { user } = useSelector(selectUser);
  const userId = user?.id ?? "";

  return (
    <NavLink to={`${MESSAGING_ROUTE}/${userId}`}>
      <IconButton>
        <CustomSvgs
          variant="small"
          svgPath="/svgs/common/messagesIcon.svg"
          altText="messaging icon"
        />
      </IconButton>
    </NavLink>
  );
};
