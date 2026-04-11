import { darbeBaseApi } from "../darbe.api";
import { EligibleRosterMembers, NewRoster, Roster, RosterMember } from "../types/roster.api.types";
import { SimpleUserInfo } from "../types/user.api.types";
import {
    addToRoster,
    createRoster,
    demoteUserFromAdmin,
    getAllRosterMembers,
    getRosterAdmins,
    getRosterMembers,
    getRosters,
    promoteUserToAdmin,
    removeFromRoster,
} from "../../../darbeService";


const rosterApi = darbeBaseApi.injectEndpoints({
    endpoints: (builder) => ({
        getRosters: builder.query<Roster[], void>({
            async queryFn() {
                try {
                    const data = await getRosters();
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
        promoteUserToAdmin: builder.mutation<void, { userId: string; rosterId: string }>({
            async queryFn({ userId, rosterId }) {
                try {
                    await promoteUserToAdmin(userId, rosterId);
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
        getRosterAdmins: builder.query<SimpleUserInfo[], void>({
            async queryFn() {
                try {
                    const data = await getRosterAdmins();
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
    }),
});

export const {
    useGetRostersQuery,
    useCreateRosterMutation,
    usePromoteUserToAdminMutation,
    useDemoteUserFromAdminMutation,
    useGetRosterMembersQuery,
    useAddFollowerToRosterMutation,
    useRemoveMemberFromRosterMutation,
    useGetRosterAdminsQuery,
    useGetAllRosterMembersQuery
} = rosterApi;
