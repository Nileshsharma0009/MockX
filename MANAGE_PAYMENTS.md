# Manage Payments and Mock Access

This guide explains how to enable/disable payments globally and how to set specific mocks as Free or Paid.

## 1. Global Payment Toggle
You can turn off the payment requirement for the entire application.

### To DISABLE Payments (Make Everything Free)
1.  **Frontend**: Open `frontend/web/.env` and set:
    ```
    VITE_PAYMENTS_ENABLED=false
    ```
2.  **Backend**: Open `backend/.env` and set:
    ```
    PAYMENTS_ENABLED=false
    ```
3.  **Restart**: You must stop and restart both `npm run dev` servers for this to take effect.

### To ENABLE Payments (Require Purchase)
1.  **Frontend**: Set `VITE_PAYMENTS_ENABLED=true`.
2.  **Backend**: Set `PAYMENTS_ENABLED=true`.
3.  **Restart** both servers.

---

## 2. Managing Individual Mocks (Free vs Paid)
If payments are **ENABLED**, you can still make specific mocks (e.g., Mock 2) free.

### Step 1: Update Frontend (The Visuals)
This ensures the "Start Test" button appears instead of the "Lock" icon.

1.  Open `frontend/web/src/data/mocktest.js`.
2.  Find the mock you want to change.
3.  Set `isFree: true` for free, or `isFree: false` for paid.

```javascript
  {
    id: 2,
    title: "Mock Test 2",
    // ...
    isFree: true,  // <--- Shows "Start Test"
  },
```

### Step 2: Update Backend (The Security)
This ensures the server allows access to the questions.

1.  Open `backend/seedMocks.js`.
2.  Find the corresponding mock (e.g., `imu2`).
3.  Set `isFree: true`.

```javascript
  {
    _id: "imu2",
    // ...
    isFree: true,
  },
```

4.  **Run the Seed Script**:
    You must apply this change to the database by running:
    ```bash
    cd backend
    node seedMocks.js
    ```
    *(Wait for "✅ Mocks seeded successfully" message)*

### Step 3: Update Fallback (Optional but Recommended)
This safeguards the app in case the database connection fails.

1.  Open `backend/src/controllers/mock.controller.js`.
2.  Update the `FALLBACK_MOCKS` object:
    ```javascript
    "imu2": { exam: "imucet", isFree: true },
    ```
