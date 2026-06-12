import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Menu } from "@mui/material";

import {
  EVENTS_ROUTE,
  HOME_ROUTE,
  IMPACT_ROUTE,
  MATCH_ROUTE,
  MESSAGING_ROUTE,
  NOTIFICATIONS_ROUTE,
  POST_A_DONATION,
  POST_A_NEED,
} from "../../../routes/route.constants";
import { useNavigateHook } from "../../../utils/commonHooks/UseNavigate";
import { useLocation } from "../../../utils/commonHooks/UseLocation";
import { selectUser } from "../../../features/users/selectors";
import {
  showModal,
  setModalType,
  MODAL_TYPE,
} from "../../../components/modal/modalSlice";
import { useAppDispatch } from "../../../services/hooks";
import { useModal } from "../../../utils/commonHooks/UseModal";
import { MiniMenuItems } from "../../../components/miniMenu/MiniMenuItems";
import { useGetMessagesQuery } from "../../../services/api/endpoints/messages/messages.api";
import { useGetNotificationCountQuery } from "../../../services/api/endpoints/notifications/notifications.api";
import {
  useGetEventsQuery,
  useGetRosterAdminEventsQuery,
  useGetSignedUpEventsQuery,
  useGetVolunteerMatchesQuery,
} from "../../../services/api/endpoints/events/events.api";
import { useGetUserImpactQuery } from "../../../services/api/endpoints/impact/impact.api";
import { useGetRosterAdminEntityIdsQuery } from "../../../services/api/endpoints/roster/roster.api";
import { ShortEventState } from "../../../services/api/endpoints/types/events.api.types";
import { parseEventDateTimeAsLocalDate } from "../../../utils/eventDateUtils";
import { getViewedImpactIds } from "../../../utils/impactViewed";
import { getViewedMatchIds } from "../../../utils/matchViewed";
import { NavBarItem } from "./NavBarItem";

import styles from "../styles/mainPage.module.css";

const getDateOnlyTime = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getEventDateOnlyTime = (eventDate: string) => {
  const [year, month, day] = eventDate.split("T")[0].split("-").map(Number);

  if (year && month && day) {
    return new Date(year, month - 1, day).getTime();
  }

  return getDateOnlyTime(new Date(eventDate));
};

const isPastEvent = (
  event: Pick<ShortEventState, "eventDate" | "endTime">
) => {
  const todayTime = getDateOnlyTime(new Date());
  const eventDateTime = getEventDateOnlyTime(event.eventDate);

  if (event.endTime !== undefined) {
    return (
      new Date() > parseEventDateTimeAsLocalDate(event.eventDate, event.endTime)
    );
  }

  return eventDateTime < todayTime;
};

const isCurrentEvent = (
  event: Pick<ShortEventState, "eventDate" | "endTime">
) => !isPastEvent(event);

const getUpcomingMatchEvents = (events: ShortEventState[] = []) =>
  events.filter(isCurrentEvent);

type SideNavBarItemConfig = {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  svgPath: string;
  altText: string;
  text: string;
  count?: number;
  showZeroCount?: boolean;
};

