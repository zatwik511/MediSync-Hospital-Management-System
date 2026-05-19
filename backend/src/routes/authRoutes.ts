// backend/src/routes/authRoutes.ts
import { Router, Request, Response } from 'express';
import { pool } from '../database/db';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { name, id } = req.body;

  try {
    let result;

    // Login by ID or Name
    if (id) {
      result = await pool.query(`SELECT * FROM staff WHERE id = $1`, [id]);
    } else if (name) {
      result = await pool.query(`SELECT * FROM staff WHERE name = $1`, [name]);
    } else {
      return res.status(400).json({ success: false, error: 'Name or ID required' });
    }

    const data = result.rows[0];

    if (!data) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Success! Return the staff details
    return res.json({
      success: true,
      data: {
        id: data.id,
        name: data.name,
        role: data.role
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;