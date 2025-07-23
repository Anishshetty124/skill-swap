# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

### Frontend Project Structure
The `/src` directory is organized as follows:
-   **/components**: Contains reusable UI components.
    -   **/layout**: Specific components for the main site layout (Navbar, Footer).
-   **/pages**: Contains top-level components that correspond to a page/route.
-   **/api**: Will contain API call logic (Axios instances).
-   **/context**: Will contain React Context providers for global state.

Code Record
INSTALLED: axios

CREATED: /client/src/api/axios.js

MODIFIED: /client/src/pages/Register.jsx

## Frontend State Management (`AuthContext`)

To manage user authentication status globally, we use React's Context API.

### `src/context/AuthContext.jsx`

This file exports two key items:

1.  **`AuthProvider`**: A component that wraps the entire application. It holds the authentication state and logic. It should be used once in `main.jsx`.

2.  **`useAuth()`**: A custom hook that allows any child component to easily access the authentication state and functions without needing to import `useContext` and `AuthContext` directly.

### State and Functions Provided by `useAuth()`

When you use the `useAuth` hook in a component, you get access to an object with the following properties:

-   **`user`**: An object containing the logged-in user's data (e.g., `username`, `email`, `_id`), or `null` if not logged in.
-   **`isAuthenticated`**: A boolean (`true` or `false`) indicating if the user is currently authenticated.
-   **`login(credentials)`**: An `async` function that takes a credentials object (`{email, password}`) and attempts to log the user in by calling the backend API. It handles updating the global state on success and throws an error on failure.
-   **`logout()`**: An `async` function that logs the user out by calling the backend API and clearing the global state.

### Example Usage in a Component

```jsx
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { isAuthenticated, user, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in.</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
};


### **Code Record**

* **CREATED**: `/client/src/context/AuthContext.jsx`
* **MODIFIED**: `/client/src/main.jsx`
* **MODIFIED**: `/client/src/pages/Login.jsx`
* **MODIFIED**: `/client/src/components/layout/Navbar.jsx`

---

**Next, we will create Protected Routes.** This will prevent users who are not logged in from accessing sensitive pages like the Dashboard, automatically redirecting them to the login page. This is a crucial security and UX feature.

## Frontend Routing

The application uses `react-router-dom` for client-side routing.

### Protected Routes

To restrict access to certain pages for unauthenticated users, we use a `ProtectedRoute` component.

#### `src/components/auth/ProtectedRoute.jsx`

This component acts as a wrapper for routes that require authentication. Its logic is simple:
- It uses the `useAuth()` hook to check if `isAuthenticated` is `true`.
- If the user **is authenticated**, it renders the child component using React Router's `<Outlet />`.
- If the user **is not authenticated**, it redirects them to the `/login` page using the `<Navigate />` component.

#### Usage in `App.jsx`

To protect a route, you wrap it in a parent `<Route>` that uses `ProtectedRoute` as its element. Any nested routes will then be protected.

```jsx
// In App.jsx
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';

<Routes>
  {/* ... public routes */}

  <Route element={<ProtectedRoute />}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="settings" element={<Settings />} />
  </Route>
</Routes>

### **Code Record**

* **CREATED**: `/client/src/components/auth/ProtectedRoute.jsx`
* **CREATED**: `/client/src/pages/Dashboard.jsx`
* **MODIFIED**: `/client/src/App.jsx`

---

**Next, we will build the Home page.** This page will serve as the main "Discover Skills" feed. We will fetch all available skills from our backend API and display them in a clean, card-based layout.

## Frontend Core Features

This section describes the implementation of the main features on the frontend.

### Displaying Skills (`Home.jsx`)

The Home page serves as the main discovery feed for users to browse available skills.

#### Data Flow

1.  **Component Mount**: When the `Home` component first renders, a `useEffect` hook is triggered.
2.  **API Call**: Inside the `useEffect`, an asynchronous function calls our backend using the pre-configured `apiClient`. It sends a `GET` request to the `/api/v1/skills` endpoint.
3.  **State Management**:
    -   A `loading` state is set to `true` before the API call, displaying a "Loading..." message to the user.
    -   Upon a successful response, the fetched array of skills is stored in the `skills` state.
    -   If the API call fails, an `error` message is stored in the `error` state.
    -   The `loading` state is set to `false` after the call completes (either successfully or with an error).
