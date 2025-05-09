/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The booking ID
 *         userId:
 *           type: string
 *           description: The ID of the user who made the booking
 *         artistId:
 *           type: string
 *           description: The ID of the artist being booked
 *         date:
 *           type: string
 *           format: date-time
 *           description: The date and time of the booking
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           description: The current status of the booking
 *         note:
 *           type: string
 *           description: Additional notes for the booking
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the booking was created
 *       example:
 *         id: clj2n3abc0001abcd1234
 *         userId: clj2n3abc0002abcd1234
 *         artistId: clj2n3abc0003abcd1234
 *         date: "2023-12-15T14:00:00.000Z"
 *         status: "pending"
 *         note: "I'd like a small rose tattoo on my wrist"
 *         createdAt: "2023-08-01T10:30:00.000Z"
 *         
 *     CreateBookingRequest:
 *       type: object
 *       required:
 *         - artistId
 *         - date
 *       properties:
 *         artistId:
 *           type: string
 *           description: The ID of the artist to book
 *         date:
 *           type: string
 *           format: date-time
 *           description: The requested date and time for the booking
 *         note:
 *           type: string
 *           description: Additional notes or requests for the booking
 *       example:
 *         artistId: clj2n3abc0003abcd1234
 *         date: "2023-12-15T14:00:00.000Z"
 *         note: "I'd like a small rose tattoo on my wrist"
 *         
 *     UpdateBookingStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, completed, cancelled]
 *           description: The new status for the booking
 *       example:
 *         status: "confirmed"
 */

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking management
 * 
 * /api/bookings/user:
 *   get:
 *     summary: Get all bookings for the logged-in user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 * 
 * /api/bookings/artist:
 *   get:
 *     summary: Get all bookings for the logged-in artist
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of artist's bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an artist
 * 
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *     responses:
 *       201:
 *         description: Booking created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Artist not found
 * 
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Update booking status (artist only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateBookingStatusRequest'
 *     responses:
 *       200:
 *         description: Booking status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not an artist
 *       404:
 *         description: Booking not found or not associated with this artist
 * 
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel a booking (user only)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Booking not found or not associated with this user
 */ 