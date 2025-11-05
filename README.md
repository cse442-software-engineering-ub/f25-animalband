# AnimalBand

Welcome to ANIMALBAND, an interactive music creation platform inspired by BongoCat! Create music by controlling animal musicians using your keyboard, record multiple tracks, and share your creations with the community.

## Quick Start

1. **Prerequisites**
   - Node.js (v14 or higher)
   - PHP (v7.4 or higher)
   - MySQL/MariaDB

2. **Installation**
   ```bash
   # Clone the repository
   git clone https://github.com/cse442-software-engineering-ub/f25-animalband.git
   
   # Install frontend dependencies
   npm install
   
   # Set up your database and configure PHP connection
   # (See Database Setup section below)
   ```

## Project Structure

```
├── php/                    # Backend PHP files
│   ├── commentsStream.php  # Forum comments handling
│   ├── login.php          # Authentication
│   ├── register.php       # User registration
│   └── ...                # Other API endpoints
│
├── public/                 # Static assets
│   └── stage_sounds/      # Instrument sound files
│       ├── bass/
│       ├── drums/
│       ├── guitar/
│       ├── keys/
│       └── vocal/
│
└── src/                   # Frontend React code
    ├── app/
    │   ├── components/    # Reusable UI components
    │   └── routes/        # Page-specific components
    │       ├── account/   # User account management
    │       ├── forum/     # Community forum
    │       ├── landing/   # Homepage
    │       ├── login/     # Authentication pages
    │       ├── looping/   # Music loop functionality
    │       ├── register/  # User registration
    │       └── stage/     # Main music creation area
    └── assets/            # Images and other assets
```

## 🔧 Key Components

### Frontend (React)
- **Stage** (`src/app/routes/stage/`): The main music creation interface where users control animal musicians
- **Forum** (`src/app/routes/forum/`): Community space for sharing recordings and discussions
- **Account Management** (`src/app/routes/account/`): User profile and settings
- **Landing** (`src/app/routes/landing/`): Homepage with featured content

### Backend (PHP)
- **Authentication** (`php/login.php`, `php/register.php`): User authentication system
- **Forum Management** (`php/commentsStream.php`, `php/postsStream.php`): Forum functionality
- **Recording Management** (`php/getRecording.php`, `php/saveRecordingsLocal.php`): Handles music recordings
- **User Management** (`php/getUser.php`, `php/updateAccount.php`): User profile operations

## Development Guidelines

### Frontend Development
1. Components should follow the mobile-first approach with separate desktop/mobile versions
2. Use CSS modules for styling to avoid class name conflicts
3. Keep components small and focused on a single responsibility
4. Implement responsive design using the `useIsMobile` hook

### Backend Development
1. All API endpoints should return JSON responses
2. Implement proper error handling and validation
3. Follow REST principles for API design
4. Secure all endpoints with proper authentication where needed

## Workflow

1. **Create a new branch** for your feature/fix
   - Use the GitHub website to create a new branch and then pull it to your IDE
   - When working make frequent commits to not lose work

2. **Develop and test** your changes
   - Test on both mobile and desktop views on aptitude
   - Ensure PHP endpoints are properly secured
   - Verify database operations work as expected

3. **Submit a Pull Request to dev**
   - Provide clear description of changes in a short title
   - Provide more details and why the commit to dev matters in the description
   - Do not delete the branch you were working on, just close the pull request when merging
   - Please communicate with other devs if merge conflicts occur