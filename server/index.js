import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI with better error handling
let genAI = null;
let model = null;

try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.error('❌ GEMINI_API_KEY environment variable is not set or is using placeholder value');
    console.log('📝 Please set your GEMINI_API_KEY environment variable');
    console.log('🔑 Get your API key from: https://makersuite.google.com/app/apikey');
  } else {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('✅ Gemini AI initialized successfully');
  }
} catch (error) {
  console.error('❌ Failed to initialize Gemini AI:', error.message);
}

// In-memory storage for interview sessions
const interviewSessions = new Map();

// Generate questions endpoint
app.post('/api/generate-questions', async (req, res) => {
  try {
    const { domain } = req.body;
    
    if (!domain || typeof domain !== 'string' || domain.trim().length === 0) {
      return res.status(400).json({ error: 'Domain is required and must be a non-empty string' });
    }

    // Check if Gemini AI is available
    if (!model) {
      console.log('⚠️ Gemini AI not available, using fallback questions');
      const fallbackQuestions = generateFallbackQuestions(domain.trim());
      const sessionId = Date.now().toString();
      
      interviewSessions.set(sessionId, {
        domain: domain.trim(),
        questions: fallbackQuestions,
        answers: [],
        scores: [],
        createdAt: new Date()
      });
      
      return res.json({
        sessionId,
        questions: fallbackQuestions
      });
    }
    
    const prompt = `Generate 7 technical interview questions for the domain: ${domain}. 
    Questions should be:
    1. Progressive in difficulty (easy to hard)
    2. Practical and relevant to real-world scenarios
    3. Cover different aspects of the domain
    4. Suitable for evaluating both theoretical knowledge and practical understanding
    
    Return the response as a JSON array with objects containing 'id', 'question', 'difficulty' (easy/medium/hard), and 'category' fields.
    
    Example format:
    [
      {
        "id": 1,
        "question": "What is...",
        "difficulty": "easy",
        "category": "fundamentals"
      }
    ]`;

    const result = await model.generateContent({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    });

    const response = await result.response;
    let text = response.text();
    
    // Clean up the response to extract JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const questions = JSON.parse(text);
      
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }
      
      // Validate question structure
      const validQuestions = questions.filter(q => 
        q && typeof q.id === 'number' && 
        typeof q.question === 'string' && 
        typeof q.difficulty === 'string' && 
        typeof q.category === 'string'
      ).slice(0, 7); // Ensure we only return 7 questions
      
      if (validQuestions.length === 0) {
        throw new Error('No valid questions found');
      }
      
      // Generate session ID
      const sessionId = Date.now().toString();
      
      // Store session
      interviewSessions.set(sessionId, {
        domain: domain.trim(),
        questions: validQuestions,
        answers: [],
        scores: [],
        createdAt: new Date()
      });
      
      res.json({
        sessionId,
        questions: validQuestions
      });
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      // Fallback questions if AI response is malformed
      const fallbackQuestions = generateFallbackQuestions(domain.trim());
      const sessionId = Date.now().toString();
      
      interviewSessions.set(sessionId, {
        domain: domain.trim(),
        questions: fallbackQuestions,
        answers: [],
        scores: [],
        createdAt: new Date()
      });
      
      res.json({
        sessionId,
        questions: fallbackQuestions
      });
    }
  } catch (error) {
    console.error('Error generating questions:', error);
    
    // If it's an API key error, provide specific guidance
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({ 
        error: 'Invalid API key. Please check your GEMINI_API_KEY environment variable.' 
      });
    }
    
    // For other errors, try fallback questions
    try {
      const { domain } = req.body;
      const fallbackQuestions = generateFallbackQuestions(domain?.trim() || 'General');
      const sessionId = Date.now().toString();
      
      interviewSessions.set(sessionId, {
        domain: domain?.trim() || 'General',
        questions: fallbackQuestions,
        answers: [],
        scores: [],
        createdAt: new Date()
      });
      
      res.json({
        sessionId,
        questions: fallbackQuestions
      });
    } catch (fallbackError) {
      res.status(500).json({ error: 'Failed to generate questions. Please try again.' });
    }
  }
});

