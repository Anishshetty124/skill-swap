# FRONTEND CONTENT

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



### Real-Time Notifications

The frontend is built to handle real-time events from the server, providing an interactive and modern user experience.

* **Connection Management**: The WebSocket connection is managed within the global `AuthContext`. A connection is automatically established via `socket.io-client` when a user successfully authenticates and is terminated upon logout.
* **Event Listening**: The `AuthContext` listens for `new_notification` events from the server.
* **Toast Notifications**: Upon receiving a notification event, the application uses the **`react-hot-toast`** library to display a clean, non-intrusive pop-up message to the user, alerting them of the event in real-time.



### Skill Match Recommendations

To help users find swap partners faster, the application proactively suggests relevant skills.

* **Context-Aware Fetching**: When a user views the detail page for a skill they have personally **requested**, the component makes an additional API call to a special endpoint (`/api/v1/skills/:skillId/matches`).

* **Displaying Recommendations**: The fetched list of top-matched skills is then displayed in a dedicated "Top Matches" section on the same page. This provides an immediate, curated list of potential users to trade with, significantly improving the user's journey.




























# BACKEND CONTENT

===============================
   API ENDPOINTS - USERS AUTH
===============================

1. REGISTER A NEW USER
------------------------
POST /api/v1/users/register

Creates a new user account.

Request Body:
  - username (String) - Required
  - email (String)    - Required
  - password (String) - Required

Response: 201 Created
{
  "statusCode": 201,
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "createdAt": "2025-07-21T15:30:00.000Z",
    "updatedAt": "2025-07-21T15:30:00.000Z"
  },
  "message": "User registered successfully",
  "success": true
}

Code Record:
  - CREATED: /server/models/user.model.js
  - CREATED: /server/controllers/user.controller.js
  - CREATED: /server/routes/user.routes.js
  - MODIFIED: /server/server.js


2. LOGIN USER
------------------------
POST /api/v1/users/login

Logs in an existing user and returns:
  - accessToken (in response body)
  - refreshToken (in httpOnly cookie)

Request Body:
  - email (String)    - Required*
  - username (String) - Required*
  - password (String) - Required
  * Either email or username must be provided.

Response: 200 OK
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "60d0fe4f5311236168a109ca",
      "username": "testuser",
      "email": "test@example.com",
      "role": "user"
    },
    "accessToken": "ey...yourAccessToken...Jh"
  },
  "message": "User logged in successfully",
  "success": true
}

Code Record:
  - MODIFIED: /server/.env
  - MODIFIED: /server/models/user.model.js
  - MODIFIED: /server/controllers/user.controller.js
  - MODIFIED: /server/routes/user.routes.js


3. LOGOUT USER
------------------------
POST /api/v1/users/logout

Logs out the current user by clearing tokens.

Protected Route:
  Requires valid accessToken (in header or cookie)

Headers:
  - Authorization: Bearer <accessToken>
  OR use cookie

Response: 200 OK
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}


4. GET CURRENT USER PROFILE
------------------------
GET /api/v1/users/me

Fetches the profile of the authenticated user.

Protected Route:
  Requires valid accessToken (in header or cookie)

Headers:
  - Authorization: Bearer <accessToken>
  OR use cookie

Response: 200 OK
{
  "statusCode": 200,
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user",
    "createdAt": "2025-07-21T15:30:00.000Z",
    "updatedAt": "2025-07-21T15:30:00.000Z"
  },
  "message": "User profile fetched successfully",
  "success": true
}

=========================
       SKILLS API
=========================

All skill routes are PROTECTED and require authentication,
except GET requests.

--------------------------------------------------------
POST /api/v1/skills
--------------------------------------------------------
Creates a new skill (offer or request) for the authenticated user.

Request Body:
  - type (String)        - 'OFFER' or 'REQUEST'        [Required]
  - title (String)       - Title of the skill          [Required]
  - description (String) - Description of the skill    [Required]
  - category (String)    - e.g., 'Tech', 'Art'         [Required]
  - level (String)       - 'Beginner', 'Intermediate', 'Expert' [Optional]
  - availability (String)- e.g., "Weekends"            [Optional]
  - location (String)    - e.g., "Remote", "Bangalore" [Optional]

Responses:
  - 201 Created       : Skill successfully created
  - 400 Bad Request   : Missing required fields
  - 401 Unauthorized  : User not authenticated


