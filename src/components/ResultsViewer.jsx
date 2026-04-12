import React, { useMemo } from 'react';
import { FileQuestion, FileText } from 'lucide-react';

export default function ResultsViewer({ results }) {
  const groupedResults = useMemo(() => {
    if (!results || !Array.isArray(results)) return {};
    
    return results.reduce((acc, curr) => {
      const subject = curr.subject || 'Uncategorized';
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(curr);
      return acc;
    }, {});
  }, [results]);

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-12 mb-24 space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex items-center justify-between pb-4 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileQuestion className="text-indigo-400" /> 
          UPSC Document Index
        </h2>
        <div className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-medium text-white shadow-lg">
          {results.length} Indexed Topics
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(groupedResults).map(([subject, items], index) => (
          <div key={index} className="space-y-4">
            <h3 className="text-xl font-semibold text-indigo-300 sticky top-0 bg-[#0f172a] py-2 z-10 flex items-center gap-2">
               <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block"></span>
               {subject} <span className="text-sm font-normal text-gray-500 ml-2">({items.length} questions)</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((qa, idx) => (
                <div key={idx} className="bg-gray-800/60 border border-gray-700 p-6 rounded-2xl shadow-xl hover:border-indigo-500/50 transition-colors flex flex-col justify-between">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="pr-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Question</h4>
                        {/* Updated to use question_text */}
                        <p className="text-white font-medium text-md leading-snug">{qa.question_text}</p>
                      </div>
                      
                      {/* Updated to show Start and End Pages */}
                      <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-bold border border-indigo-500/30 whitespace-nowrap">
                        Pgs {qa.start_page}-{qa.end_page}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Detailed Topic</h4>
                    <p className="text-gray-300 leading-relaxed font-light">{qa.topic}</p>
                  </div>

                  {/* New Button to view the sliced PDF */}
                  {qa.file_url && (
                    <a 
                      href={`http://localhost:5000${qa.file_url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-indigo-600 text-white py-2 rounded-lg transition-colors font-medium text-sm"
                    >
                      <FileText className="w-4 h-4" /> View Extracted PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}