import React, { useState } from 'react';
import PdfUploader from '../components/PdfUploader';
import ResultsViewer from '../components/ResultsViewer';
import { uploadPdf } from '../services/api';
import { AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  
  // Metadata States
  const [metadataList, setMetadataList] = useState([
    {
      topperName: '',
      topperYear: '',
      topperRank: '',
      topperMarks: ''
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const handleFileSubmit = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setIsLoading(true);
    setError('');
    setResults([]);

    try {
      const response = await uploadPdf(file, metadataList);
      setResults(response.data);
    } catch (err) {
      setError(err.error || err.message || "Failed to process document.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

 const handleDownloadPdf = () => {
  if (!results || results.length === 0) return;
  
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('UPSC Document Index Report', 14, 22);
  
  doc.setFontSize(11);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

  const tableData = results.map((item, index) => {
    let subject = 'Uncategorized';
    let topic = '';
    
    if (item.tags && item.tags.length > 0) {
      subject = item.tags[0];
      topic = item.tags.slice(1).join(' > ');
    }

    return [
      index + 1,
      subject,
      item.question_text || '-',
      topic,
      `Pgs ${item.start_page || '?'}-${item.end_page || '?'}`
    ];
  });

  autoTable(doc, {
    startY: 35,
    // Renamed header for clarity
    head: [['#', 'Subject', 'Question', 'Syllabus Topic', 'Pages']], 
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 35 },
      2: { cellWidth: 60 },
      3: { cellWidth: 'auto' }, // Topic gets the most space
      4: { cellWidth: 20 },
    },
  });

  doc.save('UPSC_Document_Index.pdf');
};

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-100 p-6 md:p-12 font-sans">
      
      <header className="max-w-4xl mx-auto text-center mt-10 mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4">
          UPSC AI Transcriber
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload massive handwritten notes and automatically extract, categorize, and reconstruct Q&A pairs into standard syllabus topics utilizing intelligent stateful chunking.
        </p>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        
        <PdfUploader 
          onFileSelect={(selected) => {
            setFile(selected);
            setError(''); 
          }} 
          metadataList={metadataList}
          onUpdateMetadataList={(newList) => setMetadataList(newList)}
          isProcessing={isLoading} 
        />

        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center gap-3 max-w-2xl mx-auto shadow-lg animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="text-red-400 flex-shrink-0" />
            <p className="font-medium text-sm md:text-base">{error}</p>
          </div>
        )}

        {file && !isLoading && !results.length && !error && (
          <div className="flex justify-center mt-6 animate-in fade-in zoom-in-95">
             <button
               onClick={handleFileSubmit}
               className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-4 px-12 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-lg"
             >
               <CheckCircle2 /> Process Document
             </button>
          </div>
        )}

        {results.length > 0 && (
          <div className="flex justify-end animate-in fade-in slide-in-from-bottom-4">
             <button
               onClick={handleDownloadPdf}
               className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-medium py-2 px-6 rounded-lg shadow-lg transition-all flex items-center gap-2"
             >
               <Download className="w-5 h-5" /> Download as PDF
             </button>
          </div>
        )}

        <ResultsViewer 
          results={results} 
          onResultUpdate={(updated) => {
            setResults(prev => prev.map(r => r._id === updated._id ? updated : r));
          }}
        />

      </main>

    </div>
  );
}