--------------------------------------------------------
GET /api/v1/skills
--------------------------------------------------------
Returns a paginated list of all skills (PUBLIC).

Query Parameters:
  - page (Number)     - Page number (default: 1)
  - limit (Number)    - Items per page (default: 10)
  - type (String)     - Filter: 'OFFER' or 'REQUEST'
  - category (String) - Filter by category (e.g., 'Tech')
  - keywords (String) - Search keywords in title/description


--------------------------------------------------------
GET /api/v1/skills/:skillId
--------------------------------------------------------
Returns full details of a skill by ID (PUBLIC).

URL Parameters:
  - skillId (String) - Unique ID of the skill

Responses:
  - 200 OK           : Skill found
  - 404 Not Found    : No skill with provided ID


--------------------------------------------------------
PATCH /api/v1/skills/:skillId
--------------------------------------------------------
Updates a skill (only by the owner).

URL Parameters:
  - skillId (String) - ID of the skill to update

Request Body:
  - Include only the fields you want to update

Responses:
  - 200 OK           : Skill updated
  - 403 Forbidden    : Not the owner of the skill
  - 404 Not Found    : Skill not found


--------------------------------------------------------
DELETE /api/v1/skills/:skillId
--------------------------------------------------------
Deletes a skill (only by the owner).

URL Parameters:
  - skillId (String) - ID of the skill to delete

Responses:
  - 200 OK           : Skill deleted
  - 403 Forbidden    : Not the owner
  - 404 Not Found    : Skill not found

=========================
    PROPOSALS API
=========================

All proposal routes are PROTECTED and require authentication.

--------------------------------------------------------
POST /api/v1/proposals
--------------------------------------------------------
Create a proposal to swap skills with another user.

Request Body:
  - requestedSkillId (String) - ID of the skill you want to acquire
  - offeredSkillId   (String) - ID of the skill you offer in return
  - message          (String) - Optional message to the other user

Responses:
  - 201 Created       : Proposal created
  - 400 Bad Request   : Invalid input (e.g., proposing to yourself)
  - 403 Forbidden     : Offered skill not owned by user
  - 404 Not Found     : One of the skills doesn't exist
.
.
.
.
.
.
.

### `GET /api/v1/proposals`

Retrieves a list of proposals for the authenticated user.

**Query Parameters:**

| Parameter | Type     | Description                                           |
| --------- | -------- | ----------------------------------------------------- |
| `type`    | `String` | 'sent' or 'received'. Defaults to 'received'.         |

**Responses:**

- **`200 OK`**: Returns an array of proposal objects.

### `PATCH /api/v1/proposals/:proposalId/respond`

Allows the receiver of a proposal to accept or reject it. **Only the receiver of the proposal can perform this action.**

**URL Parameters:**

| Parameter    | Type     | Description                    |
| ------------ | -------- | ------------------------------ |
| `proposalId` | `String` | The unique ID of the proposal. |

**Request Body:**

| Field    | Type     | Description                    |
| -------- | -------- | ------------------------------ |
| `status` | `String` | 'accepted' or 'rejected'.      |

**Responses:**

- **`200 OK`**: The proposal status was successfully updated.
- **`403 Forbidden`**: The user is not the receiver of the proposal.
- **`404 Not Found`**: The proposal does not exist.


## Reviews API

Endpoints for submitting reviews after a skill swap. **All review routes are protected.**

### `POST /api/v1/reviews`

Submits a new review for a completed (accepted) proposal.

**Rules:**
- A review can only be submitted for a proposal with an 'accepted' status.
- The user must be either the proposer or the receiver of the swap.
- A user can only submit one review per proposal.

**Request Body:**

| Field        | Type     | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| `proposalId` | `String` | The `_id` of the completed proposal.                  |
| `rating`     | `Number` | A rating from 1 to 5.                                 |
| `comment`    | `String` | A written comment about the experience.               |

**Responses:**

- **`201 Created`**: The review was successfully submitted.
- **`400 Bad Request`**: The proposal is not in an 'accepted' state.
- **`403 Forbidden`**: The user was not part of the specified skill swap.
- **`404 Not Found`**: The proposal does not exist.
- **`409 Conflict`**: A review has already been submitted by this user for this proposal.

## ⭐ Standout Features

