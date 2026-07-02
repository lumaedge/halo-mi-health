import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useI18n } from "./i18n/I18nProvider"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const { t } = useI18n()

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
      toast.success(t("online"))
    }
    function handleOffline() {
      setIsOnline(false)
      toast.error(t("offline"), { duration: 5000 })
    }
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [t])

  return isOnline
}
