import * as React from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString()
    setToasts(prev => [...prev, { id, type, message }])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const Icon = toast.type === 'success' ? CheckCircle : toast.type === 'error' ? AlertCircle : Info
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg shadow-lg min-w-[300px] max-w-md",
        toast.type === 'success' && "bg-success-50 border border-success-200",
        toast.type === 'error' && "bg-danger-50 border border-danger-200",
        toast.type === 'info' && "bg-primary-50 border border-primary-200"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0",
        toast.type === 'success' && "text-success-600",
        toast.type === 'error' && "text-danger-600",
        toast.type === 'info' && "text-primary-600"
      )} />
      <p className={cn(
        "text-sm flex-1",
        toast.type === 'success' && "text-success-900",
        toast.type === 'error' && "text-danger-900",
        toast.type === 'info' && "text-primary-900"
      )}>
        {toast.message}
      </p>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-neutral-500 hover:text-neutral-700"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