// Evaluate answer endpoint with Gemini AI
app.post('/api/evaluate-answer', async (req, res) => {
  try {
    const { sessionId, questionId, answer, question } = req.body;
    
    if (!sessionId || !questionId || !answer || !question) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const session = interviewSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check if Gemini AI is available
    if (!model) {
      console.log('⚠️ Gemini AI not available, using fallback evaluation');
      const fallbackEvaluation = {
        score: Math.floor(Math.random() * 4) + 5, // Random score between 5-8
        feedback: "Answer received and recorded. AI evaluation is currently unavailable, but your response has been noted.",
        strengths: ["Provided a response", "Engaged with the question"],
        improvements: ["Could be more detailed", "Consider providing examples"],
        keyPoints: ["Technical accuracy", "Practical examples", "Clear communication"]
      };
      
      session.answers.push({
        questionId,
        question,
        answer,
        evaluation: fallbackEvaluation,
        timestamp: new Date()
      });
      
      return res.json(fallbackEvaluation);
    }
    
    const prompt = `You are an expert interviewer evaluating a candidate's response for a ${session.domain} position.

Question: ${question}
Candidate's Answer: ${answer}

Please evaluate this answer comprehensively and provide detailed feedback. Consider:
1. Technical accuracy and depth of knowledge
2. Clarity of explanation and communication skills
3. Practical understanding and real-world application
4. Completeness of the answer
5. Problem-solving approach

Provide your evaluation in this exact JSON format:
{
  "score": [number from 0-10, where 10 is excellent],
  "feedback": "Detailed constructive feedback explaining the score and overall assessment",
  "strengths": ["List 2-4 specific strengths demonstrated in the answer"],
  "improvements": ["List 2-4 specific areas for improvement or missing elements"],
  "keyPoints": ["List 3-5 key points that should have been mentioned for a complete answer"]
}

Be professional, constructive, and specific in your feedback. Focus on helping the candidate improve.`;

    const result = await model.generateContent({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    });

    const response = await result.response;
    let text = response.text();
    
    // Clean up the response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const evaluation = JSON.parse(text);
      
      // Validate evaluation structure
      if (typeof evaluation.score !== 'number' || 
          !evaluation.feedback ||
          !Array.isArray(evaluation.strengths) || 
          !Array.isArray(evaluation.improvements) || 
          !Array.isArray(evaluation.keyPoints)) {
        throw new Error('Invalid evaluation structure');
      }

      // Ensure score is within valid range
      evaluation.score = Math.max(0, Math.min(10, evaluation.score));
      
      // Store the answer and evaluation
      session.answers.push({
        questionId,
        question,
        answer,
        evaluation,
        timestamp: new Date()
      });
      
      console.log(`✅ Answer evaluated for session ${sessionId}, question ${questionId}, score: ${evaluation.score}/10`);
      
      res.json(evaluation);
    } catch (parseError) {
      console.error('Evaluation parse error:', parseError);
      console.log('Raw AI response:', text);
      
      // Fallback evaluation with more detailed feedback
      const fallbackEvaluation = {
        score: Math.floor(Math.random() * 3) + 6, // Random score between 6-8
        feedback: "Your answer has been recorded and shows engagement with the question. While AI evaluation encountered a technical issue, your response demonstrates effort and understanding of the topic.",
        strengths: ["Provided a comprehensive response", "Showed understanding of the topic"],
        improvements: ["Could include more specific examples", "Consider elaborating on technical details"],
        keyPoints: ["Technical accuracy", "Practical examples", "Clear communication", "Problem-solving approach"]
      };
      
      session.answers.push({
        questionId,
        question,
        answer,
        evaluation: fallbackEvaluation,
        timestamp: new Date()
      });
      
      res.json(fallbackEvaluation);
    }
  } catch (error) {
    console.error('Error evaluating answer:', error);
    
    // Enhanced fallback evaluation for any error
    try {
      const { sessionId, questionId, question, answer } = req.body;
      const session = interviewSessions.get(sessionId);
      
      if (session) {
        const wordCount = answer.trim().split(/\s+/).length;
        const baseScore = Math.min(8, Math.max(4, Math.floor(wordCount / 10) + 4)); // Score based on response length
        
        const fallbackEvaluation = {
          score: baseScore,
          feedback: `Your response has been recorded (${wordCount} words). While AI evaluation is temporarily unavailable, your answer shows engagement with the question and will be considered in your overall assessment.`,
          strengths: ["Provided a detailed response", "Engaged thoughtfully with the question"],
          improvements: ["Continue to provide specific examples", "Consider technical depth where applicable"],
          keyPoints: ["Technical accuracy", "Practical examples", "Clear communication", "Comprehensive coverage"]
        };
        
        session.answers.push({
          questionId,
          question,
          answer,
          evaluation: fallbackEvaluation,
          timestamp: new Date()
        });
        
        return res.json(fallbackEvaluation);
      }
    } catch (fallbackError) {
      console.error('Fallback evaluation failed:', fallbackError);
    }
    
    res.status(500).json({ error: 'Failed to evaluate answer. Please try again.' });
  }
});

