# TATU Backend

Backend API for TATU - a tattooing service platform that connects tattoo artists with clients.

## Features

- User authentication (register, login)
- User profile management
- Artist portfolios and artwork management
- Appointment booking system
- Reviews and ratings for artists

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/TATU-Back-End.git
   cd TATU-Back-End
   ```

2. Install dependencies:
   ```
   npm install
   npm install imagekit dotenv
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/tatu_db"
   JWT_SECRET="your-secret-key"
   PORT=5000

   IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
   IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
   IMAGEKIT_URL_ENDPOINT="your_imagekit_url_endpoint"
   ```
   
4. Run database migrations:
   ```
   npx prisma migrate dev
   ```

5. Generate Prisma client:
   ```
   npx prisma generate
   ```

6. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Portfolios
- `GET /api/portfolios` - Get all portfolios
- `GET /api/portfolios/artist/:artistId` - Get portfolio by artist ID
- `POST /api/portfolios/artist/:artistId` - Create or update portfolio
- `POST /api/portfolios/artist/:artistId/images` - Add image to portfolio
- `DELETE /api/portfolios/artist/:artistId/images/:imageId` - Delete image from portfolio

### Bookings
- `GET /api/bookings/user` - Get all bookings for a user
- `GET /api/bookings/artist` - Get all bookings for an artist
- `POST /api/bookings` - Create a booking
- `PUT /api/bookings/:id/status` - Update booking status (for artists)
- `PUT /api/bookings/:id/cancel` - Cancel a booking (for users)

### Reviews
- `GET /api/reviews/artist/:artistId` - Get reviews for an artist
- `POST /api/reviews` - Create a review
- `PUT /api/reviews/:id` - Update a review
- `DELETE /api/reviews/:id` - Delete a review

## License

[MIT](LICENSE)