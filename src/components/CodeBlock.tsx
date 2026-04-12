import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CodeBlockProps {
  code: string
  language?: string
  className?: string
  showCopy?: boolean
}

export function CodeBlock({ code, language, className, showCopy = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative group rounded-lg border border-gray-800 bg-gray-950', className)}>
      {language && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
          <span className="text-xs font-mono text-gray-500 uppercase">{language}</span>
          {showCopy && (
            <button
              onClick={handleCopy}
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded"
              title="Copy code"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          )}
        </div>
      )}
      <div className="relative">
        {!language && showCopy && (
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded z-10"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        )}
        <pre className="overflow-x-auto p-4 text-sm text-gray-300 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}
