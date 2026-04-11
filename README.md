# Darbe

Darbe is a React + TypeScript web application built with Vite. It provides a social platform for volunteers, organizers, and causes to connect through event creation, messaging, causes, and community impact tracking.

## What this app includes

- Login and signup user flows
- Supabase-backed authentication and data access
- Event browsing, creation, and match-making
- Comments, notifications, and user messaging
- Responsive layout for desktop and mobile
- Global state management with Redux Toolkit
- Custom UI components, form handling, and reusable styles

## Local setup

- We use React with Typescript for frontend development
- Supabase is our database client and backend


### Requirements

- Node.js 18+ (or compatible LTS version)
- npm 10+ (or yarn/pnpm if preferred)
- An .env file the can be provided by the team.  It will not be stored in the repo. 

### Get Up And Running
- Clone the Darbe repo
- Open the project in your favorite editor (i.e. Visual Studio Code, etc.)
- In the terminal, in the directory of the project, run `npm install`
- Then run `npm run dev`
- Open your browser to `http://localhost:5173`



## Useful scripts

- `npm run dev` - start Vite development server
- `npm run build` - create production build
- `npm run preview` - preview production build locally

## Notes for developers

- App entry point: `src/main.tsx`
- Main routes and protected route handling: `src/routes`
- Global Redux store: `src/services/store.ts`
- API and Supabase logic: `src/services/api` and `src/services/darbeService`
- Auth and login flow: `src/features/login`
- UI components: `src/components`

## Tips

- Keep environment secrets out of source control
- Use the existing component patterns in `src/components` for reusable UI
- Add new Redux slices under `src/services` and wire them into `rootReducer`

---

Built with React, TypeScript, Vite, Supabase, Material UI, and Redux Toolkit.