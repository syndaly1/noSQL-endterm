# Syndaly Yerzhan SE-2424 
# Fantasy Book Library — Endterm Project (Advanced Databases / NoSQL)

## Project Overview

**Fantasy Book Library** is a full-stack web application developed as an endterm project for the course **Advanced Databases (NoSQL)**.

The project demonstrates practical usage of **MongoDB** as a NoSQL database together with a **Node.js + Express.js** backend and a simple frontend built with **HTML, CSS, and JavaScript**.

The application allows users to:
- browse a fantasy book catalog,
- search, filter, and sort books,
- create and manage book entries,
- authenticate using sessions,
- interact with the backend via a real REST API.

The project focuses on **data modeling, aggregations, indexing, and backend logic**, not only UI.

---

## System Architecture

**Architecture type:** Client–Server (Monolithic backend)

### High-level flow:
1. User interacts with frontend pages (HTML + JS).
2. Frontend sends HTTP requests (`fetch`) to REST API endpoints.
3. Express.js routes handle requests and apply business logic.
4. MongoDB stores and retrieves data.
5. Sessions are stored in MongoDB using `connect-mongo`.

---

## Database: `readieg_library`

### Collections

#### 1️.users
Stores registered users.

```json
{
  "_id": ObjectId,
  "name": "User Name",
  "email": "user@example.com",
  "passwordHash": "hashed_password",
  "createdAt": ISODate
}

email is unique
Passwords are securely hashed using bcrypt
Used for authentication and session-based access
```
#### 2. books
Main catalog of fantasy books.
```json
{
  "_id": ObjectId,
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "year": 1937,
  "rating": 4.8,
  "tags": ["epic", "fantasy"],
  "description": "Book description",
  "createdAt": ISODate
}

Indexes:
 title
 author
 tags

Supports filtering, sorting, and searching
```
#### 3.sessions
Automatically managed by connect-mongo.
```json
{
  "_id": "session_id",
  "expires": ISODate,
  "session": {
    "userId": "ObjectId"
  }
}

Stores active user sessions
Ensures authenticated access to protected routes
```
---

### Authentication API

| Method | Endpoint           | Description                     |
|------|-------------------|---------------------------------|
| POST | /api/auth/signup  | Register new user               |
| POST | /api/auth/login   | Login user and create session   |
| POST | /api/auth/logout  | Logout and destroy session      |
| GET  | /api/auth/me      | Get current authenticated user  |

### Books API

| Method | Endpoint           | Description                          |
|------|-------------------|--------------------------------------|
| GET  | /api/books        | Get all books                        |
| GET  | /api/books/:id   | Get book by ID                      |
| POST | /api/books        | Create new book (auth required)     |
| PUT  | /api/books/:id   | Update book                         |
| DELETE | /api/books/:id | Delete book                         |

### Favorites API

| Method | Endpoint                | Description                    |
|------|------------------------|--------------------------------|
| POST | /api/favorites/:bookId | Add book to favorites          |
| GET  | /api/favorites         | Get user favorites             |
| DELETE | /api/favorites/:bookId   | Remove from favorites          |

> Note: Authentication endpoints operate via POST requests.
> Their correct functionality is confirmed by the creation of documents
> in the `users` and `sessions` collections, which can be observed in MongoDB Compass.

---

## Folder Structure
```
endterm-project/
├─ database/
│  └─ mongo.js                 # MongoDB connection
├─ middleware/
│  └─ auth.js                  # Session-based auth middleware
├─ public/
│  ├─ photos/                  # Book cover images
│  ├─ authclient.js            # Auth helpers 
│  ├─ authforms.js             # Login/Signup form logic
│  ├─ booksclient.js           # Frontend logic for CRUD
│  ├─ explore.js               # Carousel logic 
│  ├─ nav.js                   # Menu + search routing         
│  ├─ theme.js                 # Dark/light theme 
│  ├─ style.css                # Global styles 
│  └─ logo.svg                 # Logo
├─ routes/
│  ├─ authroute.js             # Auth API routes 
│  └─ booksroute.js            # Books API routes
│  └─ favoritesroute.js        # User favorites API routes
├─ views/
│  ├─ index.html               # Main page
│  ├─ explore.html             # Shelves exploration page
│  ├─ books.html               # Books catalog + CRUD UI 
│  ├─ about.html
│  ├─ contact.html
│  ├─ login.html
│  └─ signup.html
├─ contacts.json               # Contact form submissions
├─ server.js                   # Express server entry point
├─ package.json
├─ package-lock.json
├─ .env.example                # Example environment v.
├─ .env                         # Your environment v. 
├─ .gitignore
└─ README.md
```
---

## Installation

Inside the project folder:

```bash
npm install
npm start
```
---

## How to Launch

Start the server with:
```bash
npm start
or
node server.js
```
---

## Environment variables (.env):
```bash
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017
MONGODB_DB=readieg_library
SESSION_SECRET=super_secret_key
```