4.  **Rendering**:
    -   The component re-renders based on the state.
    -   If `loading` is true, a loading indicator is shown.
    -   If an `error` exists, an error message is shown.
    -   If the `skills` array has data, the component maps over the array. For each `skill` object, it renders a reusable `<SkillCard />` component, passing the skill data as a prop.

#### `SkillCard` Component

The `SkillCard` (`/src/components/skills/SkillCard.jsx`) is a presentational component responsible for displaying a single skill's summary information.

-   **Props**: It receives a single `skill` object.
-   **Functionality**: It displays the skill's title, category, a truncated description, and the username of the person who posted it. It also includes a "View Details" button that links to the single skill page (e.g., `/skills/some-skill-id`).
-   **Styling**: It uses conditional Tailwind CSS classes to display a different colored border based on whether the skill `type` is 'OFFER' or 'REQUEST', providing a quick visual cue.

#### Single Skill Detail Page (`/skills/:skillId`)

This page displays the complete information for a single skill.

##### **Data Flow & Hooks**

1.  **`useParams`**: The component uses the `useParams` hook from `react-router-dom` to extract the dynamic `:skillId` parameter from the current URL.
2.  **`useEffect`**: A `useEffect` hook is used to trigger a data fetch whenever the `skillId` parameter changes. This ensures that if the user navigates from one skill page to another, the new data is fetched correctly.
3.  **API Call**: Inside the effect, the `apiClient` sends a `GET` request to the `/api/v1/skills/:skillId` endpoint to retrieve the data for that specific skill.
4.  **State Management**: `useState` is used to manage the `skill` data, as well as `loading` and `error` states, providing feedback to the user while the data is being fetched.
5.  **Rendering**: The component conditionally renders the UI based on the current state:
    -   If `loading`, it shows a "Loading..." message.
    -   If `error`, it displays an error message.
    -   Once the `skill` data is available, it renders the full details, including title, category, full description, level, location, availability, and the username of the poster.

    #### Creating a New Skill (`/skills/new`)

This feature allows authenticated users to contribute to the platform by posting a skill they can offer or one they need.

##### **Route Protection**
The route `/skills/new` is nested within the `<ProtectedRoute />` component in `App.jsx`. This ensures that any attempt to access this page without being logged in will result in a redirect to the `/login` page.

##### **Form and State Management**
- **Component**: The UI and logic are handled by the `CreateSkillPage.jsx` component.
- **State**: A single state object, managed by `useState`, holds all the values for the form fields (`type`, `title`, `description`, etc.). The `handleChange` function updates this state object dynamically for every input change.
- **Validation**: Basic client-side validation checks if a category is selected before submission. More robust validation is handled by the backend API.

##### **API Interaction**
- **Submission**: The `handleSubmit` function is triggered on form submission.
- **API Call**: It uses the `apiClient` to send a `POST` request to the `/api/v1/skills` endpoint. The request body contains the data from the form's state.
- **Response Handling**:
    - On **success**, a success message is displayed, and the user is redirected to the detail page of their newly created skill using the `useNavigate` hook from React Router.
    - On **failure**, the error message from the backend is caught and displayed to the user, providing immediate feedback.
    Code Record
CREATED: /client/src/pages/CreateSkillPage.jsx

MODIFIED: /client/src/App.jsx

MODIFIED: /client/src/components/layout/Navbar.jsx

#### User Dashboard (`/dashboard`)

The dashboard is the user's central hub for managing their skill swap proposals. It's a protected route accessible only to authenticated users.

##### **Component Architecture**

The feature is broken down into a hierarchy of components for clarity and reusability:

1.  **`Dashboard.jsx` (Page Component)**:
    -   The main container that holds the entire dashboard UI.
    -   Manages the overall state including the `activeTab` ('received' or 'sent'), the `proposals` array, `loading`, and `error` states.
    -   Handles fetching data from the API based on the active tab.

