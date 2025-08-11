
-----

SkillSwap: A Modern Skill Exchange Platform

A feature-rich, full-stack web application built on the MERN stack where users trade skills and knowledge using a virtual credit system.

-----

Live website Link: skilswap.netlify.app

SkillSwap is an innovative, full-stack web application built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It functions as a dynamic marketplace that empowers users to exchange their skills and knowledge through a unique virtual credit system, fostering a vibrant community of collaborative learning and mutual growth.

This project is engineered with a professional, scalable, and maintainable architecture. It integrates a comprehensive suite of modern web technologies, including real-time chat and notifications via WebSockets, secure JWT-based authentication with refresh tokens, and AI-powered features like a skill assistant and content moderation using the Google Gemini API.

### Table of Contents

  * [Live Demo & Screenshots](https://www.google.com/search?q=%23-live-demo--screenshots)
  * [Why SkillSwap?](https://www.google.com/search?q=%23-why-skillswap)
  * [Features In-Depth](https://www.google.com/search?q=%23-features-in-depth)
      * [Core Platform Mechanics](https://www.google.com/search?q=%23-core-platform-mechanics)
      * [User Engagement & Security](https://www.google.com/search?q=%23-user-engagement--security)
      * [Real-time Communication & AI](https://www.google.com/search?q=%23-real-time-communication--ai)
      * [Administration & Moderation](https://www.google.com/search?q=%23-administration--moderation)
  * [Architectural Overview](https://www.google.com/search?q=%23%EF%B8%8F-architectural-overview)
  * [Detailed Project Structure](https://www.google.com/search?q=%23-detailed-project-structure)
      * [Client (React Frontend)](https://www.google.com/search?q=%23client---react-frontend)
      * [Server (Node.js & Express Backend)](https://www.google.com/search?q=%23server---nodejs--express-backend)
  * [API Endpoint Documentation](https://www.google.com/search?q=%23-api-endpoint-documentation)
  * [Tech Stack](https://www.google.com/search?q=%23-tech-stack)
  * [Local Development Setup](https://www.google.com/search?q=%23-local-development-setup)
      * [Prerequisites](https://www.google.com/search?q=%23prerequisites)
      * [Installation & Configuration](https://www.google.com/search?q=%23installation--configuration)
  * [Deployment Guide](https://www.google.com/search?q=%23%EF%B8%8F-deployment-guide)
  * [Contributing](https://www.google.com/search?q=%23-contributing)
  * [License](https://www.google.com/search?q=%23-license)
  * [Contact](https://www.google.com/search?q=%23-contact)

-----

### ✨ Live Demo & Screenshots

**Live Site:** [https://skillswap-demo.netlify.app](https://skillswap-demo.netlify.app) *(Replace with your actual deployed URL)*

| | |
| :---: | :---: |
| *Modern Homepage with Hero Section & CTA* | *Fully Responsive Real-time Chat with Message Selection* |
|  |  |
| *Detailed Skill & User Profile Pages* | *Intuitive User Dashboard with Proposals Management* |
|  |  |

*(To add screenshots: upload your images to a service like [Imgur](https://imgur.com/) and replace the URLs above.)*

-----

### 🤔 Why SkillSwap?

In a world of expensive online courses and passive learning, SkillSwap offers a dynamic, community-driven alternative.

  * **Breaks Financial Barriers:** Instead of money, the currency is your own knowledge. It creates an accessible ecosystem where learning is not limited by a user's financial status.
  * **Fosters Active Learning:** By teaching others, users reinforce their own understanding. This two-way exchange promotes deeper learning and mastery.
  * **Builds Community:** The platform is designed to connect people. From proposals to real-time chat, every interaction is a step towards building a supportive network of learners and mentors.
  * **Modern & Secure:** Built with industry-standard practices, SkillSwap provides a safe, reliable, and modern user experience that users can trust.

-----

### 🌟 Features In-Depth

#### 🛠️ Core Platform Mechanics

  * **Dual Skill Postings**: Users can create two types of listings: **Offers** (skills they are proficient in and willing to teach) and **Requests** (skills they wish to learn from the community).
  * **Credit-Based Economy**: New users are welcomed with 10 "Swap Credits". This initial capital allows them to immediately engage with the platform. They can earn more credits by successfully teaching their skills, creating a balanced and self-sustaining economic model.
  * **Flexible Proposal System**: Users can propose a skill swap in two ways:
    1.  **Credit Offer**: Propose a swap by offering the required number of credits set by the skill provider.
    2.  **Counter-Proposal**: Propose a direct exchange by offering one of their own skills in return, creating a barter-style trade.
  * **Advanced Search & Filtering**: A powerful and multi-faceted search system allows users to find skills with precision. Filters include keywords, category (e.g., 'Technology', 'Arts', 'Languages'), skill level (e.g., 'Beginner', 'Intermediate', 'Advanced'), and geographical location.
  * **Smart Search Suggestions**: The main keyword search bar implements the **Jaro-Winkler distance algorithm** (`p_jaro_winkler`) to provide "Did you mean...?" suggestions for common typos and misspellings, significantly improving the discoverability of skills.

#### 🔐 User Engagement & Security

  * **Secure JWT Authentication**: A robust authentication system using JSON Web Tokens (JWT). It employs a two-token strategy (access and refresh tokens) which are stored in secure, `httpOnly` cookies, preventing XSS attacks. The backend is completely stateless.
  * **OTP Email Verification**: New user registrations are protected by a One-Time Password (OTP) system. Accounts remain inactive and are not publicly visible until the user verifies their email address, effectively preventing spam and bot-driven account creation.
  * **Secure Account Recovery**: A complete "Forgot Password" and "Change Email" workflow, both secured via OTPs sent to the user's registered email, ensuring that only the legitimate owner can make critical account changes.
  * **Comprehensive User Profiles**: Rich, publicly viewable profiles that act as a user's portfolio, showcasing their offered skills, a detailed bio, links to social media or professional sites, and a collection of earned achievement badges.
  * **Customizable Avatars**: Users can personalize their identity by uploading a custom profile picture via a seamless Cloudinary integration. If no picture is uploaded, a stylish, deterministic initial-based avatar is generated using the DiceBear API.

#### 🤖 Real-time Communication & AI

  * **Real-time User-to-User Chat**: A fully-featured, responsive, real-time chat system built with Socket.IO. It becomes available after a skill swap proposal is accepted, providing a dedicated channel for communication.
      * **Instant Message Delivery**: Leveraging WebSockets for low-latency, bidirectional communication.
      * **Multi-Message Selection**: Users can long-press (mobile) or right-click (desktop) to enter a selection mode, allowing for the deletion of multiple messages at once.
      * **Chat Management**: A three-dot menu within the chat provides options for clearing the entire chat history and reporting the other user.
  * **Live Notifications**: Users receive instant, real-time notifications for critical events such as new proposals on their skills, acceptance of their proposals, and account warnings, all without needing to refresh the page.
  * **Unread Message Counts**: The main navigation bar and the conversation list in the chat interface display a live, real-time count of unread messages, ensuring users never miss a conversation.
  * **AI Skill Assistant**: A floating chatbot powered by the **Google Gemini API** that acts as a helpful guide. It can answer user questions about different skills, suggest learning paths, and provide information available on the platform.
  * **AI Content Moderation**: To maintain a safe and focused learning environment, the AI automatically filters user searches for YouTube tutorials to block inappropriate, harmful, or off-topic queries.

#### 🛡️ Administration & Moderation

  * **Multilingual Profanity Filter**: The user-to-user chat automatically detects and censors abusive language in multiple languages (English, Hindi, Kannada) using a professional-grade filtering library (`bad-words`).
  * **Automated Reporting System**: A community-powered moderation system. Users can report others for inappropriate behavior. The system automatically issues a warning notification after 2 unique reports and permanently deletes the offending user's account and all associated content after 5 unique reports.
  * **Automated Database Cleanup**: A scheduled cron job runs daily (using `node-cron`) to automatically purge unverified user accounts that are older than 3 days, maintaining database hygiene and efficiency.
  * **Admin Role**: A built-in `admin` role in the User schema allows for future extensibility, such as a dedicated admin dashboard for managing users, reports, site content, and platform analytics.

-----

### 🏗️ Architectural Overview

This project follows a professional, scalable MERN stack architecture, emphasizing a clean separation of concerns between the frontend and backend.

  * **Stateless Backend API**: The Express.js server is designed to be completely stateless. User authentication is managed via JWTs sent in `httpOnly` cookies, meaning the server doesn't need to store session information. This makes the backend highly scalable and robust.
  * **Centralized API Logic**: All backend business logic is encapsulated within controllers, keeping the route definitions clean and readable. The `asyncHandler` utility ensures that all asynchronous errors are caught and passed to a centralized error handler, preventing server crashes.
  * **Component-Driven Frontend**: The React application is built using a modular, component-based architecture. Reusable components are organized by feature, making the codebase easy to navigate, maintain, and extend.
  * **Global State Management with Context API**: React's Context API is used for managing global state like user authentication, the WebSocket connection, and theme settings. This avoids prop-drilling and provides a clean way to share state across the application.
      * `AuthContext` holds the user's authentication status, profile data, and the global unread message count.
      * `SocketContext` establishes a single, persistent WebSocket connection upon user login, which is then available to any component that needs real-time functionality.

-----

### 📁 Detailed Project Structure

```
skillswap/
├── client/             # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/        # Centralized Axios instance
│   │   ├── assets/     # Images, fonts, etc.
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # Global state management (Auth, Socket, Theme)
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Top-level page components
│   │   ├── utils/      # Helper functions
│   │   ├── App.jsx     # Main router setup
│   │   └── main.jsx    # Application entry point
│   ├── .env            # Frontend environment variables
│   └── package.json
└── server/             # Node.js/Express Backend
    ├── src/
    │   ├── config/     # Database connection
    │   ├── constants/  # Application constants
    │   ├── controllers/# Business logic for each route
    │   ├── middlewares/# Custom middleware (e.g., auth)
    │   ├── models/     # Mongoose data schemas
    │   ├── routes/     # API route definitions
    │   ├── socket/     # Socket.IO server logic
    │   ├── utils/      # Utility classes and functions (ApiError, etc.)
    │   └── cronJobs.js # Scheduled tasks
    ├── .env            # Backend environment variables
    ├── seed.js         # Database seeder script
    ├── server.js       # Main server entry point
    └── package.json
```

#### `client/` - React Frontend

The client is a modern Single-Page Application (SPA) bootstrapped with Vite for a fast development experience.

  * **`src/api/axios.js`**: A centralized Axios instance configured with a request interceptor to automatically attach the JWT access token to the headers of every outgoing API request.
  * **`src/context/`**: The core of the frontend's state management. `AuthContext` handles user data, `SocketContext` manages the single WebSocket connection, and `ThemeContext` handles light/dark mode.
  * **`src/hooks/useListenMessages.js`**: An example of a custom hook that encapsulates the logic for listening to real-time chat messages from the Socket.IO server, demonstrating a clean and reusable approach to handling real-time events.

#### `server/` - Node.js & Express Backend

The server is a robust REST API designed for security, efficiency, and scalability.

  * **`server.js`**: The main application entry point. It initializes the Express app, configures middleware (CORS, cookieParser, etc.), connects to MongoDB, attaches the Socket.IO server, and starts listening for HTTP requests.
  * **`socket/socket.js`**: This file exports a singleton instance of the Socket.IO server, ensuring that the same instance is used across the application for both chat and notifications. It also contains the logic for managing online users.
  * **`middlewares/auth.middleware.js`**: Contains the critical `verifyJWT` middleware. It extracts the JWT from the `httpOnly` cookie, verifies its signature, and attaches the decoded user payload to the `req` object, protecting secure routes.
  * **`utils/`**: A collection of powerful helper utilities.
      * `asyncHandler.js`: A higher-order function that wraps async controller functions in a `try...catch` block, forwarding any errors to the global error handler.
      * `ApiError.js` & `ApiResponse.js`: Standardized classes for creating consistent error and success JSON responses across the entire API.
      * `cronJobs.js`: Defines the cron job for daily cleanup of unverified users.

-----

### Endpoints-arrow API Endpoint Documentation

All endpoints are prefixed with `/api/v1`.

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| **Auth** | | | |
| `POST` | `/users/register` | Register a new user. | No |
| `POST` | `/users/verify-otp` | Verify email with OTP. | No |
| `POST` | `/users/login` | Log in a user. | No |
| `POST` | `/users/logout` | Log out a user. | Yes |
| `POST` | `/users/refresh-token` | Obtain a new access token. | No (uses refresh token) |
| `POST` | `/users/forgot-password` | Request a password reset OTP. | No |
| `POST` | `/users/reset-password` | Reset password with OTP. | No |
| **Users** | | | |
| `GET` | `/users/profile/:username` | Get a user's public profile. | No |
| `PATCH`| `/users/update-profile`| Update authenticated user's profile. | Yes |
| `PATCH`| `/users/update-avatar`| Update user's avatar image. | Yes |
| `POST` | `/users/change-password`| Change authenticated user's password. | Yes |
| **Skills** | | | |
| `POST` | `/skills` | Create a new skill (Offer or Request). | Yes |
| `GET` | `/skills` | Get all skills with filtering/pagination. | No |
| `GET` | `/skills/:id` | Get a single skill by its ID. | No |
| `PATCH`| `/skills/:id` | Update a skill owned by the user. | Yes |
| `DELETE`| `/skills/:id` | Delete a skill owned by the user. | Yes |
| **Proposals**| | | |
| `POST` | `/proposals` | Create a new proposal for a skill. | Yes |
| `GET` | `/proposals/received`| Get all proposals received by the user. | Yes |
| `GET` | `/proposals/sent` | Get all proposals sent by the user. | Yes |
| `PATCH`| `/proposals/:id/status` | Accept or reject a proposal. | Yes |
| **Messages**| | | |
| `POST` | `/messages/send/:receiverId` | Send a message to a user. | Yes |
| `GET` | `/messages/:userId` | Get chat history with a specific user. | Yes |
| `GET` | `/messages/conversations` | Get all user conversations. | Yes |
| `DELETE`| `/messages/delete`| Delete selected messages. | Yes |

-----

### 💻 Tech Stack

A curated list of the technologies and services that power SkillSwap.

**Frontend:**

  * **Framework/Library:** React.js (v18) & Vite
  * **Styling:** Tailwind CSS with PostCSS
  * **Routing:** React Router DOM (v6)
  * **State Management:** React Context API + Hooks
  * **Real-time:** Socket.IO Client
  * **API Communication:** Axios
  * **Date/Time:** date-fns
  * **UI Components:** Headless UI, Heroicons

**Backend:**

  * **Runtime:** Node.js
  * **Framework:** Express.js
  * **Real-time:** Socket.IO
  * **Authentication:** JSON Web Tokens (JWT), bcryptjs
  * **Database:** MongoDB with Mongoose ODM
  * **File Uploads:** Multer & Cloudinary
  * **Email Service:** SendGrid
  * **AI:** Google Gemini API
  * **Scheduling:** node-cron

**Database:**

  * **MongoDB Atlas** (Cloud-hosted NoSQL Database)

-----

### 🚀 Local Development Setup

Follow these instructions to get a local copy of SkillSwap up and running on your machine.

#### Prerequisites

Make sure you have the following software installed on your system:

  * [Node.js](https://nodejs.org/) (v18 or higher is recommended)
  * [npm](https://www.npmjs.com/) (usually comes with Node.js)
  * A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or a local MongoDB instance.
  * [Git](https://git-scm.com/) for version control.

#### Installation & Configuration

1.  **Clone the repository:**

    ```sh
    git clone https://github.com/your-username/skillswap.git
    cd skillswap
    ```

2.  **Install Backend Dependencies:**
    Navigate to the server directory and install the required npm packages.

    ```sh
    cd server
    npm install
    ```

3.  **Install Frontend Dependencies:**
    In a separate terminal, navigate to the client directory and install its dependencies.

    ```sh
    cd ../client
    npm install
    ```

4.  **Set Up Server Environment Variables:**

      * In the `/server` directory, create a new file named `.env`.
      * Copy the contents of `.env.example` (if provided) or add the variables from the table below.
      * Fill in the values for your local setup (MongoDB URI, secrets, API keys).

5.  **Set Up Client Environment Variables:**

      * In the `/client` directory, create a new file named `.env`.
      * Add the `VITE_API_BASE_URL` variable, pointing to your local backend server.

6.  **Seed the Database (Optional):**
    You can seed the database with a default admin user by running the seed script from the `/server` directory.

    ```sh
    # Make sure your server .env is configured first
    npm run seed
    ```

7.  **Run the Development Servers:**

      * In the `/server` terminal: `npm run dev` (This will start the backend, typically on `http://localhost:8000`)
      * In the `/client` terminal: `npm run dev` (This will start the React Vite server, typically on `http://localhost:5173`)

You should now be able to access the SkillSwap application in your browser at `http://localhost:5173`.

#### 🔑 Environment Variables

##### Server (`/server/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | The port the backend server will run on. | `8000` |
| `MONGODB_URI`| Your connection string for the MongoDB database. | `mongodb+srv://...` |
| `CORS_ORIGIN`| The URL of your frontend for CORS policy. | `http://localhost:5173` |
| `ACCESS_TOKEN_SECRET` | A long, random, secret string for JWTs. | `a-very-long-random-secret` |
| `ACCESS_TOKEN_EXPIRY` | How long the access token should last. | `1d` |
| `REFRESH_TOKEN_SECRET`| Another long, random, secret string. | `another-very-long-secret` |
| `REFRESH_TOKEN_EXPIRY`| How long the refresh token should last. | `10d` |
| `SENDGRID_API_KEY` | Your API key from SendGrid for sending emails. | `SG.xxxxxxxx` |
| `CLOUDINARY_CLOUD_NAME`| Your Cloudinary cloud name. | `your-cloud-name` |
| `CLOUDINARY_API_KEY`| Your Cloudinary API key. | `1234567890` |
| `CLOUDINARY_API_SECRET`| Your Cloudinary API secret. | `a-b-c-d-e-f` |
| `GOOGLE_API_KEYs` | Your API key from Google AI Studio. | `AIzaSy...` |

##### Client (`/client/.env`)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | The full URL of your backend API. | `http://localhost:8000/api/v1` |

-----

### ☁️ Deployment Guide

This project is structured for a seamless and professional deployment experience.

#### Backend (`/server`)

The Node.js server is ready for deployment on services like **Render**, **Railway**, or any platform that supports Node.js applications.

1.  **Push your code** to a GitHub repository.
2.  **Create a new "Web Service"** on Render (or equivalent).
3.  **Connect your GitHub repository**.
4.  **Configure the build and start commands:**
      * **Build Command:** `npm install`
      * **Start Command:** `npm start`
5.  **Add all the environment variables** from your `.env` file to the platform's secret/environment variable settings.
6.  **Deploy\!** Render will automatically build and deploy your application. Note the live URL of your backend.

#### Frontend (`/client`)

The React client is a static application and can be deployed to services like **Netlify**, **Vercel**, or **GitHub Pages**.

1.  **Push your code** to the same GitHub repository.
2.  **Create a new "Site"** on Netlify (or equivalent).
3.  **Connect your GitHub repository**.
4.  **Configure the build settings:**
      * **Base directory:** `client`
      * **Build command:** `npm run build`
      * **Publish directory:** `client/dist`
5.  **Add your production environment variable:**
      * `VITE_API_BASE_URL` = https://skillswap-production-32b3.up.railway.app
6.  **Deploy\!** Netlify will build your React app and deploy the static files globally.


### 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.

-----

### 📞 Contact
anish shetty - anishshetty124@gmail.com

Project Link: https://github.com/Anishshetty124/skillswap.git

