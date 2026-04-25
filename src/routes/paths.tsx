import { createBrowserRouter } from "react-router-dom";

import { Error } from "./Error";
import { LandingPage } from "../layout/landing/LandingPage";
import { SignupPage } from "../pages/signup/Signup";
import { LoginPage } from "../pages/login/Login";
import { Home } from "../layout/main/MainPage";
import { ProtectedRoute } from "./Protected";
import { UserProfiles } from "../features/users/userProfiles/UserProfiles";
import { Logout } from "../features/users/logout/Logout";
import { ProfileEdit } from "../features/users/editProfile/ProfileEdit";
import { PostNeed } from "../features/postNeed/PostNeed";
import { SingleItemView } from "../features/singleItem/SingleItemView";
import { Messaging } from "../features/messaging/Messaging";
import { NewMessage } from "../features/messaging/NewMessage";
import { MessageChat } from "../features/messaging/MessageChat";
import { Notifications } from "../features/notifications/Notifications";
import { EventSignup } from "../features/events/eventSignup/EventSignup";
import { Matches } from "../features/matches/Matches";
import { Roster } from "../features/roster/Roster";
import { FriendsList } from "../features/friends/Friends";
import ImpactPage from "../features/impact/Impact";
import { PrivacyPolicy } from "../pages/privacy/PrivacyPolicy";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
    errorElement: <Error />,
  },
  {
    path: "/privacyPolicy",
    element: <PrivacyPolicy />,
  },
  {
    path: "/signup",
    element: <SignupPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/logout",
    element: <Logout />,
  },
  {
    path: "/home",
    element: <ProtectedRoute element={<Home />} />,
    children: [
      {
        path: "notifications",
        element: <Notifications />,
      },
      {
        path: "profile/:userId",
        element: <UserProfiles />,
      },
      // TODO: Do we still use this? modals took over so may be safe to delete?
      {
        path: "profile_edit",
        element: <ProfileEdit />,
      },
      {
        path: "match",
        element: <Matches />,
      },
      {
        path: "impact",
        element: <ImpactPage />,
      },
      {
        path: "messaging/:userId",
        element: <Messaging />,
      },
      {
        path: "messaging/:userId/new",
        element: <NewMessage />,
      },
      {
        path: "messaging/:friendId/chat",
        element: <MessageChat />,
      },
      {
        path: "roster",
        element: <Roster />,
      },
      {
        path: "post_a_need",
        element: <PostNeed />,
      },
      {
        path: "post_a_donation",
        element: <h1>Post a Donation</h1>,
      },
      {
        path: "posts/:postId",
        element: <SingleItemView itemType={"POST"} />,
      },
      {
        path: "events",
        element: <EventSignup />,
      },
      {
        path: "events/:eventId",
        element: <SingleItemView itemType={"EVENT"} />,
      },
      {
        path: "donation/:donationId",
        element: <SingleItemView itemType={"DONATION"} />,
      },
      {
        path: "comment/:commentId",
        element: <SingleItemView itemType={"COMMENT"} />,
      },
      {
        path: "friends",
        element: <FriendsList />,
      },
      {
        path: "privacy",
        element: <PrivacyPolicy />,
      },
    ],
  },
], {
  basename: import.meta.env.BASE_URL,
});
