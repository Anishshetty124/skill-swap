
# SkillSwap 🔁  
**Trade What You Do, Learn What You Don't**

A modern, collaborative platform where users exchange skills instead of money. Users can showcase skills, request mentorship, and earn credits through sharing knowledge — making learning accessible and community-driven.

---

## 🚀 Live Demo  
🌐 [View Live Project](https://your-deployed-url.com) *(Replace with your deployed URL if available)*

---

## 🛠️ Technologies Used

### Frontend
- **Vite** – Fast dev server and build tool for React
- **React.js** – Component-based UI library
- **Tailwind CSS** – Utility-first CSS framework
- **Heroicons** – Icon set for UI elements

### Backend
- **Node.js** – JavaScript runtime for backend
- **Express.js** – Web framework for Node.js
- **MongoDB** – NoSQL database for storing user and skill data
- **Mongoose** – ODM for MongoDB in Node.js

### Others
- **JWT (JSON Web Token)** – Secure user authentication
- **Axios** – Promise-based HTTP client
- **dotenv** – Manage environment variables
- **React Context API** – Manage global state (e.g., authentication)
- **React Hot Toast** – Beautiful notifications

---

## ✨ Features

- 🔐 **Secure Authentication** – Register, login, and logout using secure cookies (JWT)
- 👤 **User Profiles** – Create, view, edit, and personalize your user profile
- 📚 **Skill Listings** – Add, edit, delete skills you can teach or want to learn
- 💬 **Skill Proposals** – Send/receive requests to teach or learn specific skills
- 💾 **Bookmark Skills** – Save your favorite or most relevant skills for future reference
- ⭐ **Ratings and Reviews** – Rate users and write feedback after sessions
- 📍 **Nearby Skill Discovery** – Suggest skills based on user location
- 🌙 **Theme Toggle** – Switch between light and dark mode
- 📊 **Skill Recommendations** – Get personalized suggestions

---

## 📸 Screenshots

> Replace below with actual screenshots from the project

![Home Page](screenshots/home.png)
![Skill Detail](screenshots/skill-detail.png)
![Profile Page](screenshots/profile.png)

---

## 📂 Folder Structure

```plaintext
skillswap/
├── client/                  # Frontend (React + Vite)
│   ├── public/              # Static assets (icons, manifest)
│   ├── src/                 # Source files
│   │   ├── App.jsx          # Main app component with routes
│   │   ├── main.jsx         # React root rendering file
│   │   ├── index.css        # Global Tailwind styles
│   │   └── ...              # Components, pages, context etc.
│   ├── tailwind.config.js   # Tailwind CSS config
│   ├── vite.config.js       # Vite config
│   ├── .env.local           # Local env file for frontend
│   └── package.json         # Frontend dependencies and scripts
│
├── server/                  # Backend (Express + MongoDB)
│   ├── config/
│   │   └── db.js            # MongoDB connection setup
│   ├── controllers/         # Controller logic for routes
│   │   ├── skill.controller.js
│   │   ├── proposal.controller.js
│   │   └── user.controller.js
│   ├── models/              # Mongoose schemas
│   │   ├── skill.model.js
│   │   ├── proposal.model.js
│   │   └── user.model.js
│   ├── routes/              # Express route handlers
│   │   ├── skill.routes.js
│   │   ├── proposal.routes.js
│   │   └── user.routes.js
│   ├── middlewares/         # Auth and error middlewares
│   │   └── auth.middleware.js
│   ├── utils/               # Utility functions
│   │   ├── asyncHandler.js
│   │   ├── ApiError.js
│   │   └── ApiResponse.js
│   ├── .env                 # Backend env variables (JWT secret, DB URI)
│   ├── server.js            # Express server entry point
│   └── package.json         # Backend dependencies and scripts
```

---

## ⚙️ Key File Descriptions

### Frontend

- `App.jsx`: Sets up main routes and layout
- `main.jsx`: Mounts the React app to the DOM
- `index.css`: Global Tailwind CSS styles
- `.env.local`: Stores API base URLs and config
- `vite.config.js`: Vite development configuration
- `public/logo.png`: App logo used in manifest and header

### Backend

- `server.js`: Entry point to spin up Express server and connect DB
- `db.js`: Connects to MongoDB using Mongoose
- `auth.middleware.js`: Verifies JWT token from cookies
- `user.controller.js`: Handles registration, login, profile routes
- `skill.controller.js`: Logic for managing skills (add/edit/delete/search)
- `proposal.controller.js`: Handles sending, receiving, and managing proposals
- `user.model.js`: Mongoose schema for user data
- `ApiResponse.js`: Custom wrapper for success responses
- `ApiError.js`: Custom wrapper for error responses

---

## 🛠️ Setup Instructions

### 📦 Backend Setup

```bash
cd skillswap/server
npm install
cp .env.example .env  # Fill DB_URI, JWT_SECRET, etc.
npm run dev           # Start server on default port 8000
```

### 💻 Frontend Setup

```bash
cd skillswap/client
npm install
cp .env.example .env.local  # Set VITE_API_URL=http://localhost:8000
npm run dev                 # Runs dev server on port 5173
```

---

## 📄 .env Configuration

### Backend `.env`

```env
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Frontend `.env.local`

```env
VITE_API_URL=http://localhost:8000
```

---

## 🤝 Contribution Guidelines

We welcome contributions!

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Create a pull request

---

## 📝 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for more details.

---

> 💬 _Join a future where skills are the currency. Teach, learn, and grow together with SkillSwap._


---

## 📘 Frontend Reference (from client/README.md)

This project uses the official Vite + React template, allowing blazing-fast HMR and modern development experience.

Key features mentioned:
- Uses either Babel or SWC via Vite plugins for React Fast Refresh
- Includes basic ESLint rules
- Ideal for expanding into a full-fledged SPA (Single Page Application)

Useful links:
- [Vite Plugin React (Babel)](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
- [Vite Plugin React SWC](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)

---

## 🧪 Backend API Reference (from server/readme.md)

### 🔐 User Authentication Endpoints

**1. Register User**  
`POST /api/v1/users/register`  
Request:
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```
Response:
```json
{
  "statusCode": 201,
  "data": {
    "_id": "...",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**2. Login User**  
`POST /api/v1/users/login`  
Returns JWT cookie and user data.

**3. Get Current User Profile**  
`GET /api/v1/users/me`  
Requires auth. Returns the logged-in user details.

**4. Update Profile**  
`PUT /api/v1/users/me`  
Allows updating user info and preferences.

*(More endpoints for skills, proposals, and bookmarks exist in /api/v1/skills and /api/v1/proposals)*

---

## 📜 Notes

- All responses are wrapped with custom `ApiResponse` or `ApiError` classes.
- Error handling and async middleware (`asyncHandler`) is used across all routes.
- Passwords are hashed using bcrypt before storing in MongoDB.
- Skill matching and recommendation logic is handled in the backend.

---

## ✅ Best Practices Followed

- ✅ Modular folder structure (MVC + utils + middleware)
- ✅ Secure cookie-based authentication (httpOnly, sameSite, secure)
- ✅ Environment-based configuration via dotenv
- ✅ Responsive frontend with dark mode and transitions
- ✅ RESTful API design and versioned endpoints
- ✅ Clear separation between client and server

---

## 📫 Contact

For any queries or feedback, feel free to open an issue or reach out on [LinkedIn](https://linkedin.com).

