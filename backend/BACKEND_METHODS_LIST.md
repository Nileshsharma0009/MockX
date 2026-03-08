# 🛠️ Backend Methods, Functions, and Queries

This document contains a comprehensive list of the core methods, database queries, Express functions, and JavaScript features used across the **MockX Backend**. This is a great reference for junior developers to understand exactly what tools construct our API layer.

---

## 1. 🌐 Express Core & Middleware (Server Level)
Found mainly in `app.js` and `index.js`, these functions build and configure the HTTP server.

* **`express()`**: The main function that initializes our Express application.
* **`app.use(middleware)`**: Mounts middleware functions or Routers at the specified path. It’s used to apply global logic.
* **`express.json()`**: Built-in middleware that parses incoming request payloads containing JSON into `req.body`.
* **`app.get(path, controller)` / `app.post(path, controller)`**: Defines endpoints that listen for GET and POST HTTP requests.
* **`cors({ origin, credentials })`**: Third-party middleware to handle Cross-Origin Resource Sharing. Allows our specific frontend URLs to access the backend API.
* **`cookieParser()`**: Middleware that parses the HTTP `Cookie` header so we can read secure auth cookies via `req.cookies`.
* **`express.Router()`**: Creates modular, mountable route handlers (e.g., `authRouter`).

---

## 2. 🗄️ Database: Mongoose & MongoDB (Models & Queries)
Found in `/models` and `/controllers`. Mongoose handles the Data layer.

### Model Definitions & Types
* **`new mongoose.Schema({ ... })`**: Defines the blueprint (Schema) for documents in a MongoDB collection.
* **`mongoose.model('Name', Schema)`**: Compiles the Schema into an interactive Model (e.g., `User`, `Question`).
* **Types used**:
  * `String`, `Number`, `Boolean`, `Date`: Standard Data Types.
  * `[String]`: Represents an Array of Strings (e.g., `options: [String]`, `purchasedExams: [String]`).
* **Modifiers**:
  * `required: true`: Ensures a field cannot be empty.
  * `unique: true`: Enforces a database-level unique index (e.g., `email`).
  * `enum: ["val1", "val2"]`: Ensures a field only matches specific strings (e.g., user `role`).
  * `select: false`: Prevents a field from being automatically returned in queries (used to hide `correctOption` from the frontend).

### Mongoose Database Query Methods
* **`Model.create({ data })`**: Instantiates and saves a new document directly to the database in one step (used in `signup` and creating a new `Result`).
* **`Model.findOne({ condition })`**: Finds and returns the first single document that matches the given condition (e.g., finding a User by `email`).
* **`Model.findById(id)`**: Quickly looks up a document based on its unique MongoDB `_id` string.
* **`Model.find({ condition })`**: Retrieves all documents that match a query (e.g., getting all questions for a specific `mockId`).
* **`document.save()`**: Saves any mutated fields on a document back to the database (used in `saveProgress` and when pushing `purchasedExams`).

### Query Operators & Modifiers
* **`$in`**: MongoDB operator used to match fields against an array of valid targets (`{ questionCode: { $in: [codes...] } }`).
* **`.select("+fieldName")` / `.select("-fieldName")`**: Forces specific fields to be explicitly included (`+`) or excluded (`-`) in the query response.
* **`.populate("refId", "fields")`**: Swaps out a reference ID (like `userId` in Results) with the actual document object of that User.
* **`.sort({ field: -1 })`**: Orders the query results (e.g., `-1` for descending/newest first).

---

## 3. 🔐 Security & Utility Functions
* **`bcrypt.hash(password, saltRounds)`**: Asynchronously hashes a plain-text password securely before saving it to DB.
* **`bcrypt.compare(plain, hash)`**: Checks if the login attempt password matches the stored DB hash.
* **`res.cookie(name, value, options)`**: Attaches a cookie (our JWT token) to the HTTP response header. Configured with `httpOnly: true` so Javascript can't steal it, and `secure: true` for HTTPS.
* **`res.clearCookie(name)`**: Destroys the cookie in the user's browser, effectively logging them out.
* **`crypto.createHmac("sha256", secret)`**: (Node.js built-in) Creates a cryptographic HMAC hash. Used to verify that Razorpay Webhooks are legitimate and untampered with.
* **`Object.keys(obj)` / `Object.entries(obj)`**: Native JS data manipulation to turn objects into iterable arrays (used to count answers and score tests in `saveProgress` / `submitTest`).

---

## 4. 🎮 Controller Functions (Our Custom Business Logic)

These are the main Javascript asynchronous functions written by our team to bridge Routes and Models:

* **Authentication (`auth.controller.js`)**
  * `register()` / `signup()`: Handles creating the user record in MongoDB and returning a session cookie.
  * `login()`: Validates password via bcrypt and returns JWT cookie.
  * `logout()`: Clears the attached session cookie.
  
* **Assessments & Tests (`test.controller.js`, `mock.controller.js`)**
  * `getMockQuestions()`: Looks up a Mock, checks if user has access to it, drops the correct answers for security, and sends the questions payload.
  * `saveProgress()`: Intercepts partial answers and actively merged them into a drafting `Result` database record (`isSubmitted: false`).
  * `submitTest()`: The scoring engine. Matches user answers against real question data in a unified mapping algorithm to calculate final marks.

* **Results & Profiles (`result.controller.js`)**
  * `getMyResults()`: Fetches array of past attempts sorted by date.
  * `getResultByMock()`: Retrieves user's specific performance on a Mock exam instance.
  
* **Payments (`payment.controller.js`)**
  * `createOrder()`: Initiates a Razorpay payment intent from our backend.
  * `razorpayWebhook()`: Listens for events from Razorpay indicating a payment was fully captured, then grants the user permissions to the exam.
