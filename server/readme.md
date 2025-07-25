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

##### **Frontend Implementation (`ProfilePage.jsx`)**
-   **Dynamic Routing**: The component uses the `useParams` hook from `react-router-dom` to get the `username` from the URL, allowing it to display any user's profile.
-   **Data Fetching**: A `useEffect` hook triggers an API call to the new endpoint when the component mounts or the `username` in the URL changes.
-   **Component Reusability**:
    -   It reuses the `<SkillCard />` component to display the list of skills offered by the user.
    -   A new `<ReviewCard />` component was created to neatly display individual reviews, including a star rating visual.
-   **Default Profile Picture**: If a user hasn't uploaded a profile picture, a default image is generated using the `dicebear.com` API based on the user's initials, preventing broken images.

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