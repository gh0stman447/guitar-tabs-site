import { Guitar } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Guitar className="h-4 w-4 text-amber-500" />
          <span>Олег Малыгин — гитарные табы</span>
        </div>
        <span>© {new Date().getFullYear()} Все права защищены</span>
      </div>
    </footer>
  )
}
