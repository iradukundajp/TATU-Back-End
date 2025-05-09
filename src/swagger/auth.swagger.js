/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *         isArtist:
 *           type: boolean
 *           description: Whether the user is an artist
 *         bio:
 *           type: string
 *           description: The user's biography
 *         location:
 *           type: string
 *           description: The user's location
 *         avatarUrl:
 *           type: string
 *           description: The URL of the user's avatar
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the user was created
 *       example:
 *         id: clqz123abc456
 *         name: John Doe
 *         email: john@example.com
 *         isArtist: false
 *         bio: Tattoo enthusiast
 *         location: New York, NY
 *         avatarUrl: https://example.com/avatar.jpg
 *         createdAt: 2023-01-01T00:00:00.000Z
 * 
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *       example:
 *         email: john@example.com
 *         password: password123
 * 
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password
 *         isArtist:
 *           type: boolean
 *           description: Whether the user is an artist
 *         bio:
 *           type: string
 *           description: The user's biography
 *         location:
 *           type: string
 *           description: The user's location
 *       example:
 *         name: John Doe
 *         email: john@example.com
 *         password: password123
 *         isArtist: false
 *         bio: Tattoo enthusiast
 *         location: New York, NY
 * 
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *       example:
 *         user:
 *           id: clqz123abc456
 *           name: John Doe
 *           email: john@example.com
 *           isArtist: false
 *         token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication
 * 
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Email already in use
 * 
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Invalid credentials
 * 
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */ 