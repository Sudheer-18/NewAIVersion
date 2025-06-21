import React from 'react';
import { Trophy, TrendingUp, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';

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

interface ResultsProps {
  results: {
    domain: string;
    totalQuestions: number;
    answeredQuestions: number;
    averageScore: number;
    percentage: number;
    answers: Answer[];
    completedAt: Date;
  };
  onRestart: () => void;
}

export const Results: React.FC<ResultsProps> = ({ results, onRestart }) => {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 80) return { level: 'Excellent', color: 'bg-green-500', description: 'Outstanding performance!' };
    if (percentage >= 70) return { level: 'Good', color: 'bg-blue-500', description: 'Strong performance with room for growth' };
    if (percentage >= 60) return { level: 'Average', color: 'bg-yellow-500', description: 'Decent performance, keep practicing' };
    return { level: 'Needs Improvement', color: 'bg-red-500', description: 'Focus on fundamentals and practice more' };
  };

  const performance = getPerformanceLevel(results.percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="max-w-6xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Interview Complete!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            {results.domain} Interview Results
          </p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-gray-800 dark:text-white mb-2">
                {results.percentage}%
              </div>
              <div className="text-gray-600 dark:text-gray-400">Overall Score</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                {results.averageScore}/10
              </div>
              <div className="text-gray-600 dark:text-gray-400">Average Rating</div>
            </div>
            
            <div className="text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 ${performance.color} text-white rounded-full font-medium`}>
                <TrendingUp className="w-4 h-4" />
                {performance.level}
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                {performance.description}
              </div>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Question Breakdown</h2>
          
          {results.answers.map((answer, index) => (
            <div key={answer.questionId} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex-1 pr-4">
                  Q{index + 1}: {answer.question}
                </h3>
                <div className={`text-2xl font-bold ${getScoreColor(answer.evaluation.score)}`}>
                  {answer.evaluation.score}/10
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Strengths
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {answer.evaluation.strengths.map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    Areas for Improvement
                  </h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    {answer.evaluation.improvements.map((improvement, i) => (
                      <li key={i}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{answer.evaluation.feedback}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="text-center">
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" />
            Take Another Interview
          </button>
        </div>
      </div>
    </div>
  );
};