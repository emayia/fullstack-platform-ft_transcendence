![Modern Pong Game Overview](assets/00-overview.gif)

# Modern Game Platform

A modern interpretation of the classic Pong game, built with Django, WebSocket, and Three.js. Features real-time multiplayer capabilities, tournament mode, and harmonious visual themes.

## Features

### Game Modes
- **Single Player**: Challenge an AI opponent with adaptive difficulty
- **Local Multiplayer**: Play with a friend on the same computer
- **Tournament Mode**: Organize tournaments with 3-6 players

[![Gameplay Overview](assets/thumbnails/gameplay-thumbnail.jpg)](https://vimeo.com/1053083679/2756e3108c)

### Social Features
- **Real-time Chat**: WebSocket-powered messaging system
- **Active Players List**: See who's currently online
- **Block System**: Manage unwanted interactions

[![Chat Demo](assets/thumbnails/chat-thumbnail.jpg)](https://vimeo.com/1053085529/179c2ae529)

### Visual Experience
- **3D Graphics**: Powered by `Three.js` for immersive gameplay
- **Dynamic Themes**: Multiple atmospheric backgrounds (Clouds, Sunset, Cherry Blossoms, Nature, Galaxy, Fire)
- **Harmonious Design**: Strong emphasis on a pleasant UI/UX throughout the project

[![Performance Demo](assets/thumbnails/perfs-thumbnail.jpg)](https://vimeo.com/1053086347/553114ca4d)

[![404 Page](assets/thumbnails/404-thumbnail.jpg)](https://vimeo.com/1053087748/f5d6108dfd)

### Internationalization

| Language | Preview |
|----------|---------|
| English | ![English Interface](assets/01-lang-en.jpg) |
| French | ![French Interface](assets/01-lang-fr.jpg) |
| Korean | ![Korean Interface](assets/01-lang-kr.jpg) |
| Russian | ![Russian Interface](assets/01-lang-ru.jpg) |

## Technical Stack

### Backend
- **Django**: Web framework
- **Channels**: WebSocket support
- **Django REST Framework**: API endpoints
- **PostgreSQL**: Database
- **JWT**: Authentication

### Frontend
- **Three.js**: 3D graphics
- **WebSocket**: Real-time communication
- **Vanilla JavaScript**: No frontend framework dependencies
- **CSS3**: Modern styling with transitions and animations

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/emayia/fullstack-platform-ft_transcendence.git
cd fullstack-platform-ft_transcendence
```

2. **Set up environment variables**
Create a `.env` file in the `srcs/` directory with:
```
POSTGRES_DB=your_db_name
POSTGRES_USER=your_db_user
POSTGRES_HOST=your_db_host
POSTGRES_PORT=5432
POSTGRES_PASSWORD_FILE=/run/secrets/postgres_password
DATABASE_URL=postgres://your_db_user:db_password@postgres:5432/your_db_name
REDIRECT_URI=https://localhost:8443/auth/callback
DJANGO_SECRET_KEY_FILE=/run/secrets/django_secret_key
JWT_SIGNING_KEY_FILE=/run/secrets/jwt_signing_key
```

Include and fill the following files with the adequate credentials in a directory called `secrets/`:
- `client_id.txt`
- `client_secret.txt`
- `django_secret_key.txt`
- `jwt_signing_key.txt`
- `postrgres_password.txt`
Place the `secrets/` directory at the root of the project.

3. **Install dependencies and run the project**
```bash
make
```

## Architecture

### WebSocket Architecture
The game uses three main WebSocket consumers:
- `ChatConsumer`: Handles real-time messaging
- `PlayerConsumer`: Manages active player status
- `PongConsumer`: Controls game state and synchronization

### Game Engine
- Server-side game logic
- Fair matchmaking system
- Client-side prediction for smooth gameplay
- State synchronization through WebSocket
- Collision detection and physics calculations

### Database Schema
- User profiles and authentication
- Conversation and message history
- Blocked users management

## Security

- CSRF protection
- JWT token authentication
- Secure WebSocket connections
- Input validation and sanitization
- PostgreSQL injection prevention
- XSS protection

## Acknowledgments

- [Myriam K.](https://github.com/mkerkeni42) and [Yani K.](https://github.com/ykifadji) for their incredible work throughout the project
- Original Pong game by Atari
- Three.js community for 3D graphics support
- Django and Django Channels teams
- [Ethem D.](https://github.com/edalmis) and [Malik I.](https://github.com/ma1iik) for their invaluable feedback during testing sessions

## Contact

Emin A. - [@emayia](https://github.com/emayia)
