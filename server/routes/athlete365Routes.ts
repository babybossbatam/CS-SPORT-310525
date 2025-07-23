
import express from 'express';
const router = express.Router();

// Placeholder routes for athlete365
router.get('/athlete365/test', (req, res) => {
  res.json({ message: 'Athlete365 routes working' });
});

export default router;
