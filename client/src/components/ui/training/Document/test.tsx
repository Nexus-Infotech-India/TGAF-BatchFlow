"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  File,
  FileText,
  FileIcon as FilePdf,
  FileImage,
  Download,
  Trash2,
  Search,
  Filter,
  Upload,
  Edit,
  Eye,
  FolderOpen,
  Calendar,
  Clock,
  User,
  Sparkles,
  Award,
  TrendingUp,
  Plus,
  Grid,
  List,
  Heart,
  Share2,
  ChevronRight,
  Zap,
  X,
  Check,
  ChevronDown,
} from "lucide-react"

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.08,
      duration: 0.8,
      ease: "easeOut",
    },
  },
}

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
  },
}

const cardVariants = {
  hidden: { scale: 0.9, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: "easeOut",
      type: "spring",
      stiffness: 400,
    },
  },
}

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

// Custom Button Component
const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled = false,
  ...props
}: {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
  className?: string
  onClick?: () => void
  disabled?: boolean
  [key: string]: any
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500",
    secondary:
      "bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 shadow-sm hover:shadow-md focus:ring-slate-500",
    outline:
      "border-2 border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 shadow-sm hover:shadow-md focus:ring-slate-500",
    ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-800 focus:ring-slate-500",
    destructive:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl focus:ring-red-500",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Custom Input Component
const Input = ({
  placeholder,
  value,
  onChange,
  className = "",
  icon,
  ...props
}: {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  icon?: React.ReactNode
  [key: string]: any
}) => {
  return (
    <div className="relative">
      {icon && <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">{icon}</div>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-3 ${icon ? "pl-10" : ""} bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
        {...props}
      />
    </div>
  )
}

// Custom Textarea Component
const Textarea = ({
  placeholder,
  value,
  onChange,
  rows = 4,
  className = "",
  ...props
}: {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  rows?: number
  className?: string
  [key: string]: any
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none ${className}`}
      {...props}
    />
  )
}

// Custom Select Component
const Select = ({
  options,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  options: { value: string; label: string }[]
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-between text-left"
      >
        <span className={selectedOption ? "text-slate-700" : "text-slate-400"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange?.(option.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors duration-150 text-slate-700"
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Custom Checkbox Component
const Checkbox = ({
  checked,
  onChange,
  className = "",
}: {
  checked?: boolean
  onChange?: (checked: boolean) => void
  className?: string
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onChange?.(!checked)}
      className={`w-5 h-5 border-2 rounded-md transition-all duration-200 flex items-center justify-center ${
        checked ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300 hover:border-slate-400"
      } ${className}`}
    >
      {checked && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
          <Check size={12} className="text-white" />
        </motion.div>
      )}
    </motion.button>
  )
}

// Custom Modal Component
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-2xl",
}: {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  children: React.ReactNode
  maxWidth?: string
}) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 w-full ${maxWidth} max-h-[90vh] overflow-auto`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
          )}
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Custom Badge Component
const Badge = ({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode
  variant?: "default" | "secondary" | "success" | "warning" | "error"
  className?: string
}) => {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    secondary: "bg-blue-100 text-blue-700",
    success: "bg-emerald-100 text-emerald-700",
    warning: "bg-amber-100 text-amber-700",
    error: "bg-red-100 text-red-700",
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

// Enhanced file type icons
const getFileIcon = (fileUrl: string, size = 48) => {
  if (!fileUrl) return <File size={size} className="text-slate-400" />

  const extension = fileUrl.split(".").pop()?.toLowerCase()

  const iconConfigs = {
    pdf: {
      icon: FilePdf,
      gradient: "from-red-400 to-red-600",
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      shadow: "shadow-red-200/50",
      label: "PDF",
      labelBg: "bg-red-500",
    },
    doc: {
      icon: FileText,
      gradient: "from-blue-400 to-blue-600",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      shadow: "shadow-blue-200/50",
      label: "DOC",
      labelBg: "bg-blue-500",
    },
    docx: {
      icon: FileText,
      gradient: "from-blue-400 to-blue-600",
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      shadow: "shadow-blue-200/50",
      label: "DOC",
      labelBg: "bg-blue-500",
    },
    xls: {
      icon: FileText,
      gradient: "from-emerald-400 to-emerald-600",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      shadow: "shadow-emerald-200/50",
      label: "XLS",
      labelBg: "bg-emerald-500",
    },
    xlsx: {
      icon: FileText,
      gradient: "from-emerald-400 to-emerald-600",
      bg: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      shadow: "shadow-emerald-200/50",
      label: "XLS",
      labelBg: "bg-emerald-500",
    },
    ppt: {
      icon: FileText,
      gradient: "from-orange-400 to-orange-600",
      bg: "bg-gradient-to-br from-orange-50 to-orange-100",
      shadow: "shadow-orange-200/50",
      label: "PPT",
      labelBg: "bg-orange-500",
    },
    pptx: {
      icon: FileText,
      gradient: "from-orange-400 to-orange-600",
      bg: "bg-gradient-to-br from-orange-50 to-orange-100",
      shadow: "shadow-orange-200/50",
      label: "PPT",
      labelBg: "bg-orange-500",
    },
    jpg: {
      icon: FileImage,
      gradient: "from-purple-400 to-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      shadow: "shadow-purple-200/50",
      label: "IMG",
      labelBg: "bg-purple-500",
    },
    jpeg: {
      icon: FileImage,
      gradient: "from-purple-400 to-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      shadow: "shadow-purple-200/50",
      label: "IMG",
      labelBg: "bg-purple-500",
    },
    png: {
      icon: FileImage,
      gradient: "from-purple-400 to-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      shadow: "shadow-purple-200/50",
      label: "IMG",
      labelBg: "bg-purple-500",
    },
    gif: {
      icon: FileImage,
      gradient: "from-purple-400 to-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      shadow: "shadow-purple-200/50",
      label: "GIF",
      labelBg: "bg-purple-500",
    },
    webp: {
      icon: FileImage,
      gradient: "from-purple-400 to-purple-600",
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      shadow: "shadow-purple-200/50",
      label: "IMG",
      labelBg: "bg-purple-500",
    },
  }

  const config = iconConfigs[extension as keyof typeof iconConfigs] || {
    icon: File,
    gradient: "from-slate-400 to-slate-600",
    bg: "bg-gradient-to-br from-slate-50 to-slate-100",
    shadow: "shadow-slate-200/50",
    label: "FILE",
    labelBg: "bg-slate-500",
  }

  const IconComponent = config.icon

  return (
    <div className="relative group">
      <motion.div
        className={`p-4 ${config.bg} rounded-2xl ${config.shadow} shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:scale-105`}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        <IconComponent
          size={size}
          className={`text-transparent bg-gradient-to-br ${config.gradient} bg-clip-text`}
          style={{ WebkitBackgroundClip: "text" }}
        />
      </motion.div>
      <motion.div
        className={`absolute -top-2 -right-2 ${config.labelBg} text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
      >
        {config.label}
      </motion.div>
    </div>
  )
}

// Enhanced document type badges
const getDocumentTypeBadge = (type: string) => {
  const badgeConfig = {
    PRESENTATION: {
      color: "bg-gradient-to-r from-blue-500 to-blue-600",
      label: "Presentation",
      icon: "📊",
      textColor: "text-white",
    },
    MANUAL: {
      color: "bg-gradient-to-r from-emerald-500 to-emerald-600",
      label: "Manual",
      icon: "📖",
      textColor: "text-white",
    },
    CERTIFICATE: {
      color: "bg-gradient-to-r from-amber-400 to-amber-500",
      label: "Certificate",
      icon: "🏆",
      textColor: "text-white",
    },
    WORKSHEET: {
      color: "bg-gradient-to-r from-purple-500 to-purple-600",
      label: "Worksheet",
      icon: "📝",
      textColor: "text-white",
    },
    REPORT: {
      color: "bg-gradient-to-r from-red-500 to-red-600",
      label: "Report",
      icon: "📋",
      textColor: "text-white",
    },
    OTHER: {
      color: "bg-gradient-to-r from-slate-400 to-slate-500",
      label: "Other",
      icon: "📄",
      textColor: "text-white",
    },
  }

  const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.OTHER

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`${config.color} ${config.textColor} px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1.5 backdrop-blur-sm`}
    >
      <span className="text-sm">{config.icon}</span>
      {config.label}
    </motion.div>
  )
}

// Enhanced file preview
const getFilePreview = (document: any) => {
  const fileUrl = document.fileUrl
  const isPdf = fileUrl?.toLowerCase().endsWith(".pdf")
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl || "")

  if (isImage) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden group">
        <img
          src={fileUrl || "/placeholder.svg?height=400&width=600"}
          alt={document.title}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
          onError={(e) => {
            ;(e.target as HTMLImageElement).style.display = "none"
            ;(e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden")
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center bg-purple-50">
          {getFileIcon(fileUrl, 64)}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        <motion.div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ scale: 0 }}
          whileHover={{ scale: 1.1 }}
        >
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Image Preview
          </div>
        </motion.div>
        <motion.div
          className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
          initial={{ y: 20 }}
          whileHover={{ y: 0 }}
        >
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Click to view
          </div>
        </motion.div>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="relative w-full h-48 bg-gradient-to-br from-red-50 via-red-100 to-red-200 rounded-xl overflow-hidden group flex items-center justify-center">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {getFileIcon(fileUrl, 64)}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-red-600/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        <motion.div
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
          initial={{ scale: 0, rotate: -10 }}
          whileHover={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            PDF Document
          </div>
        </motion.div>
        <motion.div
          className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100"
          initial={{ y: 20, opacity: 0 }}
          whileHover={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Click to preview
          </div>
        </motion.div>
      </div>
    )
  }

  // Default preview for other file types
  const extension = fileUrl?.split(".").pop()?.toLowerCase()
  const bgGradients = {
    doc: "from-blue-50 via-blue-100 to-blue-200",
    docx: "from-blue-50 via-blue-100 to-blue-200",
    xls: "from-emerald-50 via-emerald-100 to-emerald-200",
    xlsx: "from-emerald-50 via-emerald-100 to-emerald-200",
    ppt: "from-orange-50 via-orange-100 to-orange-200",
    pptx: "from-orange-50 via-orange-100 to-orange-200",
  }

  const bgGradient = bgGradients[extension as keyof typeof bgGradients] || "from-slate-50 via-slate-100 to-slate-200"

  return (
    <div
      className={`relative w-full h-48 bg-gradient-to-br ${bgGradient} rounded-xl overflow-hidden group flex items-center justify-center`}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.1, rotate: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {getFileIcon(fileUrl, 64)}
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
      <motion.div
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1.05 }}
      >
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
          {extension?.toUpperCase() || "FILE"}
        </div>
      </motion.div>
    </div>
  )
}

// Mock data
const mockDocuments = [
  {
    id: "1",
    title: "Employee Training Manual 2024",
    description: "Comprehensive guide for new employee onboarding and training procedures",
    fileUrl: "/placeholder.svg?height=400&width=600.pdf",
    documentType: "MANUAL",
    createdAt: "2024-01-15T10:30:00Z",
    uploadedBy: { name: "Sarah Johnson" },
    training: { id: "1", title: "Onboarding Program" },
  },
  {
    id: "2",
    title: "Q4 Sales Presentation",
    description: "Quarterly sales results and projections for the upcoming year",
    fileUrl: "/placeholder.svg?height=400&width=600.pptx",
    documentType: "PRESENTATION",
    createdAt: "2024-01-10T14:20:00Z",
    uploadedBy: { name: "Mike Chen" },
    training: { id: "2", title: "Sales Training" },
  },
  {
    id: "3",
    title: "Safety Certificate Template",
    description: "Official template for workplace safety certification",
    fileUrl: "/placeholder.svg?height=400&width=600.pdf",
    documentType: "CERTIFICATE",
    createdAt: "2024-01-08T09:15:00Z",
    uploadedBy: { name: "Emma Davis" },
    training: { id: "3", title: "Safety Training" },
  },
  {
    id: "4",
    title: "Product Catalog Images",
    description: "High-resolution images of our latest product lineup",
    fileUrl: "/placeholder.svg?height=400&width=600.jpg",
    documentType: "OTHER",
    createdAt: "2024-01-05T16:45:00Z",
    uploadedBy: { name: "Alex Wilson" },
    training: null,
  },
  {
    id: "5",
    title: "Training Worksheet - Module 1",
    description: "Interactive worksheet for the first training module",
    fileUrl: "/placeholder.svg?height=400&width=600.docx",
    documentType: "WORKSHEET",
    createdAt: "2024-01-03T11:30:00Z",
    uploadedBy: { name: "Lisa Brown" },
    training: { id: "4", title: "Basic Skills Training" },
  },
  {
    id: "6",
    title: "Monthly Performance Report",
    description: "Detailed analysis of team performance metrics",
    fileUrl: "/placeholder.svg?height=400&width=600.xlsx",
    documentType: "REPORT",
    createdAt: "2024-01-01T08:00:00Z",
    uploadedBy: { name: "David Kim" },
    training: null,
  },
]

const DocumentLibrary: React.FC = () => {
  // State management
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filters, setFilters] = useState({
    documentType: "",
    dateRange: "",
  })
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [editDocument, setEditDocument] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    documentType: "",
  })

  // Mock data
  const [documents] = useState(mockDocuments)
  const totalDocuments = documents.length
  const documentsThisMonth = documents.filter(
    (doc) => new Date(doc.createdAt).getMonth() === new Date().getMonth(),
  ).length
  const avgDocumentsPerDay = Math.round(totalDocuments / 30)

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !filters.documentType || doc.documentType === filters.documentType
    return matchesSearch && matchesType
  })

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    if (checked) {
      setSelectedRows([...selectedRows, documentId])
    } else {
      setSelectedRows(selectedRows.filter((id) => id !== documentId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredDocuments.map((doc) => doc.id))
    } else {
      setSelectedRows([])
    }
  }

  const resetFilters = () => {
    setFilters({ documentType: "", dateRange: "" })
    setSearchQuery("")
  }

  const handleEditDocument = (document: any) => {
    setEditDocument(document)
    setEditForm({
      title: document.title || "",
      description: document.description || "",
      documentType: document.documentType || "",
    })
  }

  const documentTypeOptions = [
    { value: "PRESENTATION", label: "📊 Presentation" },
    { value: "MANUAL", label: "📖 Manual" },
    { value: "CERTIFICATE", label: "🏆 Certificate" },
    { value: "WORKSHEET", label: "📝 Worksheet" },
    { value: "REPORT", label: "📋 Report" },
    { value: "OTHER", label: "📄 Other" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <motion.div
        className="max-w-7xl mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Stunning Header Section */}
        <motion.div
          variants={itemVariants}
          className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8"
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50" />
          <div className="absolute top-0 right-0 -mt-4 -mr-4">
            <motion.div variants={floatingVariants} animate="animate">
              <Sparkles size={80} className="text-blue-200/40" />
            </motion.div>
          </div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4">
            <motion.div variants={floatingVariants} animate="animate" transition={{ delay: 1 }}>
              <Zap size={60} className="text-purple-200/40" />
            </motion.div>
          </div>

          {/* Header Content */}
          <div className="relative p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <FolderOpen className="text-white" size={28} />
                </motion.div>
                <div>
                  <motion.h1
                    className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    Document Library
                  </motion.h1>
                  <motion.p
                    className="text-slate-600 text-lg mt-1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Discover, organize, and manage your documents with style
                  </motion.p>
                </div>
              </div>

              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button variant="outline" size="lg" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                  {viewMode === "grid" ? <List size={18} /> : <Grid size={18} />}
                  <span className="ml-2">{viewMode === "grid" ? "List View" : "Grid View"}</span>
                </Button>
                <Button size="lg">
                  <Upload size={18} className="mr-2" />
                  Upload Documents
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Stats Section */}
          <div className="relative p-8 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: FolderOpen,
                  label: "Total Documents",
                  value: totalDocuments,
                  change: "All files",
                  color: "from-blue-500 to-blue-600",
                  bgColor: "from-blue-50 to-blue-100",
                  iconColor: "text-blue-600",
                },
                {
                  icon: Calendar,
                  label: "This Month",
                  value: documentsThisMonth,
                  change: "New uploads",
                  color: "from-emerald-500 to-emerald-600",
                  bgColor: "from-emerald-50 to-emerald-100",
                  iconColor: "text-emerald-600",
                },
                {
                  icon: TrendingUp,
                  label: "Average/Day",
                  value: avgDocumentsPerDay,
                  change: "Upload rate",
                  color: "from-purple-500 to-purple-600",
                  bgColor: "from-purple-50 to-purple-100",
                  iconColor: "text-purple-600",
                },
                {
                  icon: Award,
                  label: "File Types",
                  value: new Set(documents.map((doc) => doc.fileUrl?.split(".").pop()?.toLowerCase())).size,
                  change: "Formats",
                  color: "from-amber-500 to-amber-600",
                  bgColor: "from-amber-50 to-amber-100",
                  iconColor: "text-amber-600",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="relative bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 overflow-hidden group"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-50 transition-opacity duration-300`}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-3 bg-gradient-to-br ${stat.bgColor} rounded-xl`}>
                        <stat.icon size={24} className={stat.iconColor} />
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        <ChevronRight size={16} className="text-slate-400" />
                      </motion.div>
                    </div>
                    <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-800 mb-2">{stat.value}</p>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 bg-gradient-to-r ${stat.color} rounded-full mr-2`} />
                      <span className="text-xs text-slate-500 font-medium">{stat.change}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Search and Filters */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search documents by title, description, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  icon={<Search size={20} />}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Select
                  options={[{ value: "", label: "📄 All Types" }, ...documentTypeOptions]}
                  value={filters.documentType}
                  onChange={(value) => setFilters({ ...filters, documentType: value })}
                  placeholder="📄 Document Type"
                  className="w-48"
                />

                <Button variant="outline" onClick={resetFilters}>
                  <Filter size={16} className="mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Selection Actions */}
            {selectedRows.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Checkbox checked />
                    </div>
                    <span className="font-semibold text-blue-800">
                      {selectedRows.length} document{selectedRows.length !== 1 ? "s" : ""} selected
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Share2 size={14} className="mr-2" />
                      Share
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash2 size={14} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Enhanced Document Grid */}
        <motion.div variants={itemVariants}>
          {filteredDocuments.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl py-20 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                className="p-8 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full inline-block mb-6"
              >
                <FolderOpen size={64} className="text-slate-400" />
              </motion.div>
              <h3 className="text-2xl font-bold text-slate-700 mb-3">No documents found</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                {searchQuery || filters.documentType
                  ? "Try adjusting your search criteria or filters"
                  : "Start building your library by uploading your first document"}
              </p>
              <Button size="lg">
                <Upload size={20} className="mr-2" />
                Upload Your First Document
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Select All Checkbox */}
              <div className="flex items-center space-x-3 px-2">
                <Checkbox checked={selectedRows.length === filteredDocuments.length} onChange={handleSelectAll} />
                <span className="text-sm font-medium text-slate-600">
                  Select all {filteredDocuments.length} documents
                </span>
              </div>

              {/* Document Grid */}
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1"
                }`}
              >
                <AnimatePresence>
                  {filteredDocuments.map((document, index) => (
                    <motion.div
                      key={document.id}
                      layout
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover="hover"
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="h-full bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden group rounded-2xl">
                        <div className="relative">
                          {/* File Preview */}
                          <div className="cursor-pointer" onClick={() => setPreviewDocument(document)}>
                            {getFilePreview(document)}
                          </div>

                          {/* Selection Checkbox */}
                          <div className="absolute top-3 left-3">
                            <Checkbox
                              checked={selectedRows.includes(document.id)}
                              onChange={(checked) => handleSelectDocument(document.id, checked)}
                            />
                          </div>

                          {/* Document Type Badge */}
                          <div className="absolute top-3 right-3">{getDocumentTypeBadge(document.documentType)}</div>

                          {/* Favorite Button */}
                          <motion.div
                            className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <button className="bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200">
                              <Heart size={14} className="text-red-500" />
                            </button>
                          </motion.div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <div className="mb-4">
                            <h3
                              className="font-semibold text-slate-800 hover:text-blue-600 cursor-pointer text-sm line-clamp-2 mb-2 transition-colors duration-200"
                              onClick={() => setPreviewDocument(document)}
                            >
                              {document.title}
                            </h3>

                            {document.description && (
                              <p className="text-slate-500 text-xs line-clamp-2 mb-3">{document.description}</p>
                            )}
                          </div>

                          {/* Training Link */}
                          {document.training && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100/50">
                              <div className="flex items-center text-blue-600 hover:text-blue-700 cursor-pointer text-xs font-medium">
                                <FolderOpen size={12} className="mr-2" />
                                {document.training.title}
                              </div>
                            </div>
                          )}

                          {/* Meta Info */}
                          <div className="text-xs text-slate-500 space-y-2 mb-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <Clock size={10} className="mr-1" />
                                {new Date(document.createdAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <User size={10} className="mr-1" />
                                {document.uploadedBy?.name?.split(" ")[0] || "Unknown"}
                              </div>
                            </div>
                            <div className="text-center">
                              <Badge variant="secondary" className="text-xs">
                                {document.fileUrl?.split(".").pop()?.toUpperCase() || "FILE"} •{" "}
                                {Math.round(Math.random() * 5) + 0.5} MB
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setPreviewDocument(document)}
                                className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-50 rounded-md transition-colors duration-200"
                              >
                                <Eye size={14} />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditDocument(document)}
                                className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors duration-200"
                              >
                                <Edit size={14} />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => window.open(document.fileUrl, "_blank")}
                                className="w-8 h-8 flex items-center justify-center text-purple-600 hover:bg-purple-50 rounded-md transition-colors duration-200"
                              >
                                <Download size={14} />
                              </motion.button>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>

        {/* Document Preview Modal */}
        <Modal
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          title={
            <div className="flex items-center gap-3">
              {getFileIcon(previewDocument?.fileUrl || "", 24)}
              <div>
                <span className="text-xl font-semibold">{previewDocument?.title || "Document Preview"}</span>
                <div className="text-sm text-slate-500 font-normal">
                  {previewDocument?.fileUrl?.split(".").pop()?.toUpperCase()} • {Math.round(Math.random() * 5) + 0.5} MB
                </div>
              </div>
            </div>
          }
          maxWidth="max-w-6xl"
        >
          <div className="space-y-6">
            {/* Document Info */}
            <div className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-2">Document Type</div>
                  {getDocumentTypeBadge(previewDocument?.documentType)}
                </div>

                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-2">Uploaded By</div>
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <User size={12} className="text-blue-600" />
                    </div>
                    <span className="font-medium">{previewDocument?.uploadedBy?.name || "Unknown"}</span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-2">Upload Date</div>
                  <div className="flex items-center justify-center">
                    <Calendar size={12} className="mr-1 text-blue-500" />
                    <span className="font-medium">
                      {previewDocument?.createdAt
                        ? new Date(previewDocument.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-slate-500 mb-2">Related Training</div>
                  <div className="flex items-center justify-center">
                    <FolderOpen size={12} className="mr-1 text-blue-500" />
                    <span className="font-medium">{previewDocument?.training?.title || "None"}</span>
                  </div>
                </div>
              </div>

              {previewDocument?.description && (
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-2">Description</div>
                  <div className="p-3 bg-white rounded-lg border">
                    <p>{previewDocument.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Content */}
            <div className="flex justify-center rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 min-h-[400px]">
              <div className="w-full flex justify-center items-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-6">{getFileIcon(previewDocument?.fileUrl || "", 80)}</div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Document Preview</h3>
                  <p className="text-slate-500 mb-6">Click download to view the full document content.</p>
                  <Button size="lg" onClick={() => window.open(previewDocument?.fileUrl, "_blank")}>
                    <Download size={18} className="mr-2" />
                    Download Document
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>

        {/* Edit Document Modal */}
        <Modal
          isOpen={!!editDocument}
          onClose={() => setEditDocument(null)}
          title={
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit size={16} className="text-blue-600" />
              </div>
              Edit Document Metadata
            </div>
          }
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Document Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="Enter document title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter document description"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Document Type</label>
              <Select
                options={documentTypeOptions}
                value={editForm.documentType}
                onChange={(value) => setEditForm({ ...editForm, documentType: value })}
                placeholder="Select document type"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setEditDocument(null)}>
                Cancel
              </Button>
              <Button onClick={() => setEditDocument(null)}>Save Changes</Button>
            </div>
          </div>
        </Modal>

        {/* Floating Upload Button */}
        <motion.div
          className="fixed bottom-8 right-8 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 400 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <button className="rounded-full w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xl border-0 flex items-center justify-center transition-all duration-300">
            <Plus size={24} />
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default DocumentLibrary
