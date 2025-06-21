import React, { useState } from 'react';
import { ArrowRight, Code, Database, Brain, Briefcase, Palette, Shield, AlertCircle } from 'lucide-react';

interface DomainSelectionProps {
  onDomainSelect: (domain: string) => void;
  isLoading: boolean;
}

const domains = [
  { 
    name: 'Web Development', 
    icon: Code, 
    description: 'Frontend, Backend, Full-stack development',
    color: 'bg-blue-500'
  },
  { 
    name: 'Data Science', 
    icon: Database, 
    description: 'Machine Learning, Analytics, Statistics',
    color: 'bg-purple-500'
  },
  { 
    name: 'AI & Machine Learning', 
    icon: Brain, 
    description: 'Neural Networks, Deep Learning, NLP',
    color: 'bg-green-500'
  },
  { 
    name: 'Product Management', 
    icon: Briefcase, 
    description: 'Strategy, Roadmaps, User Experience',
    color: 'bg-orange-500'
  },
  { 
    name: 'UI/UX Design', 
    icon: Palette, 
    description: 'User Interface, User Experience, Design Systems',
    color: 'bg-pink-500'
  },
  { 
    name: 'Cybersecurity', 
    icon: Shield, 
    description: 'Security Protocols, Risk Assessment, Compliance',
    color: 'bg-red-500'
  }
];

export const DomainSelection: React.FC<DomainSelectionProps> = ({ onDomainSelect, isLoading }) => {
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [customDomain, setCustomDomain] = useState<string>('');
  const [useCustomDomain, setUseCustomDomain] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const domainToUse = useCustomDomain ? customDomain.trim() : selectedDomain;
    
    if (!domainToUse) {
      setError('Please select a domain or enter a custom topic');
      return;
    }

    if (useCustomDomain && customDomain.trim().length < 3) {
      setError('Custom topic must be at least 3 characters long');
      return;
    }

    if (!isLoading) {
      onDomainSelect(domainToUse);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            AI Interview Assistant
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Experience the future of interview preparation with AI-powered questions, speech recognition, and video recording
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
              Select Your Interview Domain
            </h2>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Toggle between preset and custom domains */}
            <div className="flex justify-center mb-6">
              <div className="bg-gray-100 dark:bg-slate-700 rounded-lg p-1 flex">
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomDomain(false);
                    setCustomDomain('');
                    setError('');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    !useCustomDomain
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Preset Domains
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseCustomDomain(true);
                    setSelectedDomain('');
                    setError('');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    useCustomDomain
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  Custom Topic
                </button>
              </div>
            </div>

            {useCustomDomain ? (
              <div className="space-y-4">
                <label htmlFor="customDomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enter your interview topic or domain:
                </label>
                <input
                  type="text"
                  id="customDomain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="e.g., Mobile App Development, Digital Marketing, Cloud Computing..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  disabled={isLoading}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enter any topic you'd like to be interviewed about. The AI will generate relevant questions.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domains.map((domain) => {
                  const Icon = domain.icon;
                  return (
                    <label
                      key={domain.name}
                      className={`relative cursor-pointer group ${isLoading ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <input
                        type="radio"
                        name="domain"
                        value={domain.name}
                        checked={selectedDomain === domain.name}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="sr-only"
                        disabled={isLoading}
                      />
                      <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                        selectedDomain === domain.name
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-lg'
                          : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-blue-300 hover:shadow-md'
                      }`}>
                        <div className={`w-12 h-12 ${domain.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                          {domain.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {domain.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={(!selectedDomain && !customDomain.trim()) || isLoading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Questions...
                </>
              ) : (
                <>
                  Start Interview
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};