export const SideNavBar = () => {
  const { user } = useSelector(selectUser);
  const isIndividual = user?.userType === "individual";
  const userId = user?.id ?? "";
  const userType = user?.userType;
  const navigate = useNavigateHook();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isVisible, hide, toggle } = useModal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: unreadNotificationCount = 0 } =
    useGetNotificationCountQuery(undefined, {
      pollingInterval: 7500,
      skipPollingIfUnfocused: true,
      skip: !userId,
    });
  const { data: messageThreads = [] } = useGetMessagesQuery(undefined, {
    pollingInterval: 7500,
    skipPollingIfUnfocused: true,
    skip: !userId,
  });
  const { data: events = [] } = useGetEventsQuery(undefined, {
    skip: !userId,
  });
  const { data: recommendableMatchEvents = [] } = useGetEventsQuery(
    { scope: "recommendable" },
    {
      skip: userType !== "organization",
    }
  );
  const { data: rosterAdminEntityIds = [] } =
    useGetRosterAdminEntityIdsQuery(undefined, {
      skip: !userId,
    });
  const { data: rosterAdminEvents = [] } = useGetRosterAdminEventsQuery(
    undefined,
    {
      skip: userType !== "individual",
    }
  );
  const { data: signedUpEvents = [] } = useGetSignedUpEventsQuery(
    { when: "upcoming" },
    { skip: !userId }
  );
  const { data: userImpacts = [] } = useGetUserImpactQuery(userId, {
    skip: !userId,
  });
  const { data: volunteerMatches = [] } = useGetVolunteerMatchesQuery(
    undefined,
    {
      skip: userType === "individual",
    }
  );
  const unreadMessageCount = useMemo(
    () =>
      messageThreads.reduce(
        (total, thread) =>
          total +
          thread.messages.filter(
            (message) => !message.isRead && message.senderId !== userId
          ).length,
        0
      ),
    [messageThreads, userId]
  );
  const currentEventsCount = useMemo(() => {
    if (!userId) return 0;

    const eventsById = new Map<string, ShortEventState>();

    [
      ...events,
      ...rosterAdminEvents,
      ...signedUpEvents.map(({ event }) => event),
    ].forEach((event) => {
      eventsById.set(event.id, event);
    });

    const rosterAdminEventIdSet = new Set(
      rosterAdminEvents.map((event) => event.id)
    );
    const eventsToDisplay = Array.from(eventsById.values());
    const adminManagedEvents = eventsToDisplay.filter(
      (event) =>
        event.eventOwner.id === userId ||
        event.eventCoordinator?.id === userId ||
        rosterAdminEntityIds.includes(event.eventOwner.id) ||
        rosterAdminEventIdSet.has(event.id)
    );
    const signedUpCurrentEvents = signedUpEvents
      .filter(
        ({ event, status }) => status !== "passed" && isCurrentEvent(event)
      )
      .map(({ event }) => event);
    const signedUpCurrentEventIds = new Set(
      signedUpCurrentEvents.map((event) => event.id)
    );
    const managedCurrentEvents = adminManagedEvents
      .filter((event) => isCurrentEvent(event))
      .filter((event) => !signedUpCurrentEventIds.has(event.id));

    return signedUpCurrentEventIds.size + managedCurrentEvents.length;
  }, [
    events,
    rosterAdminEntityIds,
    rosterAdminEvents,
    signedUpEvents,
    userId,
  ]);
  const newImpactCount = useMemo(() => {
    if (!userId) return 0;

    const viewedImpactIdSet = new Set(getViewedImpactIds(userId));

    return userImpacts.filter(
      (impact) => !viewedImpactIdSet.has(impact.id)
    ).length;
  }, [userId, userImpacts]);
  const newMatchCount = useMemo(() => {
    if (!userId) return 0;

    const viewedMatchIdSet = new Set(getViewedMatchIds(userId));
    const matchIds = [
      ...getUpcomingMatchEvents(events).map((event) => `event:${event.id}`),
      ...getUpcomingMatchEvents(recommendableMatchEvents).map(
        (event) => `recommendation:${event.id}`
      ),
      ...volunteerMatches.map((match) => `volunteer:${match.id}`),
    ];

    return matchIds.filter((matchId) => !viewedMatchIdSet.has(matchId)).length;
  }, [events, recommendableMatchEvents, userId, volunteerMatches]);

  const handleClick = (route: string) => {
    if (route === "home") {
      navigate(`${HOME_ROUTE}`);
    }
    if (route === "events") {
      navigate(`${EVENTS_ROUTE}`);
    }
    if (route === "match") {
      navigate(`${MATCH_ROUTE}`);
    }
    if (route === "impact") {
      navigate(`${IMPACT_ROUTE}`);
    }
    if (route === "messages") {
      navigate(`${MESSAGING_ROUTE}/${userId}`);
    }
    if (route === "notifications") {
      navigate(`${NOTIFICATIONS_ROUTE}`);
    }
  };

  const handleCreatePost = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isIndividual) {
      dispatch(setModalType(MODAL_TYPE.createPost));
      dispatch(showModal());
    } else {
      setAnchorEl(event.currentTarget);
      toggle();
    }
  };

  const handleEntityOptions = (route: string) => {
    toggle();
    if (route === "postANeed") {
      navigate(`${POST_A_NEED}`);
    }
    if (route === "postADonation") {
      navigate(`${POST_A_DONATION}`);
    }
    if (route === "createAPost") {
      dispatch(setModalType(MODAL_TYPE.createPost));
      dispatch(showModal());
    }
  };

  const determineCSS = (navBarItem: string) => {
    const pathname = location.pathname.replace(/\/+$/, "");

    if (navBarItem === "home") {
      return pathname === HOME_ROUTE;
    }

    if (navBarItem === "messages") {
      return pathname.startsWith(MESSAGING_ROUTE);
    }

    if (navBarItem === "notifications") {
      return pathname.startsWith(NOTIFICATIONS_ROUTE);
    }

    return pathname.startsWith(`/home/${navBarItem}`);
  };

  const navBarItems: SideNavBarItemConfig[] = [
    {
      onClick: () => handleClick("home"),
      svgPath: "/svgs/common/homeIcon.svg",
      altText: "home",
      text: "Home",
    },
    {
      onClick: () => handleClick("events"),
      svgPath: "/svgs/common/eventsIcon.svg",
      altText: "events",
      text: "Events",
      count: currentEventsCount,
      showZeroCount: true,
    },
    {
      onClick: (event: React.MouseEvent<HTMLButtonElement>) =>
        handleCreatePost(event),
      svgPath: "/svgs/common/createPostMobileIcon.svg",
      altText: "create post icon",
      text: "Post",
    },
    {
      onClick: () => handleClick("match"),
      svgPath: "/svgs/common/matchIcon.svg",
      altText: "match",
      text: "Match",
      count: newMatchCount,
    },
    {
      onClick: () => handleClick("impact"),
      svgPath: "/svgs/common/impactIcon.svg",
      altText: "impact",
      text: "Impact",
      count: newImpactCount,
    },
    {
      onClick: () => handleClick("notifications"),
      svgPath: "/svgs/common/notificationsDesktopIcon.svg",
      altText: "impact",
      text: "Notifications",
      count: unreadNotificationCount,
    },
    {
      onClick: () => handleClick("messages"),
      svgPath: "/svgs/common/messagesIcon.svg",
      altText: "messages",
      text: "Messages",
      count: unreadMessageCount,
    },
  ];

  return (
    <div className={styles.sideNavBar}>
      <div className={styles.sideNavBarItem}>
        {navBarItems.map((item, index) => (
          <NavBarItem
            key={index}
            onClick={item.onClick}
            svgPath={item.svgPath}
            altText={item.altText}
            text={item.text}
            count={item.count}
            showZeroCount={item.showZeroCount}
            isBlue={determineCSS(item.text.toLowerCase())}
            variant="default"
          />
        ))}
        {isVisible && (
          <Menu
            id="entity-creation-options"
            anchorEl={anchorEl}
            open={isVisible}
            onClose={hide}
            MenuListProps={{ "aria-labelledby": "basic-button" }}
          >
            <MiniMenuItems
              onClick={handleEntityOptions}
              routeName="postANeed"
            />
            <MiniMenuItems
              onClick={handleEntityOptions}
              routeName="postADonation"
            />
            <MiniMenuItems
              onClick={handleEntityOptions}
              routeName="createAPost"
            />
          </Menu>
        )}
      </div>
    </div>
  );
};
