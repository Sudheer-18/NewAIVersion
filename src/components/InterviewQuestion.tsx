import React, { useState, useRef } from 'react';
import { Clock, ArrowRight, Volume2, Camera, Monitor, MonitorOff } from 'lucide-react';
import { SpeechRecognition } from './SpeechRecognition';
import { CameraRecorder } from './CameraRecorder';
import { TypingAnimation } from './TypingAnimation';

interface Question {
  id: number;
  question: string;
  difficulty: string;
  category: string;
}

interface InterviewQuestionProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (answer: string) => void;
  isLoading: boolean;
}

export const InterviewQuestion: React.FC<InterviewQuestionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  isLoading
}) => {
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [hasStartedAnswering, setHasStartedAnswering] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [questionAnimationComplete, setQuestionAnimationComplete] = useState(false);
  const screenShareRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const handleTranscript = (transcript: string) => {
    setCurrentAnswer(transcript);
    if (!hasStartedAnswering && transcript.trim().length > 0) {
      setHasStartedAnswering(true);
    }
  };

  const handleSubmit = () => {
    if (currentAnswer.trim() && !isLoading) {
      onAnswer(currentAnswer.trim());
      setCurrentAnswer('');
      setHasStartedAnswering(false);
      setIsRecording(false);
      setQuestionAnimationComplete(false);
    }
  };

  const speakQuestion = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question.question);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      screenStreamRef.current = stream;
      if (screenShareRef.current) {
        screenShareRef.current.srcObject = stream;
      }
      
      setIsScreenSharing(true);
      
      // Handle when user stops sharing via browser controls
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopScreenShare();
      });
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenShareRef.current) {
      screenShareRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex">
      {/* Side Panel - Camera */}
      {showCamera && (
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col">
          {/* Camera Header */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Camera</h3>
              </div>
              <button
                onClick={() => setShowCamera(false)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Camera Content */}
          <div className="flex-1 p-4">
            <CameraRecorder
              isActive={!isLoading && questionAnimationComplete}
              onRecordingStateChange={setIsRecording}
            />
            
            {isRecording && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              </div>
            )}
          </div>

          {/* Screen Share Section */}
          <div className="p-4 border-t border-gray-200 dark:border-slate-700">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Screen Share</span>
                <button
                  onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                  disabled={!questionAnimationComplete}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    isScreenSharing
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}
                >
                  {isScreenSharing ? (
                    <>
                      <MonitorOff className="w-4 h-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4" />
                      Share
                    </>
                  )}
                </button>
              </div>
              
              {isScreenSharing && (
                <div className="bg-black rounded-lg overflow-hidden">
                  <video
                    ref={screenShareRef}
                    autoPlay
                    muted
                    className="w-full h-32 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Interview Area */}
      <div className="flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="p-6 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Question {questionNumber} of {totalQuestions}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {Math.round((questionNumber / totalQuestions) * 100)}% Complete
              </span>
              {!showCamera && (
                <button
                  onClick={() => setShowCamera(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors text-sm"
                >
                  <Camera className="w-4 h-4" />
                  Show Camera
                </button>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
                <span className="px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 rounded-full text-sm font-medium">
                  {question.category}
                </span>
              </div>
              <button
                onClick={speakQuestion}
                disabled={!questionAnimationComplete}
                className="p-3 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                title="Listen to question"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>

            {/* Question Text with Typing Animation */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-slate-700">
              <TypingAnimation
                text={question.question}
                speed={30}
                onComplete={() => setQuestionAnimationComplete(true)}
                className="text-3xl font-semibold text-gray-800 dark:text-white leading-relaxed min-h-[4rem]"
              />
            </div>

            {/* Answer Section */}
            {questionAnimationComplete && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-slate-700 animate-fade-in">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Your Answer</h3>
                    {hasStartedAnswering && (
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Answer detected</span>
                      </div>
                    )}
                  </div>

                  <SpeechRecognition 
                    onTranscript={handleTranscript}
                    isActive={!isLoading && questionAnimationComplete}
                  />

                  <div className="flex justify-between items-center pt-6">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm">Take your time to provide a detailed answer</span>
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!currentAnswer.trim() || isLoading}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Evaluating Answer...
                        </>
                      ) : (
                        <>
                          {questionNumber === totalQuestions ? 'Finish Interview' : 'Next Question'}
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};