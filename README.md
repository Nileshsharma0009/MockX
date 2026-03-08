# MockX - Project Documentation

Welcome to the **MockX** project! This document serves as a complete guide for junior developers and new team members joining the project. It covers our tech stack, how the project is structured, how the frontend and backend interact, and the roles of key files and functions.

---

## 🚀 Project Overview
**MockX** is a full-stack web application designed as an advanced Mock Testing Platform (similar to those used for IMU CET, and other competitive exams). It features user authentication, a live test-taking interface with an accurate timer, automatic background saving, real-time grading, payment gateway integration, and result analysis.

---

## 🛠 Tech Stack

### **Frontend** (in `/frontend/web/`)
- **React.js (Vite)**: For building the fast, reactive UI.
- **Tailwind CSS**: For all styling, layout, and responsive UI.
- **React Router DOM**: For client-side routing.
- **Context API (`TestContext.jsx`)**: For global state management of the test session.
- **Axios**: For structured API requests to the backend.
- **PDF Export**: Uses `html2pdf.js` & `jspdf` for printing results.

### **Backend** (in `/backend/`)
- **Node.js & Express.js**: For managing API routes and HTTP requests.
- **MongoDB & Mongoose**: For the NoSQL database to store users, questions, attempting states, and final results.
- **JWT & Cookie Parser**: For secure user authentication. Cookies are used to maintain session state securely across requests.
- **Google Gemini AI**: For external AI integrations/prompts.
- **Razorpay**: For handling user payments for mock exams.
- **Resend/SIB API**: For sending transactional emails (e.g., email verification).

---

## 📂 Project Structure & Key Files

### Backend Directory structure (`/backend/src/`)
Our backend is structured into clear MVC (Model-View-Controller) layers.
- **`app.js`**: The main Express server configuration. It imports all routes, sets up CORS to accept requests from our frontend (e.g., `http://localhost:5173`), and initializes middlewares (`cookie-parser`, `express.json`).
- **`index.js`**: The entry point that actually starts the Node.js server.
- **`/routes/`**: Connects URL paths to the Controller logic.
  - `auth.routes.js`: Maps endpoints like `/api/auth/signup` and `/api/auth/login` to authentication controllers.
  - `test.routes.js`: Maps `/api/tests/submit` and `/api/tests/save` to logic for saving answers in progress and submitting the final test.
  - `mock.routes.js`: Maps `/api/mocks/:mockId/questions` to logic for fetching tests.
  - `payment.routes.js` & `ai.routes.js` & `result.routes.js`: Handle specialized endpoints.
- **`/controllers/`**: The core business logic for each route.
  - `auth.controller.js`: Has functions like `login`, `signup`, `logout`. Handles generating the JWT token and attaching it to the `res.cookie()`.
  - `test.controller.js`: Has `saveProgress` (constantly writes answered options to DB) and `submitTest` (evaluates score, creates result record).
- **`/models/`**: Defines MongoDB Schemas.
  - `user.model.js`: Stores user detail, hashed password, purchased exams.
  - `question.model.js`: Stores question text, section (A/B), subjects, 4 options, and correct answers.
  - `mock.model.js`: Defines the test metadata (Id, Title, Free/Paid status).
- **`/middleware/`**: Functions that run before a controller. 
  - `auth.middleware.js`: Evaluates if the incoming cookie contains a valid JWT. If so, it allows proceeding; if not, it blocks unauthorized access.

### Frontend Directory structure (`/frontend/web/`)
- **`src/App.jsx`**: Our main routing and test-taking interface. It fetches questions from the API, manages test timer, auto-saves progress every 5 seconds (to avoid data loss), and auto-submits when the time is up. 
- **`src/api/api.js`**: Highly important configuration file. It creates an Axios instance pointing to the backend (`VITE_API_BASE` or `localhost:5000`) and has `withCredentials: true`. This is required to send the JWT Cookie back and forth automatically!
- **`src/context/TestContext.jsx`**: Centralized state that holds the `questions`, `selectedOptions`, and `timer` for the test.
- **`src/components/`**: Reusable UI components. The heavier components are lazily loaded.
  - `Navbar`, `Timer`, `QuestionPanel`, `Sidebar` (for quick navigation), `ControlsBar` (submit functions).
- **`src/pages/`**: Main views like Dashboard, ResultPage (which has a custom `ResultPage.css`), Test Instructions.

---

## 🔗 How Frontend and Backend Talk (Request Flow)

Let's break down how we fetch the test questions when a user clicks 'Start Test'.

1. **Frontend Request Initiation**:
   - In `App.jsx`, a React `useEffect` runs on mount.
   - It observes the URL (e.g., `?mock=imu1`).
   - It fires `fetch('http://localhost:5000/api/mocks/imu1/questions', { credentials: "include" })`. Notice `credentials: include`. This forces the browser to send our Auth Cookies to the backend.
   
2. **Backend Route Listening**:
   - The request hits backend `app.js`, which routed `/api/mocks` to `mockRoutes`.
   - `mock.routes.js` listens to `/:mockId/questions` and fires the `optionalAuth` middleware, followed by `getMockQuestions` controller.

3. **Backend Controller execution**:
   - `getMockQuestions` (in `mock.controller.js`) looks up the mock Test properties in the `Mock` collection.
   - It finds all Questions linked to `mockId` in the `Question` collection.
   - **Crucially**, it securely removes the `correctOption` before sending it to the user so no browser developer tool cheating can happen.

4. **Response returned**:
   - JSON array of questions is dispatched back to the frontend.
   - `App.jsx` receives it, randomizes it via `shuffleWithGroups`, and adds it to `TestContext.jsx`. The UI is then rendered.

---

## 🔄 Auto-Save Flow (Real-Time Saving)
Because internet connections can drop out, we implement an **Auto-Save feature**.

1. As the user clicks options, `TestContext` state updates.
2. In `App.jsx`, a `setInterval` runs every 5 seconds.
3. It validates `computeCurrentAnswers()` against `lastSavedData`.
4. If there are enough changes (Threshold > 25 changes or periodically), it fires `saveProgress({ mockId, answers: delta })` using `axios` in `api.js`.
5. Backend (`test.controller.js -> saveProgress`) updates and merges these answers into the user’s `TestAttempt` document.

---

## 🏃‍♂️ How to Run the Project Locally

To run the project for development:

**1. Run the Backend:**
Open a terminal in the backend directory.
```bash
cd backend
npm install
npm run dev
```
*(Ensure you have your backend `.env` file set up properly using the variables found in `env.template`)*

**2. Run the Frontend:**
Open a separate terminal in the frontend directory.
```bash
cd frontend/web
npm install
npm run dev
```
*(Ensure your `.env.local` or `.env` points `VITE_API_BASE=http://localhost:5000`)*

---

## 💡 Best Practices for Junior Devs

1. **Do not put secure tokens or answers in Frontend**: Always use backend models properly. Passwords must go through `bcryptjs`. We also never send the `correctOption` field from `question.model` explicitly back to the frontend until result generation time.
2. **Adding a new endpoint:**
   - First, add the functionality logic to a backend Controller.
   - Map it in the backend Router.
   - Create an export function in frontend `src/api/api.js`.
   - Use that function in your React component.
3. **Styling Components:** Try to use Tailwind utility classes directly on components instead of making new CSS files to avoid stylesheet conflicts (except for complex parts like `ResultPage.css`).
4. **Cookies/Axios Setting**: Keep `{ withCredentials: true }` in your axios functions, otherwise routing protective paths (via `auth.middleware.js`) will block the user as `Unauthorized`.

Welcome aboard and happy coding! 🚀