##### **Backend API (`GET /api/v1/users/:username`)**
-   A dedicated backend endpoint was created to serve all necessary data for the profile page in a single request.
-   It finds the user by their `username`.
-   It then uses `Promise.all` to concurrently fetch all skills where `type` is 'OFFER' and all reviews where the user is the `reviewee`. This is more efficient than fetching them sequentially.
-   It calculates the user's average rating from the fetched reviews.
-   Finally, it returns a single, aggregated `profileData` object containing user details, skills, reviews, and the average rating.

#### Edit Profile & Picture Upload

Users can update their profile information, including their bio and profile picture, on a protected "Edit Profile" page.

##### **Image Uploads with Cloudinary**

To handle image uploads efficiently and securely without overloading our own server, we use Cloudinary.

1.  **Unsigned Uploads**: We configure an "unsigned" upload preset in Cloudinary. This allows the frontend client to upload images directly to Cloudinary's API without needing a signature from our backend. This is a secure method for this use case because our Cloudinary account is configured to only accept specific transformations and types.
2.  **Frontend Process**:
    -   When a user selects an image, the frontend creates a `FormData` object.
    -   It makes a `POST` request directly to the Cloudinary API endpoint (`https://api.cloudinary.com/v1_1/...`), including the file and the unsigned upload preset name.
    -   Cloudinary processes the image and returns a `secure_url`.
3.  **Backend Process**:
    -   After receiving the `secure_url` from Cloudinary, the frontend makes a `PATCH` request to our own backend at `/api/v1/users/me/avatar`.
    -   The request body contains only the `avatarUrl`.
    -   Our backend then saves this URL to the `profilePicture` field in the user's document in MongoDB.

This two-step process is highly scalable, as our server only ever deals with a simple string (the URL) instead of heavy image file data.

##### **Updating Profile Data**

-   A separate `PATCH` request to `/api/v1/users/me` handles updates to text-based fields like the user's `bio`.
-   After a successful update, the global `AuthContext` state is updated with the new user object to ensure the changes are reflected immediately across the entire application (e.g., in the Navbar) without requiring a page reload or a new login.

### Geolocation & Nearby Search

To make the platform truly "local," SkillSwap implements a complete geolocation feature, allowing users to discover skills in their physical area.

#### **Backend Implementation**
-   **Geospatial Data**: The `User` model in MongoDB is equipped with a `location` field using the `Point` GeoJSON type. A `2dsphere` index is applied to this field, enabling highly efficient geospatial queries.
-   **Geocoding**: When a user enters their location as a string (e.g., "Mudhol, Karnataka") in their profile, the backend uses the **OpenCage Geocoding API** to automatically convert this address into precise latitude and longitude coordinates, which are then stored in the database.
-   **`$nearSphere` Queries**: A dedicated endpoint (`GET /api/v1/skills/nearby`) uses MongoDB's powerful `$nearSphere` operator. It finds all users within a specified radius of the requester's coordinates and then fetches all the skills offered by those users.

### Real-Time Notifications (Socket.IO)

The backend uses WebSockets via **Socket.IO** to provide real-time feedback to users.

* **Server Integration**: Socket.IO is integrated directly with the Express HTTP server, allowing for a shared port and seamless operation.
* **User-Specific Rooms**: Upon connecting, each authenticated client joins a private, user-specific room (named after their `userId`). This ensures that notifications are sent only to the intended recipient and not broadcast to all connected clients.
* **Event Emission**: When a critical event occurs, such as the creation of a new proposal in the `createProposal` controller, the server retrieves the global `io` instance and emits a `new_notification` event to the receiver's private room.

### AI-Powered Skill Matching

To provide a proactive and intelligent user experience, the backend features a recommendation engine to suggest ideal swap partners.

* **Automatic Tag Generation**: The system uses the `natural` NLP library to perform basic text analysis on the `title` and `description` of every new skill. It automatically extracts the most relevant keywords (tags) using TF-IDF (Term Frequency-Inverse Document Frequency) and saves them with the skill. This enriches the data without requiring manual user input.

* **Scoring & Ranking Algorithm**: A dedicated endpoint (`GET /api/v1/skills/:skillId/matches`) uses a custom scoring algorithm to find the best matches for a given skill request. It fetches a pool of potential candidates and assigns each a `matchScore` based on weighted criteria, such as sharing the same `category` (high weight) and having common `tags` (medium weight). The results are then sorted by this score to provide a ranked list of the most relevant skills.
Load Limited Cards (Pagination)
This feature improves performance by loading skills in batches instead of all at once.

