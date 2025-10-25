/**
 * Cognitive Modeling Routes - Phase 5
 * 
 * Integrates Python ML services for deep cognitive modeling:
 * - Reasoning chains and knowledge graphs
 * - Value hierarchy and decision prediction
 * - Emotional reasoning and trajectory
 * - Theory of mind and mental models
 * - Narrative identity and life themes
 */

import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// Python ML service URL
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8788';

// Helper function to call Python ML service
async function callMLService(
  endpoint: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any
) {
  try {
    const response = await axios({
      method,
      url: `${ML_SERVICE_URL}${endpoint}`,
      data,
      timeout: 30000 // 30 second timeout
    });
    return response.data;
  } catch (error: any) {
    console.error(`ML Service Error [${endpoint}]:`, error.message);
    throw new Error(
      error.response?.data?.detail || 
      'Failed to communicate with ML service'
    );
  }
}

// ============================================================================
// REASONING CHAIN ENDPOINTS
// ============================================================================

/**
 * POST /api/self-agent/cognitive/reasoning/extract
 * Extract reasoning chains from user conversations
 */
router.post('/reasoning/extract', async (req: Request, res: Response) => {
  try {
    const { userId, conversations } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required' 
      });
    }

    const result = await callMLService(
      '/reasoning/extract',
      'POST',
      { user_id: userId, conversations }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/reasoning/:userId
 * Get user's reasoning pattern statistics
 */
router.get('/reasoning/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await callMLService(`/reasoning/${userId}`);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * POST /api/self-agent/cognitive/reasoning/query
 * Query knowledge graph for related concepts
 */
router.post('/reasoning/query', async (req: Request, res: Response) => {
  try {
    const { userId, concept, maxDepth = 2 } = req.body;
    
    if (!userId || !concept) {
      return res.status(400).json({ 
        error: 'userId and concept are required' 
      });
    }

    const result = await callMLService(
      `/reasoning/query?user_id=${userId}&concept=${encodeURIComponent(concept)}&max_depth=${maxDepth}`,
      'POST'
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// ============================================================================
// VALUE HIERARCHY ENDPOINTS
// ============================================================================

/**
 * POST /api/self-agent/cognitive/values/build
 * Build user's value hierarchy
 */
router.post('/values/build', async (req: Request, res: Response) => {
  try {
    const { userId, conversations } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required' 
      });
    }

    const result = await callMLService(
      '/values/build',
      'POST',
      { user_id: userId, conversations }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/values/:userId
 * Get user's value hierarchy
 */
router.get('/values/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await callMLService(`/values/${userId}`);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * POST /api/self-agent/cognitive/values/predict-decision
 * Predict which option user will choose based on values
 */
router.post('/values/predict-decision', async (req: Request, res: Response) => {
  try {
    const { userId, optionA, optionB } = req.body;
    
    if (!userId || !optionA || !optionB) {
      return res.status(400).json({ 
        error: 'userId, optionA, and optionB are required' 
      });
    }

    const result = await callMLService(
      '/values/predict-decision',
      'POST',
      { user_id: userId, option_a: optionA, option_b: optionB }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// ============================================================================
// EMOTIONAL REASONING ENDPOINTS
// ============================================================================

/**
 * POST /api/self-agent/cognitive/emotions/analyze
 * Analyze emotional state from text
 */
router.post('/emotions/analyze', async (req: Request, res: Response) => {
  try {
    const { userId, text, context, conversationId } = req.body;
    
    if (!userId || !text) {
      return res.status(400).json({ 
        error: 'userId and text are required' 
      });
    }

    const result = await callMLService(
      '/emotions/analyze',
      'POST',
      { 
        user_id: userId, 
        text, 
        context, 
        conversation_id: conversationId 
      }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/emotions/trajectory/:userId
 * Get emotional trajectory over time
 */
router.get('/emotions/trajectory/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const result = await callMLService(
      `/emotions/trajectory/${userId}?days=${days}`
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * POST /api/self-agent/cognitive/emotions/predict
 * Predict emotional response to situation
 */
router.post('/emotions/predict', async (req: Request, res: Response) => {
  try {
    const { userId, situation, context } = req.body;
    
    if (!userId || !situation) {
      return res.status(400).json({ 
        error: 'userId and situation are required' 
      });
    }

    const result = await callMLService(
      '/emotions/predict',
      'POST',
      { user_id: userId, situation, context }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// ============================================================================
// THEORY OF MIND ENDPOINTS
// ============================================================================

/**
 * POST /api/self-agent/cognitive/tom/build
 * Build mental model of target person
 */
router.post('/tom/build', async (req: Request, res: Response) => {
  try {
    const { userId, targetPerson, conversations, context } = req.body;
    
    if (!userId || !targetPerson) {
      return res.status(400).json({ 
        error: 'userId and targetPerson are required' 
      });
    }

    const result = await callMLService(
      '/tom/build',
      'POST',
      { 
        user_id: userId, 
        target_person: targetPerson, 
        conversations, 
        context 
      }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/tom/:userId/:targetPerson
 * Get mental model of target person
 */
router.get('/tom/:userId/:targetPerson', async (req: Request, res: Response) => {
  try {
    const { userId, targetPerson } = req.params;

    const result = await callMLService(
      `/tom/${userId}/${encodeURIComponent(targetPerson)}`
    );

    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ 
      error: error.message 
    });
  }
});

/**
 * POST /api/self-agent/cognitive/tom/predict-reaction
 * Predict how target will react to situation
 */
router.post('/tom/predict-reaction', async (req: Request, res: Response) => {
  try {
    const { userId, targetPerson, situation } = req.body;
    
    if (!userId || !targetPerson || !situation) {
      return res.status(400).json({ 
        error: 'userId, targetPerson, and situation are required' 
      });
    }

    const result = await callMLService(
      '/tom/predict-reaction',
      'POST',
      { user_id: userId, target_person: targetPerson, situation }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/tom/:userId/all
 * Get all mental models for user
 */
router.get('/tom/:userId/all', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await callMLService(`/tom/${userId}/all`);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// ============================================================================
// NARRATIVE IDENTITY ENDPOINTS
// ============================================================================

/**
 * POST /api/self-agent/cognitive/narrative/extract
 * Extract narrative identity from conversations
 */
router.post('/narrative/extract', async (req: Request, res: Response) => {
  try {
    const { userId, conversations } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required' 
      });
    }

    const result = await callMLService(
      '/narrative/extract',
      'POST',
      { user_id: userId, conversations }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/narrative/:userId
 * Get user's narrative identity
 */
router.get('/narrative/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await callMLService(`/narrative/${userId}`);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

/**
 * GET /api/self-agent/cognitive/narrative/:userId/themes
 * Analyze identity themes
 */
router.get('/narrative/:userId/themes', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await callMLService(`/narrative/${userId}/themes`);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error.message 
    });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /api/self-agent/cognitive/health
 * Check ML service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await callMLService('/health');
    res.json({ 
      typescript_service: 'healthy', 
      ml_service: result 
    });
  } catch (error: any) {
    res.status(503).json({ 
      typescript_service: 'healthy',
      ml_service: 'unhealthy',
      error: error.message 
    });
  }
});

export default router;
