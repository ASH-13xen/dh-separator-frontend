import React, { useState } from 'react';
import UploadPage from './pages/UploadPage';
import ReorderPage from './pages/ReorderPage';
import QuesPdfPage from './pages/QuesPdfPage';
import ViewPage from './pages/ViewPage';
import CollectivePage from './pages/CollectivePage';
import ManualPage from './pages/ManualPage';
import PSIRBookPage from './pages/PSIRBookPage';
import { UploadCloud, Library, BookOpen, FileEdit, FileText, ArrowUpDown } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('collective');

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

           <div className="flex bg-gray-900 border border-gray-800 p-1 rounded-xl gap-1">
             <button 
               onClick={() => setActiveTab('upload')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'upload' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <UploadCloud className="w-4 h-4" /> Upload
             </button>
             <button 
               onClick={() => setActiveTab('reorder')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'reorder' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <ArrowUpDown className="w-4 h-4" /> Reorder
             </button>
             <button 
               onClick={() => setActiveTab('quespdf')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'quespdf' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <FileEdit className="w-4 h-4" /> Extract Qs
             </button>
             <button 
               onClick={() => setActiveTab('manual')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'manual' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <FileText className="w-4 h-4" /> Manual Mapping
             </button>
             <button 
               onClick={() => setActiveTab('collective')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'collective' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <BookOpen className="w-4 h-4" /> Collective Book
             </button>
             <button 
               onClick={() => setActiveTab('psir')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'psir' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <BookOpen className="w-4 h-4" /> PSIR Book
             </button>
             <button 
               onClick={() => setActiveTab('view')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'view' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
             >
               <FileText className="w-4 h-4" /> Library Viewer
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
        {activeTab === 'reorder' && <ReorderPage />}
        {activeTab === 'quespdf' && <QuesPdfPage />}
        {activeTab === 'view' && <ViewPage />}
        {activeTab === 'collective' && <CollectivePage />}
        {activeTab === 'psir' && <PSIRBookPage />}
        {activeTab === 'manual' && <ManualPage />}
      </div>

    </div>
  );
}

export default App;