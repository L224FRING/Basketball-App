# Basketball MERN Stack Application

A full-stack basketball management application built with MongoDB, Express.js, React.js, and Node.js. This application allows you to manage players, track games, and view statistics.

## Features

- **User Authentication**: Register, login, and role-based access control
- **Player Management**: Add, edit, and manage player profiles with detailed statistics
- **Game Tracking**: Schedule games, track scores, and monitor game status
- **Dashboard**: Overview of key metrics and recent activity
- **Responsive Design**: Works on desktop and mobile devices
- **Role-based Access**: Different permissions for players, coaches, and administrators

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Frontend
- **React.js** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling

## Project Structure

```
basketball/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── App.tsx
│   └── package.json
├── models/                 # MongoDB models
│   ├── User.js
│   ├── Player.js
│   └── Game.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── players.js
│   └── games.js
├── middleware/             # Custom middleware
│   └── auth.js
├── config.env             # Environment variables
├── server.js              # Express server
└── package.json           # Root package.json
```

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **MongoDB** (v4.4 or higher)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basketball
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install client dependencies
   npm run install-client
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp config.env.example config.env
   
   # Edit config.env with your values
   nano config.env
   ```

4. **Start MongoDB**
   ```bash
   # Make sure MongoDB is running on your system
   mongod
   ```

## Running the Application

### Development Mode

Run both frontend and backend concurrently:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend development server on `http://localhost:3000`

### Individual Services

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

### Production Mode

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## Environment Variables

Create a `config.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/basketball
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get single player
- `POST /api/players` - Create player (Admin/Coach)
- `PUT /api/players/:id` - Update player (Admin/Coach)
- `DELETE /api/players/:id` - Delete player (Admin)

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get single game
- `POST /api/games` - Create game (Admin/Coach)
- `PUT /api/games/:id` - Update game (Admin/Coach)
- `PUT /api/games/:id/score` - Update game score (Admin/Coach)
- `DELETE /api/games/:id` - Delete game (Admin)

## User Roles

- **Player**: Can view players and games
- **Coach**: Can view and manage players and games
- **Admin**: Full access to all features

## Features Overview

### Dashboard
- Overview statistics
- Recent games
- Top scorers
- Quick actions

### Player Management
- Player profiles with detailed information
- Statistics tracking (PPG, RPG, APG, SPG, BPG)
- Filter by team, position, and status
- Role-based editing permissions

### Game Management
- Schedule games
- Track live scores
- Game status management
- Venue and attendance tracking

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

## Future Enhancements

- Real-time game updates using WebSockets
- Advanced statistics and analytics
- Team management features
- Mobile app using React Native
- Integration with external APIs
- Advanced reporting and data visualization

