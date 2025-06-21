import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './components/ThemeProvider';
import { ThemeToggle } from './components/ThemeToggle';
import { DomainSelection } from './components/DomainSelection';
import { InterviewQuestion } from './components/InterviewQuestion';
import { Results } from './components/Results';

interface Question {
  id: number;
  question: string;
  difficulty: string;
  category: string;
}

interface Answer {
  questionId: number;
  question: string;
  answer: string;
  evaluation: {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    keyPoints: string[];
  };
  timestamp: Date;
}

interface InterviewResults {
  domain: string;
  totalQuestions: number;
  answeredQuestions: number;
  averageScore: number;
  percentage: number;
  answers: Answer[];
  completedAt: Date;
}

type AppState = 'domain-selection' | 'interview' | 'results';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [appState, setAppState] = useState<AppState>('domain-selection');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<InterviewResults | null>(null);

  const handleDomainSelect = async (domain: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate questions: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.sessionId || !data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid response format from server');
      }

      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setAppState('interview');
    } catch (error) {
      console.error('Error generating questions:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (!questions[currentQuestionIndex]) return;

    setIsLoading(true);
    setError('');
    
    try {
      const currentQuestion = questions[currentQuestionIndex];
      const response = await fetch(`${API_BASE_URL}/evaluate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          answer,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to evaluate answer: ${response.status} ${response.statusText}`);
      }

      const evaluation = await response.json();
      
      if (!evaluation || typeof evaluation.score !== 'number') {
        throw new Error('Invalid evaluation response from server');
      }

      // Move to next question or show results
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        // Interview complete, fetch results
        await fetchResults();
      }
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setError(error instanceof Error ? error.message : 'Failed to evaluate answer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/results/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch results: ${response.status} ${response.statusText}`);
      }

      const resultsData = await response.json();
      
      if (!resultsData || typeof resultsData.averageScore !== 'number') {
        throw new Error('Invalid results response from server');
      }

      setResults(resultsData);
      setAppState('results');
    } catch (error) {
      console.error('Error fetching results:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch results. Please try again.');
    }
  };

  const handleRestart = useCallback(() => {
    setAppState('domain-selection');
    setSessionId('');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setResults(null);
    setIsLoading(false);
    setError('');
  }, []);

  const renderCurrentView = () => {
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Something went wrong</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={handleRestart}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (appState) {
      case 'domain-selection':
        return (
          <DomainSelection 
            onDomainSelect={handleDomainSelect}
            isLoading={isLoading}
          />
        );
      
      case 'interview':
        if (questions.length === 0) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
              </div>
            </div>
          );
        }
        return (
          <InterviewQuestion
            question={questions[currentQuestionIndex]}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            isLoading={isLoading}
          />
        );
      
      case 'results':
        if (!results) {
          return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
              </div>
            </div>
          );
        }
        return (
          <Results
            results={results}
            onRestart={handleRestart}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <ThemeToggle />
        {renderCurrentView()}
      </div>
    </ThemeProvider>
  );
}

export default App;