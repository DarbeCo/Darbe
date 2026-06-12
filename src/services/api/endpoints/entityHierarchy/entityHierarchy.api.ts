import { darbeBaseApi } from "../darbe.api";
import {
  EntityHierarchyCandidate,
  EntityHierarchyNode,
} from "../types/entityHierarchy.api.types";
import {
  acceptEntityChildRequest,
  getEntityHierarchyCandidates,
  getManageEntityHierarchy,
  getPublicEntityHierarchy,
  rejectEntityChildRequest,
  removeEntityChild,
  requestEntityChild,
} from "../../../darbeService";

type HierarchyQueryParams = {
  rootEntityId: string;
};

type HierarchyCandidateParams = {
  rootEntityId: string;
  searchText?: string;
};

type EntityChildAction = {
  parentEntityId: string;
  childEntityId: string;
};

const entityHierarchyApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicEntityHierarchy: builder.query<
      EntityHierarchyNode[],
      HierarchyQueryParams
    >({
      async queryFn({ rootEntityId }) {
        try {
          const data = await getPublicEntityHierarchy(rootEntityId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["EntityHierarchy"],
    }),
    getManageEntityHierarchy: builder.query<
      EntityHierarchyNode[],
      HierarchyQueryParams
    >({
      async queryFn({ rootEntityId }) {
        try {
          const data = await getManageEntityHierarchy(rootEntityId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["EntityHierarchy"],
    }),
    getEntityHierarchyCandidates: builder.query<
      EntityHierarchyCandidate[],
      HierarchyCandidateParams
    >({
      async queryFn(params) {
        try {
          const data = await getEntityHierarchyCandidates(params);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      providesTags: ["EntityHierarchy"],
    }),
    requestEntityChild: builder.mutation<string, EntityChildAction>({
      async queryFn(action) {
        try {
          const data = await requestEntityChild(action);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["EntityHierarchy", "Notifications", "NotificationCount"],
    }),
    acceptEntityChildRequest: builder.mutation<void, string>({
      async queryFn(hierarchyId) {
        try {
          await acceptEntityChildRequest(hierarchyId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["EntityHierarchy", "Notifications", "NotificationCount"],
    }),
    rejectEntityChildRequest: builder.mutation<void, string>({
      async queryFn(hierarchyId) {
        try {
          await rejectEntityChildRequest(hierarchyId);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["EntityHierarchy", "Notifications", "NotificationCount"],
    }),
    removeEntityChild: builder.mutation<void, EntityChildAction>({
      async queryFn(action) {
        try {
          await removeEntityChild(action);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["EntityHierarchy"],
    }),
  }),
});

export const {
  useGetPublicEntityHierarchyQuery,
  useGetManageEntityHierarchyQuery,
  useGetEntityHierarchyCandidatesQuery,
  useRequestEntityChildMutation,
  useAcceptEntityChildRequestMutation,
  useRejectEntityChildRequestMutation,
  useRemoveEntityChildMutation,
} = entityHierarchyApi;
