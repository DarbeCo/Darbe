# RTK Toolkit API Endpoints

This README file provides instructions on how to create query and mutation endpoint injections using the RTK Toolkit.

## Creating Query Endpoints

To create a query injection using the RTK Toolkit, follow these steps:

1. Import the necessary dependencies:

```typescript
import { darbeBaseApi } from "../darbe.api";
import { ENDPOINTS } from "../endpoints";
```

2. Define the api service for the endpoint:

```typescript
export const exampleUserApi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The types go here <ResponseType, InputType>
    fetchUserData: builder.query<SomePayloadType, string>({
      query: (userId) => ENDPOINTS.ENDPOINT_CATEGORY.ROUTE,
    }),
  }),
});
```

3. Create a slice for your endpoint if needed in the respective feature/component area:

```typescript
interface UserState {
  userData: SomeType;
}

const initialState: <UserState | null> = {
  userData: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserState>) => {
      state.user = action.payload;
    },
  },
});
```

4. Export the necessary actions and selectors:

```typescript
export const { setUser } = userSlice.actions;
// These can optinally live in a separate file if there will be a lot
export const selectUserData = (state: RootState) => state.user.userData;
```

## Creating Mutation Endpoints

To create a mutation endpoint using the RTK Toolkit, follow these steps:

1. Import the necessary dependencies:

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
```

2. Define the api service for the endpoint:

```typescript
export const youOtherapi = darbeBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The types go here <ResponseType, InputType>
    updateUser: builder.mutation<SomePayloadType, string>({
      query: (formData) => {
        url: NDPOINTS.ENDPOINT_CATEGORY.ROUTE(formData.userId),
        method: "PUT", //can be POST or DELETE as well
        body: formData
        },
    }),
  }),
});
```

That's it! You have now created query and mutation endpoints using the RTK Toolkit. Feel free to customize the code according to your specific requirements.
