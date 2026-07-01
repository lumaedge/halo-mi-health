"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface ImagePreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  title: string
}

function isPdf(url: string) {
  const path = url.includes("path=") ? decodeURIComponent(url.split("path=")[1].split("&")[0]) : url
  return path.toLowerCase().endsWith(".pdf")
}

export function ImagePreview({ open, onOpenChange, imageUrl, title }: ImagePreviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] p-2">
        <DialogTitle className="sr-only">{title || "Document Preview"}</DialogTitle>
        {imageUrl ? (
          isPdf(imageUrl) ? (
            <div className="relative">
              <iframe
                src={imageUrl}
                title={title}
                className="w-full h-[70vh] rounded-[16px]"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
                  onClick={() => window.open(imageUrl, "_blank")}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[14px] text-[#6e6e73] text-center pt-2 pb-1">{title}</p>
            </div>
          ) : (
            <div className="relative">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-auto max-h-[70vh] object-contain rounded-[16px]"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-sm"
                  onClick={() => window.open(imageUrl, "_blank")}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[14px] text-[#6e6e73] text-center pt-2 pb-1">{title}</p>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-[200px] text-[#6e6e73] text-[14px]">
            No preview available
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