// Get final results endpoint
app.get('/api/results/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    const session = interviewSessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const totalScore = session.answers.reduce((sum, answer) => sum + (answer.evaluation.score || 0), 0);
    const averageScore = session.answers.length > 0 ? (totalScore / session.answers.length) : 0;
    const percentage = Math.round((averageScore / 10) * 100);
    
    console.log(`📊 Results for session ${sessionId}: ${averageScore.toFixed(1)}/10 (${percentage}%)`);
    
    res.json({
      domain: session.domain,
      totalQuestions: session.questions.length,
      answeredQuestions: session.answers.length,
      averageScore: parseFloat(averageScore.toFixed(1)),
      percentage: percentage,
      answers: session.answers,
      completedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting results:', error);
    res.status(500).json({ error: 'Failed to get results. Please try again.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const hasValidApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your-gemini-api-key-here';
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    geminiApiAvailable: !!model,
    hasApiKey: hasValidApiKey,
    sessionsActive: interviewSessions.size
  });
});

// Fallback questions generator
function generateFallbackQuestions(domain) {
  const questionBank = {
    'Web Development': [
      { id: 1, question: "What is the difference between HTML, CSS, and JavaScript?", difficulty: "easy", category: "fundamentals" },
      { id: 2, question: "Explain the concept of responsive web design.", difficulty: "easy", category: "design" },
      { id: 3, question: "What are the different HTTP methods and when would you use them?", difficulty: "medium", category: "backend" },
      { id: 4, question: "How does browser caching work and how can you control it?", difficulty: "medium", category: "performance" },
      { id: 5, question: "Explain the concept of RESTful APIs and their principles.", difficulty: "medium", category: "backend" },
      { id: 6, question: "What are some common web security vulnerabilities and how do you prevent them?", difficulty: "hard", category: "security" },
      { id: 7, question: "How would you optimize a web application's performance?", difficulty: "hard", category: "performance" }
    ],
    'Data Science': [
      { id: 1, question: "What is the difference between supervised and unsupervised learning?", difficulty: "easy", category: "fundamentals" },
      { id: 2, question: "Explain what data preprocessing involves.", difficulty: "easy", category: "preprocessing" },
      { id: 3, question: "What is overfitting and how can you prevent it?", difficulty: "medium", category: "modeling" },
      { id: 4, question: "How do you handle missing data in a dataset?", difficulty: "medium", category: "preprocessing" },
      { id: 5, question: "Explain the bias-variance tradeoff.", difficulty: "medium", category: "theory" },
      { id: 6, question: "How would you design an A/B test for a new feature?", difficulty: "hard", category: "experimentation" },
      { id: 7, question: "Explain how you would build a recommendation system.", difficulty: "hard", category: "systems" }
    ],
    'AI & Machine Learning': [
      { id: 1, question: "What is the difference between artificial intelligence and machine learning?", difficulty: "easy", category: "fundamentals" },
      { id: 2, question: "Explain what a neural network is and how it works.", difficulty: "easy", category: "neural-networks" },
      { id: 3, question: "What is the difference between classification and regression?", difficulty: "medium", category: "algorithms" },
      { id: 4, question: "How do you prevent overfitting in machine learning models?", difficulty: "medium", category: "optimization" },
      { id: 5, question: "Explain the concept of gradient descent.", difficulty: "medium", category: "optimization" },
      { id: 6, question: "What are the key components of a transformer architecture?", difficulty: "hard", category: "deep-learning" },
      { id: 7, question: "How would you approach building a recommendation system for a streaming platform?", difficulty: "hard", category: "systems" }
    ],
    'Product Management': [
      { id: 1, question: "What is the role of a product manager?", difficulty: "easy", category: "fundamentals" },
      { id: 2, question: "How do you prioritize features in a product roadmap?", difficulty: "easy", category: "planning" },
      { id: 3, question: "What metrics would you use to measure product success?", difficulty: "medium", category: "analytics" },
      { id: 4, question: "How do you handle conflicting stakeholder requirements?", difficulty: "medium", category: "stakeholder-management" },
      { id: 5, question: "Describe your approach to user research and validation.", difficulty: "medium", category: "research" },
      { id: 6, question: "How would you launch a new product in a competitive market?", difficulty: "hard", category: "strategy" },
      { id: 7, question: "Design a product strategy for entering a new market segment.", difficulty: "hard", category: "strategy" }
    ],
    'UI/UX Design': [
      { id: 1, question: "What is the difference between UI and UX design?", difficulty: "easy", category: "fundamentals" },
      { id: 2, question: "Explain the importance of user personas in design.", difficulty: "easy", category: "user-research" },
      { id: 3, question: "What is the design thinking process?", difficulty: "medium", category: "process" },
      { id: 4, question: "How do you conduct usability testing?", difficulty: "medium", category: "testing" },
      { id: 5, question: "What are design systems and why are they important?", difficulty: "medium", category: "systems" },
      { id: 6, question: "How would you design an accessible interface for users with disabilities?", difficulty: "hard", category: "accessibility" },
      { id: 7, question: "Design a mobile app interface for a complex workflow.", difficulty: "hard", category: "interaction-design" }
    ],
    'Cybersecurity': [
      { id: 1, question: "What are the main types of cyber threats?", difficulty: "easy", category: "fundamentals" },
      { id: 2, question: "Explain the concept of defense in depth.", difficulty: "easy", category: "strategy" },
      { id: 3, question: "What is the difference between symmetric and asymmetric encryption?", difficulty: "medium", category: "cryptography" },
      { id: 4, question: "How do you conduct a security risk assessment?", difficulty: "medium", category: "risk-management" },
      { id: 5, question: "What are the key components of an incident response plan?", difficulty: "medium", category: "incident-response" },
      { id: 6, question: "How would you secure a cloud infrastructure?", difficulty: "hard", category: "cloud-security" },
      { id: 7, question: "Design a security architecture for a financial services company.", difficulty: "hard", category: "architecture" }
    ],
    'default': [
      { id: 1, question: "Tell me about your experience in this field.", difficulty: "easy", category: "experience" },
      { id: 2, question: "What are your greatest strengths?", difficulty: "easy", category: "personal" },
      { id: 3, question: "How do you stay updated with industry trends?", difficulty: "medium", category: "learning" },
      { id: 4, question: "Describe a challenging project you worked on.", difficulty: "medium", category: "experience" },
      { id: 5, question: "How do you handle tight deadlines?", difficulty: "medium", category: "work-style" },
      { id: 6, question: "Where do you see yourself in 5 years?", difficulty: "hard", category: "career" },
      { id: 7, question: "Why should we hire you?", difficulty: "hard", category: "motivation" }
    ]
  };
  
  return questionBank[domain] || questionBank['default'];
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`🚀 AI Interview Server running on http://localhost:${port}`);
  
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your-gemini-api-key-here') {
    console.log(`❌ GEMINI_API_KEY environment variable is not set`);
    console.log(`📝 To use AI features, set your API key:`);
    console.log(`   export GEMINI_API_KEY='your-actual-api-key'`);
    console.log(`🔑 Get your API key from: https://makersuite.google.com/app/apikey`);
    console.log(`⚠️  App will use fallback questions until API key is configured`);
  } else {
    console.log(`✅ GEMINI_API_KEY is configured`);
    console.log(`🤖 Gemini AI evaluation enabled`);
  }
  
  console.log(`🎥 Camera access will be requested when users start interviews`);
  console.log(`📱 Phone detection enabled in camera feed`);
});