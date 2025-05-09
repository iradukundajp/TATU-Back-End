/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The review ID
 *         userId:
 *           type: string
 *           description: The ID of the user who wrote the review
 *         artistId:
 *           type: string
 *           description: The ID of the artist being reviewed
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The rating (1-5 stars)
 *         comment:
 *           type: string
 *           description: The review comment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the review was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the review was last updated
 *       example:
 *         id: clj2n3abc0001abcd1234
 *         userId: clj2n3abc0002abcd1234
 *         artistId: clj2n3abc0003abcd1234
 *         rating: 5
 *         comment: "Amazing work! The tattoo turned out even better than I expected."
 *         createdAt: "2023-08-01T10:30:00.000Z"
 *         updatedAt: "2023-08-01T10:30:00.000Z"
 *         
 *     CreateReviewRequest:
 *       type: object
 *       required:
 *         - artistId
 *         - rating
 *       properties:
 *         artistId:
 *           type: string
 *           description: The ID of the artist to review
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The rating (1-5 stars)
 *         comment:
 *           type: string
 *           description: The review comment
 *       example:
 *         artistId: clj2n3abc0003abcd1234
 *         rating: 5
 *         comment: "Amazing work! The tattoo turned out even better than I expected."
 *         
 *     UpdateReviewRequest:
 *       type: object
 *       properties:
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           description: The updated rating (1-5 stars)
 *         comment:
 *           type: string
 *           description: The updated review comment
 *       example:
 *         rating: 4
 *         comment: "Great work, but the session took longer than expected."
 *
 *     ReviewsResponse:
 *       type: object
 *       properties:
 *         reviews:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Review'
 *         averageRating:
 *           type: number
 *           format: float
 *           description: The average rating for the artist
 *         totalReviews:
 *           type: integer
 *           description: Total number of reviews for the artist
 */

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Review management
 * 
 * /api/reviews/artist/{artistId}:
 *   get:
 *     summary: Get all reviews for an artist
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: List of artist's reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewsResponse'
 *       404:
 *         description: Artist not found
 * 
 * /api/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewRequest'
 *     responses:
 *       201:
 *         description: Review created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid rating value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Artist not found
 *       409:
 *         description: You have already reviewed this artist
 * 
 * /api/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewRequest'
 *     responses:
 *       200:
 *         description: Review updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       400:
 *         description: Invalid rating value
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found or not created by you
 * 
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Review ID
 *     responses:
 *       204:
 *         description: Review deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Review not found or not created by you
 */ 