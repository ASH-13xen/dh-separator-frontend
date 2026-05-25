import React, { useState } from 'react';
import UploadPage from './pages/UploadPage';
import QuesPdfPage from './pages/QuesPdfPage';
import ViewPage from './pages/ViewPage';
import CollectivePage from './pages/CollectivePage';
import ManualPage from './pages/ManualPage';
import { UploadCloud, Library, BookOpen, FileEdit, FileText } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('upload');

  // Lifted State for UploadPage
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadError, setUploadError] = useState('');

  return (
    <div className="min-h-screen bg-[#060b14] flex flex-col font-sans">
      
      {/* Universal Top Navigation */}
      <nav className="w-full bg-[#0f172a] border-b border-gray-800 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
           
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg">
                <Library className="text-white w-5 h-5" />
             </div>
             <span className="font-extrabold text-xl tracking-tight text-white hidden md:block">UPSC Hub</span>
           </div>

           <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
              >
                <UploadCloud className="w-4 h-4" /> Upload
              </button>
              <button 
                onClick={() => setActiveTab('quespdf')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'quespdf' ? 'bg-teal-650 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
              >
                <FileText className="w-4 h-4" /> QuesPDF Maker
              </button>
              <button 
                onClick={() => setActiveTab('view')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'view' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <Library className="w-4 h-4" /> View Library
             </button>
             <button 
               onClick={() => setActiveTab('collective')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'collective' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <BookOpen className="w-4 h-4" /> Collective Book
             </button>
             <button 
               onClick={() => setActiveTab('manual')}
               className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'manual' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <FileEdit className="w-4 h-4" /> Manual Questions
             </button>
           </div>
           
        </div>
      </nav>

      {/* Dynamic View Injection */}
      <div className="flex-1 w-full bg-[#0f172a]/50">
        {activeTab === 'upload' && (
          <UploadPage 
            persistedFile={uploadFile} setPersistedFile={setUploadFile}
            persistedResults={uploadResults} setPersistedResults={setUploadResults}
            persistedError={uploadError} setPersistedError={setUploadError}
          />
        )}
        {activeTab === 'quespdf' && <QuesPdfPage />}
        {activeTab === 'view' && <ViewPage />}
        {activeTab === 'collective' && <CollectivePage />}
        {activeTab === 'manual' && <ManualPage />}
      </div>

    </div>
  );
}

export default App;