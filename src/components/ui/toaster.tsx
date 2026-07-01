import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        },
      }}
    />
  )
}