Backend: The getAllSkills controller in /server/controllers/skill.controller.js accepts page and limit as query parameters. It uses Mongoose's .skip((page - 1) * limit) and .limit(limit) methods to fetch only a specific "page" of results from the database. It also returns the totalPages so the frontend knows if more skills are available.

Frontend: The /client/src/pages/Home.jsx component manages a page number in its state. Initially, it fetches page 1. When a user clicks the "Load More Skills" button, the page number is incremented, and another API call is made to fetch the next set of skills, which are then appended to the existing list.

Message on Accepting Swap
This feature facilitates communication by allowing a user to share contact details when they accept a proposal, which are then sent to the proposer.

Frontend: When the "Accept" button is clicked in /client/src/components/dashboard/ProposalCard.jsx, it opens a ShareContactModal.jsx. This modal has a form for a phone number and a note. When submitted, the frontend sends a PATCH request to the backend with the proposal status and the optional contact information.

Backend: The respondToProposal controller in /server/controllers/proposal.controller.js receives this request. If the status is "accepted" and contact details are included, it saves the details to the proposal document in the database and uses Socket.IO to emit a contact_info_received event directly to the original proposer's private room. The frontend listens for this event and displays the details in a toast notification.

YouTube Tutorials
This feature adds value by showing relevant learning resources based on a user's search.

Backend: A dedicated endpoint, /api/v1/skills/youtube-tutorials, is handled by the getYoutubeTutorials controller. This function receives a keyword, constructs a request to the Google YouTube Data API v3, and fetches a list of relevant tutorial videos. If no keyword is provided, it fetches a random set of popular educational videos.

Frontend: The /client/src/pages/Home.jsx component has a dedicated "YouTube Tutorials" section. On initial page load, it calls the backend endpoint without a keyword to display default popular videos. When a user performs a keyword search for skills, a second, parallel API call is made to the same endpoint with the search term, and the section updates to show tutorials related to that specific skill.

Badges (Gamification)
This feature encourages user engagement by awarding achievements for platform activity.

Backend: The logic is centralized in /server/utils/badgeManager.js. The calculateBadges function takes a user object, queries the database to count their completed swaps and skills offered, and returns an array of badge names they've earned (e.g., "First Swap", "Gold Swapper"). This calculation is triggered in two places:

When a user's profile is loaded (getUserProfile), to display their current badges.

When a proposal is accepted (respondToProposal), to check if a new badge has just been earned and send a real-time notification via Socket.IO if it has.

Frontend: The /client/src/pages/ProfilePage.jsx receives the array of badge names from the backend. It then maps over this array, rendering a reusable /client/src/components/profile/Badge.jsx component for each badge. The Badge.jsx component contains a dictionary that maps badge names to specific colors and icons from the Heroicons library for a visually appealing display.







✨ AI-Powered Features & Smart Tagging
This project integrates modern AI and Natural Language Processing (NLP) to enhance user experience and search functionality.

🤖 Generative AI Integration (Google Gemini)
AI Skill Assistant: A floating chat widget allows users to have a conversation with a Gemini-powered AI. The AI is prompted to be a helpful guide for learning new skills, providing encouragement and information. It is also programmed to reject off-topic questions, keeping the conversation focused.

AI Description Generation: When posting a new skill, users can click a button to have the AI automatically write a friendly and appealing description based on the skill's title and type (Offer/Request). This saves the user time and improves the quality of listings.

Backend Implementation: All AI calls are handled securely through a dedicated backend endpoint (/api/v1/skills/ai-generate). This protects the GOOGLE_API_KEY and allows for complex, context-aware prompts to be sent to the Gemini 1.5 Flash model.

🏷️ Automatic Skill Tagging (NLP)
How it Works: When a user creates a new skill, the backend uses the natural NLP library to analyze the title and description. It performs a TF-IDF (Term Frequency-Inverse Document Frequency) analysis to identify the most important and relevant keywords.

Benefits: The top 5 keywords are automatically saved as "tags" for the skill. This significantly improves the search functionality, allowing users to find relevant skills even if their search query doesn't exactly match the title.