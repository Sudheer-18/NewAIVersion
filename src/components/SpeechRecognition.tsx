import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';

interface SpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  isActive: boolean;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ onTranscript, isActive }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event: any) => {
        let finalText = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimText += transcript;
          }
        }

        if (finalText) {
          setFinalTranscript(prev => prev + finalText);
          setInterimTranscript('');
          
          // Reset silence timer when we get final results
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          // Set a new silence timer
          silenceTimerRef.current = setTimeout(() => {
            if (recognitionRef.current && isListening) {
              // Send the complete transcript
              const completeTranscript = (finalTranscript + finalText).trim();
              if (completeTranscript) {
                setTranscript(completeTranscript);
                onTranscript(completeTranscript);
              }
            }
          }, 2000); // Wait 2 seconds of silence before finalizing
        } else {
          setInterimTranscript(interimText);
        }

        // Update display transcript
        const displayTranscript = (finalTranscript + finalText + interimText).trim();
        setTranscript(displayTranscript);
        setError('');
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Ignore 'aborted' errors as they are normal when stopping recognition programmatically
        if (event.error === 'aborted') {
          return;
        }
        
        if (event.error === 'no-speech') {
          setError('No speech detected. Please try speaking again.');
        } else if (event.error === 'audio-capture') {
          setError('Microphone not accessible. Please check your microphone permissions.');
        } else if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        
        // Send final transcript when recognition ends
        const completeTranscript = finalTranscript.trim();
        if (completeTranscript) {
          onTranscript(completeTranscript);
        }
        
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };

      recognitionRef.current.onstart = () => {
        setError('');
        setFinalTranscript('');
        setInterimTranscript('');
        setTranscript('');
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [onTranscript, finalTranscript, isListening]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setFinalTranscript('');
      setInterimTranscript('');
      setError('');
      
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        setError('Failed to start speech recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Send final transcript immediately when manually stopped
      const completeTranscript = finalTranscript.trim();
      if (completeTranscript) {
        onTranscript(completeTranscript);
      }
      
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari for the best experience.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={!isActive}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
              : 'bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Speaking
            </>
          )}
        </button>

        <button
          onClick={() => speakText("Please speak your answer clearly into the microphone. Click the microphone button to start recording. Speak naturally and pause when you're finished.")}
          className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-300"
          title="Test audio"
        >
          <Volume2 className="w-5 h-5" />
          Test Audio
        </button>
      </div>

      {transcript && (
        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your response:</p>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {finalTranscript}
            {interimTranscript && (
              <span className="text-gray-500 dark:text-gray-400 italic">
                {interimTranscript}
              </span>
            )}
          </p>
          {finalTranscript && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400">
              ✓ Speech captured ({finalTranscript.split(' ').length} words)
            </div>
          )}
        </div>
      )}

      {isListening && (
        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Listening... Speak naturally</span>
          </div>
          <div className="text-xs text-red-500 dark:text-red-400">
            Will auto-stop after 2 seconds of silence
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <strong>Tips:</strong> Speak clearly and naturally. The system will automatically detect when you finish speaking. 
        You can also manually stop recording when done.
      </div>
    </div>
  );
};