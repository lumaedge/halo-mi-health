"use client"

import { useState, useRef, useCallback } from "react"
import { Camera, FolderOpen, X, FileImage } from "lucide-react"

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void
  onFileRemoved?: () => void
  maxSizeMB?: number
}

export function UploadDropzone({ onFileSelected, onFileRemoved, maxSizeMB = 20 }: UploadDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const validateAndSet = useCallback((selected: File) => {
    setError(null)

    if (selected.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      return
    }

    if (!selected.type.startsWith("image/") && selected.type !== "application/pdf") {
      setError("Please select an image or PDF file.")
      return
    }

    setFile(selected)
    onFileSelected(selected)

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(selected)
    } else {
      setPreview(null)
    }
  }, [maxSizeMB, onFileSelected])

  const handleRemove = useCallback(() => {
    setPreview(null)
    setFile(null)
    setError(null)
    onFileRemoved?.()
    if (cameraRef.current) cameraRef.current.value = ""
    if (fileRef.current) fileRef.current.value = ""
  }, [onFileRemoved])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) validateAndSet(dropped)
  }, [validateAndSet])

  return (
    <div
      className={`relative rounded-[16px] border-2 transition-all duration-200 ${
        isDragging
          ? "border-[#007aff] bg-[#007aff]/5 border-dashed"
          : file
            ? "border-[#34c759]/30 bg-[#34c759]/5 border-solid"
            : "border-[#e5e5ea] border-dashed hover:border-[#007aff]/40 hover:bg-[#f5f5f7]"
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const s = e.target.files?.[0]; if (s) validateAndSet(s) }}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => { const s = e.target.files?.[0]; if (s) validateAndSet(s) }}
      />

      {file && preview ? (
        <div className="p-2">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-[200px] object-contain rounded-[12px] bg-black/5"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove() }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white transition-colors"
            >
              <X className="w-4 h-4 text-[#6e6e73]" />
            </button>
          </div>
          <p className="text-[13px] text-[#6e6e73] mt-2 text-center truncate px-2">{file.name}</p>
        </div>
      ) : file && !preview ? (
        <div className="p-8 text-center">
          <FileImage className="w-10 h-10 text-[#34c759] mx-auto mb-2" />
          <p className="text-[14px] text-[#1d1d1f] font-medium">{file.name}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleRemove() }}
            className="text-[13px] text-[#ff3b30] mt-1 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="w-[48px] h-[48px] rounded-[14px] bg-[#e8f0fe] flex items-center justify-center mx-auto mb-4">
            <Camera className="w-[24px] h-[24px] text-[#007aff]" />
          </div>
          <p className="text-[15px] font-medium text-[#1d1d1f] mb-4">Upload handwritten note</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click() }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#007aff] text-white text-[14px] font-medium hover:bg-[#0066d6] active:scale-[0.97] transition-all duration-200"
            >
              <Camera className="w-[18px] h-[18px]" />
              Take Photo
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#f5f5f7] text-[#1d1d1f] text-[14px] font-medium hover:bg-[#e5e5ea] active:scale-[0.97] transition-all duration-200"
            >
              <FolderOpen className="w-[18px] h-[18px]" />
              Browse Files
            </button>
          </div>
          <p className="text-[12px] text-[#6e6e73] mt-4">JPEG, PNG, HEIC, or PDF (max {maxSizeMB}MB)</p>
          <p className="text-[12px] text-[#6e6e73] mt-1">You can also drag & drop a file here</p>
        </div>
      )}

      {error && (
        <p className="text-[13px] text-[#ff3b30] px-4 pb-3 text-center">{error}</p>
      )}
    </div>
  )
}
