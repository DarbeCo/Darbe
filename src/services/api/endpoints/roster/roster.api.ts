import { darbeBaseApi } from "../darbe.api";
import {
    EligibleRosterMembers,
    NewRoster,
    Roster,
    RosterAddCandidateParams,
    RosterAdminPermissions,
    RosterEventAdminEntityAccess,
    RosterMember,
} from "../types/roster.api.types";
import { SimpleUserInfo } from "../types/user.api.types";
import {
    addToRoster,
    createRoster,
    deleteRoster,
    demoteUserFromAdmin,
    getAllRosterMembers,
    getEntityRosterAccess,
    getEntityRosterMembers,
    getRosterAddCandidates,
    getRosterEventAdminEntityAccess,
    getRosterAdminEntityIds,
    getRosterAdmins,
    getRosterMembers,
    getRosters,
    promoteUserToAdmin,
    removeFromRoster,
} from "../../../darbeService";


const rosterApi = darbeBaseApi.injectEndpoints({
    endpoints: (builder) => ({
        getRosters: builder.query<Roster[], string | void>({
            async queryFn(ownerId) {
                try {
                    const data = await getRosters(ownerId || undefined);
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
            providesTags: ["Roster"],
        }),
        getRosterMembers: builder.query<RosterMember[], string>({
            async queryFn(rosterId) {
                try {
                    const data = await getRosterMembers(rosterId);
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
            providesTags: ["RosterMembers"]
        }),
        createRoster: builder.mutation<Roster, NewRoster>({
            async queryFn(newRoster) {
                try {
                    const data = await createRoster(newRoster);
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
            invalidatesTags: ["Roster"],
        }),
        deleteRoster: builder.mutation<void, string>({
            async queryFn(rosterId) {
                try {
                    await deleteRoster(rosterId);
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
            invalidatesTags: ["Roster", "RosterMembers"],
        }),
        promoteUserToAdmin: builder.mutation<
            void,
            { userId: string; rosterId: string; permissions?: RosterAdminPermissions }
        >({
            async queryFn({ userId, rosterId, permissions }) {
                try {
                    await promoteUserToAdmin(userId, rosterId, permissions);
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
            invalidatesTags: ["Roster"],
        }),
        demoteUserFromAdmin: builder.mutation<void, { userId: string; rosterId: string }>({
            async queryFn({ userId, rosterId }) {
                try {
                    await demoteUserFromAdmin(userId, rosterId);
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
            invalidatesTags: ["Roster"],
        }),
        addFollowerToRoster: builder.mutation<void, { followerId: string; rosterId: string }>({
            async queryFn({ followerId, rosterId }) {
                try {
                    await addToRoster(followerId, rosterId);
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
            invalidatesTags: ["Roster", "RosterMembers"],
        }),
        removeMemberFromRoster: builder.mutation<void, { memberId: string; rosterId: string }>({
            async queryFn({ memberId, rosterId }) {
                try {
                    await removeFromRoster(memberId, rosterId);
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
            invalidatesTags: ["Roster", "RosterMembers"],
        }),
        getRosterAdmins: builder.query<SimpleUserInfo[], string | void>({
            async queryFn(ownerId) {
                try {
                    const data = await getRosterAdmins(ownerId || undefined);
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
        getAllRosterMembers: builder.query<EligibleRosterMembers, void>({
            async queryFn() {
                try {
                    const data = await getAllRosterMembers();
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
            providesTags: ["RosterMembers"],
        }),
        getEntityRosterAccess: builder.query<
            { isMember: boolean; isAdmin: boolean; memberCount: number },
            string
        >({
            async queryFn(entityId) {
                try {
                    const data = await getEntityRosterAccess(entityId);
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
            providesTags: ["Roster", "RosterMembers"],
        }),
        getEntityRosterMembers: builder.query<SimpleUserInfo[], string>({
            async queryFn(entityId) {
                try {
                    const data = await getEntityRosterMembers(entityId);
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
            providesTags: ["Roster", "RosterMembers"],
        }),
        getRosterAddCandidates: builder.query<
            SimpleUserInfo[],
            RosterAddCandidateParams
        >({
            async queryFn(params) {
                try {
                    const data = await getRosterAddCandidates(params);
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
            providesTags: ["Roster", "RosterMembers"],
        }),
        getRosterAdminEntityIds: builder.query<string[], void>({
            async queryFn() {
                try {
                    const data = await getRosterAdminEntityIds();
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
            providesTags: ["Roster", "RosterMembers"],
        }),
        getRosterEventAdminEntityAccess: builder.query<
            RosterEventAdminEntityAccess[],
            void
        >({
            async queryFn() {
                try {
                    const data = await getRosterEventAdminEntityAccess();
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
            providesTags: ["Roster", "RosterMembers"],
        }),
    }),
});

export const {
    useGetRostersQuery,
    useCreateRosterMutation,
    useDeleteRosterMutation,
    usePromoteUserToAdminMutation,
    useDemoteUserFromAdminMutation,
    useGetRosterMembersQuery,
    useAddFollowerToRosterMutation,
    useRemoveMemberFromRosterMutation,
    useGetRosterAdminsQuery,
    useGetAllRosterMembersQuery,
    useGetEntityRosterAccessQuery,
    useGetEntityRosterMembersQuery,
    useGetRosterAddCandidatesQuery,
    useGetRosterAdminEntityIdsQuery,
    useGetRosterEventAdminEntityAccessQuery
} = rosterApi;
