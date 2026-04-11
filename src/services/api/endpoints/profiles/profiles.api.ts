import { DarbeProfileSharedState } from "../../../../features/users/userSlice";
import { darbeBaseApi } from "../darbe.api";
import { EntityDocumentUpload } from "../types/common.api.types";
import { EntityDonorsAndStaff } from "../types/roster.api.types";
import { EntityDocument, SimpleUserInfo } from "../types/user.api.types";
import {
  addToDonors,
  addToStaff,
  deleteDocument,
  getDonorsAndStaff,
  getEntityDocuments,
  getEntityFollowers,
  getSimpleUserInfo,
  getUserProfile,
  removeFromDonors,
  removeFromStaff,
  removeUserLicense,
  removeUserOrganization,
  removeUserSkill,
  updateUserProfile,
  uploadDocument,
} from "../../../darbeService";

const profilesApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<DarbeProfileSharedState, string>({
      async queryFn(userId) {
        try {
          const data = await getUserProfile(userId);
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
      providesTags: ["Users", "Profile"],
      keepUnusedDataFor: 30,
    }),
    updateUserProfile: builder.mutation<
      Partial<DarbeProfileSharedState>,
      Partial<DarbeProfileSharedState>
    >({
      async queryFn(profile) {
        try {
          const data = await updateUserProfile(profile);
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
      invalidatesTags: ["Users", "Profile"],
    }),
    updateEntityProfile: builder.mutation<
      Partial<DarbeProfileSharedState>,
      Partial<DarbeProfileSharedState>
    >({
      async queryFn(profile) {
        try {
          const data = await updateUserProfile(profile);
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
      invalidatesTags: ["Users", "Profile"],
    }),
    removeUserOrganizationMutation: builder.mutation<
      Partial<DarbeProfileSharedState>,
      string>({
      async queryFn(organizationId) {
        try {
          await removeUserOrganization(organizationId);
          return { data: {} };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Users", "Profile"],
    }),
    removeUserSkillMutation: builder.mutation<
      Partial<DarbeProfileSharedState>,
      string
    >({
      async queryFn(skillName) {
        try {
          await removeUserSkill(skillName);
          return { data: {} };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Users", "Profile"],
    }),
    removeUserLicenseMutation: builder.mutation<
      Partial<DarbeProfileSharedState>,
      string
    >({
      async queryFn(licenseId) {
        try {
          await removeUserLicense(licenseId);
          return { data: {} };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              data: { message: (error as Error).message },
            },
          };
        }
      },
      invalidatesTags: ["Users", "Profile"],
    }),
    getEntityFollowers: builder.query<SimpleUserInfo[], string>({
      async queryFn(userId) {
        try {
          const data = await getEntityFollowers(userId);
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
      keepUnusedDataFor: 5,
    }),
    getSimpleUserInfo: builder.query<SimpleUserInfo, string | undefined>({
      async queryFn(userId) {
        try {
          const data = await getSimpleUserInfo(userId);
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
      keepUnusedDataFor: 30,
    }),
    getDonorsAndStaff: builder.query<EntityDonorsAndStaff, { userId: string }>({
      async queryFn({ userId }) {
        try {
          const data = await getDonorsAndStaff(userId);
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
      providesTags: ["RosterMembers", "Profile"],
    }),
    addToDonors: builder.mutation<void, { userId: string }>({
      async queryFn({ userId }) {
        try {
          await addToDonors(userId);
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
      invalidatesTags: ["RosterMembers", "Profile"],
    }),
    addToStaff: builder.mutation<void, { userId: string }>({
      async queryFn({ userId }) {
        try {
          await addToStaff(userId);
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
      invalidatesTags: ["RosterMembers", "Profile"],
    }),
    removeFromDonors: builder.mutation<void, { userId: string }>({
      async queryFn({ userId }) {
        try {
          await removeFromDonors(userId);
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
      invalidatesTags: ["RosterMembers", "Profile"],
    }),
    removeFromStaff: builder.mutation<void, { userId: string }>({
      async queryFn({ userId }) {
        try {
          await removeFromStaff(userId);
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
      invalidatesTags: ["RosterMembers", "Profile"],
    }),
    uploadDocument: builder.mutation<void, EntityDocumentUpload>({
      async queryFn(document) {
        try {
          await uploadDocument(document.documentCategory, document.file);
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
      invalidatesTags: ["Documents", "Profile"],
    }),
    deleteDocument: builder.mutation<void, string>({
      async queryFn(documentId) {
        try {
          await deleteDocument(documentId);
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
      invalidatesTags: ["Documents", "Profile"],
    }),
    getEntityDocuments: builder.query<EntityDocument[], void>({
      async queryFn() {
        try {
          const data = await getEntityDocuments();
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
      keepUnusedDataFor: 30,
      providesTags: ["Documents", "Profile"],
    }),
  })
});

export const {
  useGetUserProfileQuery,
  useLazyGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useUpdateEntityProfileMutation,
  useRemoveUserOrganizationMutationMutation,
  useRemoveUserLicenseMutationMutation,
  useRemoveUserSkillMutationMutation,
  useGetEntityFollowersQuery,
  useGetSimpleUserInfoQuery,
  useGetDonorsAndStaffQuery,
  useAddToDonorsMutation,
  useAddToStaffMutation,
  useRemoveFromDonorsMutation,
  useRemoveFromStaffMutation,
  useGetEntityDocumentsQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
} = profilesApi;
