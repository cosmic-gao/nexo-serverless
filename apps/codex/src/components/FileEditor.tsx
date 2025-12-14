import { useState } from 'react'
import { 
  FileCode, 
  FileJson, 
  FileType, 
  ChevronRight, 
  ChevronDown,
  Plus,
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

// 构建文件树
interface FileTreeNode {
  name: string
  path: string
  isDirectory: boolean
  children: FileTreeNode[]
  file?: ProjectFile
}

function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  files.forEach(file => {
    const parts = file.path.split('/')
    let currentLevel = root

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1
      const existingNode = currentLevel.find(n => n.name === part)

      if (existingNode) {
        if (isLast) {
          existingNode.file = file
        }
        currentLevel = existingNode.children
      } else {
        const newNode: FileTreeNode = {
          name: part,
          path: parts.slice(0, index + 1).join('/'),
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
        }
        currentLevel.push(newNode)
        currentLevel = newNode.children
      }
    })
  })

  // 排序：目录在前，文件在后
  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach(n => sortNodes(n.children))
  }
  sortNodes(root)

  return root
}

// 文件树节点组件
function FileTreeNodeComponent({
  node,
  activeFile,
  onFileSelect,
  level = 0,
}: {
  node: FileTreeNode
  activeFile: string | null
  onFileSelect: (path: string) => void
  level?: number
}) {
  const [expanded, setExpanded] = useState(true)

  if (node.isDirectory) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-surface-800 rounded text-sm text-surface-300"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-500" />
          )}
          <span>{node.name}</span>
        </button>
        {expanded && (
          <div>
            {node.children.map(child => (
              <FileTreeNodeComponent
                key={child.path}
                node={child}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
        activeFile === node.path
          ? 'bg-nexo-500/20 text-nexo-400'
          : 'text-surface-300 hover:bg-surface-800'
      }`}
      style={{ paddingLeft: `${level * 12 + 8}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  )
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
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')

  const fileTree = buildFileTree(files)
  const currentFile = files.find(f => f.path === activeFile)

  const handleCreateFile = () => {
    if (!newFileName.trim() || !onFileCreate) return

    const ext = newFileName.split('.').pop()?.toLowerCase()
    let language: ProjectFile['language'] = 'javascript'
    
    switch (ext) {
      case 'html': language = 'html'; break
      case 'css': language = 'css'; break
      case 'js': language = 'javascript'; break
      case 'jsx': language = 'jsx'; break
      case 'ts': language = 'typescript'; break
      case 'tsx': language = 'tsx'; break
      case 'vue': language = 'vue'; break
      case 'json': language = 'json'; break
    }

    onFileCreate(newFileName, language)
    setNewFileName('')
    setShowNewFileInput(false)
  }

  return (
    <div className="flex h-full">
      {/* File Tree */}
      <div className="w-56 border-r border-surface-700 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700">
          <span className="text-xs text-surface-500 uppercase font-medium">文件</span>
          {onFileCreate && !readOnly && (
            <button
              onClick={() => setShowNewFileInput(!showNewFileInput)}
              className="p-1 hover:bg-surface-700 rounded text-surface-400 hover:text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {showNewFileInput && (
          <div className="px-2 py-2 border-b border-surface-700">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              placeholder="src/newfile.ts"
              className="w-full px-2 py-1 bg-surface-800 rounded text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-1 focus:ring-nexo-500"
              autoFocus
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          {fileTree.map(node => (
            <FileTreeNodeComponent
              key={node.path}
              node={node}
              activeFile={activeFile}
              onFileSelect={onFileSelect}
            />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col">
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

