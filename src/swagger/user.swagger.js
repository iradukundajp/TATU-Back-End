/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The user's name
 *         bio:
 *           type: string
 *           description: The user's biography
 *         location:
 *           type: string
 *           description: The user's location
 *         password:
 *           type: string
 *           description: The user's new password (optional)
 *       example:
 *         name: John Smith
 *         bio: Tattoo enthusiast
 *         location: Los Angeles, CA
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 * 
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: isArtist
 *         schema:
 *           type: boolean
 *         description: Filter by artist status
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 * 
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 * 
 *   put:
 *     summary: Update user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: User not found
 * 
 *   delete:
 *     summary: Delete user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       204:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: User not found
 * 
 * /api/users/{id}/avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (JPEG, PNG, GIF)
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: No image uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: User not found
 */ 