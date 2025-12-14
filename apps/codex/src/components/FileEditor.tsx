import { 
  FileCode, 
  FileJson, 
  FileType, 
  Trash2,
  File
} from 'lucide-react'
import { ProjectFile } from '../lib/projectTemplates'

interface FileEditorProps {
  files: ProjectFile[]
  activeFile: string | null
  onFileSelect: (path: string) => void
  onFileChange: (path: string, content: string) => void
  onFileCreate?: (path: string, language: ProjectFile['language']) => void
  onFileDelete?: (path: string) => void
  readOnly?: boolean
}

// 获取文件图标
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'html':
      return <FileCode className="w-4 h-4 text-orange-400" />
    case 'css':
      return <FileType className="w-4 h-4 text-blue-400" />
    case 'js':
    case 'jsx':
      return <FileCode className="w-4 h-4 text-yellow-400" />
    case 'ts':
    case 'tsx':
      return <FileCode className="w-4 h-4 text-blue-500" />
    case 'vue':
      return <FileCode className="w-4 h-4 text-green-400" />
    case 'json':
      return <FileJson className="w-4 h-4 text-yellow-300" />
    default:
      return <File className="w-4 h-4 text-surface-400" />
  }
}


export default function FileEditor({
  files,
  activeFile,
  onFileSelect,
  onFileChange,
  onFileCreate,
  onFileDelete,
  readOnly = false,
}: FileEditorProps) {
  const currentFile = files.find(f => f.path === activeFile)

  return (
    <div className="flex h-full">
      {/* Editor */}
      <div className="flex-1 flex flex-col w-full">
        {currentFile ? (
          <>
            <div className="flex items-center justify-between px-4 py-2 border-b border-surface-700">
              <div className="flex items-center gap-2">
                {getFileIcon(currentFile.path)}
                <span className="text-sm text-surface-300">{currentFile.path}</span>
              </div>
              {onFileDelete && !readOnly && (
                <button
                  onClick={() => onFileDelete(currentFile.path)}
                  className="p-1 hover:bg-surface-700 rounded text-surface-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <textarea
                value={currentFile.content}
                onChange={(e) => onFileChange(currentFile.path, e.target.value)}
                readOnly={readOnly}
                spellCheck={false}
                className="w-full h-full p-4 bg-surface-950 text-surface-200 font-mono text-sm resize-none focus:outline-none"
                style={{ tabSize: 2 }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-surface-500">
            <div className="text-center">
              <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>选择一个文件开始编辑</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

