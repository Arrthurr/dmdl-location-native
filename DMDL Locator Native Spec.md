# “DMDL Provider Locator” Mobile App Development

## Purpose

Build a mobile device application that will enable educational service providers to **check-in** and **check-out** of pre-determined school locations using geolocation. Each of these service providers (who are external staff) can be assigned to one or more school campuses and the back office needs a record of each school site visit.

Designated office administrators need to view this data and create reports in order to comply with funding, billing, and safety requirements.

## Capabilities between user roles

There are two user types: **School Provider (“provider”)** and **Program Manager (“administrator)**

### Administrators

- can create, read, update, and delete school locations
- can create, read, update, and delete providers
- can create, read, update, and delete a provider’s school assignment
- can create, read, update, and delete a provider’s schedule (the assigned day/time at one or more schools)

### Providers

- read-only view of their assigned schools

## User experiences

### Provider side

When a provider successfully logs into the application, she should see the list of schools she is assigned to with basic information and a link to driving and transit directions. The app should ask the user’s permission to access the mobile device’s geolocation, then validate if any of the assigned schools fall inside the allowed maximum radius of 150 meters.

**If the provider is within 150 meters of an assigned school**, the app should initiate a “check-in” and start a visible timer.

The app should automatically “check-out” (stop the current timer) when that provider leaves (location is greater than 150 meters from the school) and capture that time as a valid session.

These providers will have service schedules at each school, and check-in/check-out capability **should not** be allowed outside the respective schedule times for a given school.

A provider should also be able to see a history of their check-in and check-out activity at their schools.

A provider will need a way to add an optional note to attach to their assigned session. For example: if there is an unscheduled school closure, the provider needs to notate that they are not able to perform the scheduled service for that day.

### Administrator side

A web application will allow admins to have the aforementioned CRUD capabilities. A reporting feature will allow filtering data by Provider, School, and date range (day/week/month/year). Results can be exported to CSV file format.

Admins can also visit schools and will need to perform check-in/check-out operations for each of these visits. Because they won’t be bound to an assignment or schedule, admins need to be able to select the school they will visit in order to check-in. However, they are still bound to the 150 meter radius rule like the providers, and their visits are recorded in the same manner as provider data.

## Specification

### Mobile app (Providers, Administrators)

I want to use Expo (React Native) to build a “native” app that will run on iOS and Android devices. The app needs to access location information, have capability while running in the background, and have notification ability.

### Web app (Administrators)

Let’s build a Next.js or React/Vite app (whichever is the better fit for this project) to handle the CRUD duties and reporting. I want to use Tailwind CSS and shadcn/ui for styling and dashboards. 

Admins will need to see:
- current provider sessions (who they are and where they are)
- session history
- areas to CRUD users, schools, and schedules
- the optional notes that a provider may attach to a session

### Backend

I want to use Google Firebase (e.g., Auth, Firestore, Functions, Hosting) for the backend services.

### Authentication

The back office currently uses Microsoft 365 and Azure services. **All users are authenticated in my organization via Entra ID.** I also have an app registration that we can use that is scoped to my tenant. **I only want Microsoft to authenticate my users** (no creating separate account credentials).

There is a caveat with Expo: [`AuthSession`](https://docs.expo.dev/versions/latest/sdk/auth-session/) is needed to handle the mobile app sign-ins, but we can use Firebase Auth to authenticate web logins. 

### Testing and deployment

We need a way to create/run tests for both Expo and web app setup. And I want to use Github for remote code hosting and Actions for CI/CD and deployment.

## Available Tools

- **gh**: GitHub CLI for managing repositories, issues, pull requests, etc.
- **firebase**: Firebase CLI for deploying, managing, and interacting with Firebase projects
- **azure**: Azure CLI for deploying, managing, and interacting with Azure projects
- **brew**: Homebrew package manager for macOS