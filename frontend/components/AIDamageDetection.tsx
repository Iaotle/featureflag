'use client';

import { useState } from 'react';

interface AIDamageDetectionProps {
  reportId: number;
  photos: string[];
}

export default function AIDamageDetection({ reportId, photos }: AIDamageDetectionProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<string | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const mockResults = `AI Analysis Results for Report #${reportId}:

- Detected Damage Type: Front bumper dent
- Severity: Moderate
- Estimated Repair Cost: $500-$800
- Recommended Action: Body shop repair
- Confidence: 87%

This feature is powered by AI damage detection (feature-flagged).`;

    setResults(mockResults);
    setAnalyzing(false);
  }

  return (
    <div className="border border-blue-200 bg-blue-50 rounded p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">AI Damage Detection</h3>
          <p className="text-sm text-blue-700">Analyze damage using AI (feature-flagged)</p>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={analyzing || photos.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      {results && (
        <div className="bg-white rounded p-4 border border-blue-200">
          <pre className="text-sm whitespace-pre-wrap text-gray-800">{results}</pre>
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-blue-700">No photos available for analysis.</p>
      )}
    </div>
  );
}