2.  **`ProposalList.jsx` (List Component)**:
    -   A presentational component that receives an array of `proposals` as a prop.
    -   It is responsible for mapping over the array and rendering a `ProposalCard` for each item.
    -   It also passes down the `onUpdate` handler to each card.

3.  **`ProposalCard.jsx` (Card Component)**:
    -   Displays the details of a single proposal.
    -   The content is dynamically rendered based on whether it's a 'sent' or 'received' proposal (e.g., "You offered..." vs. "[User] wants to trade...").
    -   Conditionally renders 'Accept' and 'Reject' buttons for received, pending proposals.

##### **Data Flow & State Management**

-   **Fetching Data**: When the `Dashboard` component mounts or the `activeTab` state changes, a `useEffect` hook triggers an API call to `GET /api/v1/proposals?type=<tab_name>`.
-   **Updating State (Child-to-Parent Communication)**:
    1.  A user clicks 'Accept' or 'Reject' on a `ProposalCard`.
    2.  The card's `handleResponse` function sends a `PATCH` request to `/api/v1/proposals/:proposalId/respond`.
    3.  Upon a successful response from the API, the `ProposalCard` calls the `onUpdate` function that was passed down as a prop from `Dashboard`.
    4.  The `Dashboard`'s `handleProposalUpdate` function receives the updated proposal object.
    5.  It then updates its local `proposals` state array, replacing the old proposal with the updated one.
    6.  This triggers a re-render of the list with the updated status, providing an instant UI update without a full page refresh.

    #### User Profile Page (`/profile/:username`)

This public page displays a comprehensive overview of a user, their skills, and their reputation on the platform.


#### **Frontend Implementation**
-   **Browser Geolocation API**: The Home page features a "Find Near Me" button that utilizes the browser's built-in `navigator.geolocation` API.
-   **User Permission**: The browser automatically handles prompting the user for permission to access their location, a standard and secure practice.
-   **Dynamic API Calls**: Upon receiving the user's coordinates, the frontend makes a new API call to the `/skills/nearby` endpoint, dynamically filtering the skill feed to show only local results. This demonstrates a practical application of a user's real-world context to filter data.

### Geolocation & Nearby Search

The frontend provides an intuitive way for users to discover skills in their physical area, creating a truly local experience.

* **Browser Geolocation API**: The Home page features a "Find Near Me" button that utilizes the browser's built-in `navigator.geolocation` API to securely get the user's current location.

* **User Permission Handling**: The browser automatically handles the entire process of prompting the user for permission to access their location. Our application gracefully handles cases where permission is denied, showing an appropriate message to the user.

* **Dynamic Data Filtering**: Upon successfully receiving the user's coordinates, the frontend makes a dynamic API call to the backend's `/api/v1/skills/nearby` endpoint. The existing skill feed is then updated with the new, location-filtered list of skills, demonstrating a practical application of a user's real-world context to enhance their experience.

### Interactive Map View

To provide a rich, visual way to explore local skills, the platform includes an interactive map view powered by **Leaflet**.

* **Technology**: The map is implemented using the `leaflet` library and the `react-leaflet` wrapper, which provides a declarative React API for building map components. Map tiles are sourced from OpenStreetMap.

* **`MapComponent.jsx`**: A dedicated component was created to encapsulate all map-related logic. It receives an array of `skills` as a prop.

* **Data Visualization**: The component iterates through the skills data. For each skill posted by a user with valid geocoded coordinates, it renders a `<Marker>` pin on the map. Each marker contains a `<Popup>` that displays the skill's title and a link to its detail page.

* **Dynamic View Toggle**: The `Home.jsx` page features a UI toggle that allows users to seamlessly switch between the traditional card-based grid view and the new interactive map view, giving them control over how they want to browse for skills.

### Skill Match Recommendations

To help users find swap partners faster, the application proactively suggests relevant skills.

* **Context-Aware Fetching**: When a user views the detail page for a skill they have personally **requested**, the component makes an additional API call to a special endpoint (`/api/v1/skills/:skillId/matches`).

* **Displaying Recommendations**: The fetched list of top-matched skills is then displayed in a dedicated "Top Matches" section on the same page. This provides an immediate, curated list of potential users to trade with, significantly improving the user's journey.




