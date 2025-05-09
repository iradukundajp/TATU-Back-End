/**
 * @swagger
 * components:
 *   schemas:
 *     Portfolio:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the portfolio
 *         artistId:
 *           type: string
 *           description: The ID of the artist who owns the portfolio
 *         about:
 *           type: string
 *           description: Description of the artist's work and style
 *         styles:
 *           type: array
 *           items:
 *             type: string
 *           description: List of tattoo styles the artist specializes in
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TattooImage'
 *           description: Images in the portfolio
 *         artist:
 *           $ref: '#/components/schemas/User'
 *       example:
 *         id: clqz123abc789
 *         artistId: clqz123abc456
 *         about: Specializing in realistic black and gray tattoos
 *         styles: ["realism", "blackwork", "minimalist"]
 *         images: []
 * 
 *     TattooImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the image
 *         url:
 *           type: string
 *           description: The URL of the image
 *         caption:
 *           type: string
 *           description: Caption for the image
 *         portfolioId:
 *           type: string
 *           description: The ID of the portfolio the image belongs to
 *       example:
 *         id: clqz123abc101
 *         url: /uploads/images/1625123456789.jpg
 *         caption: Realistic lion tattoo, 5 hours
 *         portfolioId: clqz123abc789
 * 
 *     PortfolioRequest:
 *       type: object
 *       properties:
 *         about:
 *           type: string
 *           description: Description of the artist's work and style
 *         styles:
 *           type: array
 *           items:
 *             type: string
 *           description: List of tattoo styles the artist specializes in
 *       example:
 *         about: Specializing in realistic black and gray tattoos
 *         styles: ["realism", "blackwork", "minimalist"]
 */

/**
 * @swagger
 * tags:
 *   name: Portfolios
 *   description: Artist portfolio management
 * 
 * /api/portfolios:
 *   get:
 *     summary: Get all portfolios
 *     tags: [Portfolios]
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
 *         name: styles
 *         schema:
 *           type: string
 *         description: Filter by styles (comma-separated)
 *     responses:
 *       200:
 *         description: List of portfolios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 portfolios:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Portfolio'
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
 * /api/portfolios/artist/{artistId}:
 *   get:
 *     summary: Get portfolio by artist ID
 *     tags: [Portfolios]
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the artist
 *     responses:
 *       200:
 *         description: Portfolio found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       404:
 *         description: Portfolio not found
 * 
 *   post:
 *     summary: Create or update a portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the artist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PortfolioRequest'
 *     responses:
 *       200:
 *         description: Portfolio created or updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Portfolio'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the artist or not an artist
 * 
 * /api/portfolios/artist/{artistId}/images:
 *   post:
 *     summary: Add image to portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the artist
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPEG, PNG, GIF)
 *               caption:
 *                 type: string
 *                 description: Image caption
 *     responses:
 *       201:
 *         description: Image added
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TattooImage'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the artist or not an artist
 *       404:
 *         description: Portfolio not found
 * 
 * /api/portfolios/artist/{artistId}/images/{imageId}:
 *   delete:
 *     summary: Delete image from portfolio
 *     tags: [Portfolios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the artist
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image
 *     responses:
 *       204:
 *         description: Image deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the artist or not an artist
 *       404:
 *         description: Image not found
 */ 