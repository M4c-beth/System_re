# Employee Reimbursement System

A full-stack application for managing employee expense reimbursements with AI-powered receipt processing.

## Prerequisites

Before you begin, ensure you have installed the following:

1. **Node.js and npm**
   - Download and install from [Node.js official website](https://nodejs.org/)
   - Recommended version: 16.0.0 or higher
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **MongoDB**
   - Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Download and install [MongoDB Compass](https://www.mongodb.com/try/download/compass)
   - For Windows users: MongoDB may need to be added to your system's PATH
   - Verify MongoDB is running:
     ```bash
     mongod --version
     ```

3. **Git**
   - Download and install from [Git official website](https://git-scm.com/downloads)
   - Verify installation:
     ```bash
     git --version
     ```

4. **Postman** (optional, for API testing)
   - Download and install from [Postman official website](https://www.postman.com/downloads/)

## Project Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd reimbursement-system
```

### 2. Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the backend directory:
   ```bash
   touch .env
   ```

4. Add the following to .env:
   ```
   PORT=4000
   MONGO_URI=mongodb://localhost:27017/reimbursementDB
   JWT_SECRET=your_secure_secret_here

   ```

### 3. Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the frontend directory:
   ```bash
   touch .env
   ```

4. Add the following to .env:
   ```
   VITE_API_URL=http://localhost:4000/api
   ```

### 4. Database Setup

1. Open MongoDB Compass
2. Click "New Connection"
3. Enter connection string:
   ```
   mongodb://localhost:27017
   ```
4. Click "Connect"
5. Click "Create Database"
6. Enter:
   - Database name: `reimbursementDB`
   - Collection name: `users`
7. Click "Create Database"

## Running the Application

### 1. Start the Backend Server
```bash
cd backend
npm run dev

**### 1.2 This is to start Ai_receipt analyzer**
create another terminal
cd backend/routes
uvicorn receipt_analysis:app --reload.
```
The backend server will start on http://localhost:4000

### 2. Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:5173

### 3. Create a Test User
Using Postman:
1. Create a new POST request
2. URL: `http://localhost:4000/api/auth/register`
3. Set body to raw JSON:
   ```json
   {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
   }
   ```
4. Send the request

### 4. Verify the Application
1. Open http://localhost:5173 in your browser
2. Click "Login"
3. Enter the test user credentials:
   - Email: test@example.com
   - Password: password123
4. You should be redirected to the dashboard upon successful login

## Project Structure

```
reimbursement-system/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── context/
│   └── index.html
└── README.md
```

## Available Features
- User authentication (login/register)
- Protected routes
- Expense dashboard
- Receipt processing with AI (setup required)

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify MongoDB is running
   - Check MongoDB Compass connection
   - Verify MONGO_URI in .env

2. **Frontend can't connect to Backend**
   - Ensure backend is running on port 4000
   - Check VITE_API_URL in frontend .env
   - Verify no CORS issues in browser console

3. **Login Issues**
   - Clear browser cache
   - Check browser console for errors
   - Verify user exists in MongoDB

### Getting Help
If you encounter any issues:
1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed and running
4. Check MongoDB Compass to verify database connection

## Development Notes

- Backend uses Express.js and MongoDB
- Frontend uses React with Vite
- Authentication uses JWT tokens
- Styles use Tailwind CSS
- API documentation available in Postman collection (if provided)

## Security Notes
- Never commit .env files
- Keep MongoDB credentials secure
- Regularly update dependencies
- Use strong JWT secrets
- Follow security best practices

## Contributing
[Add contributing guidelines here]

## License
[Add license information here]
