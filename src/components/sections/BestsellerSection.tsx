"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Music } from "lucide-react"
import { MOCK_TABS } from "./TabsSection"

const TOP_TABS = [...MOCK_TABS].sort((a, b) => b.purchase_count - a.purchase_count).slice(0, 3)

function getDifficultyColor(difficulty: string) {
  const num = parseInt(difficulty)
  if (num <= 3) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
  if (num <= 6) return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
}

export function BestsellerSection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary/40">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-amber-500 text-sm font-medium tracking-widest uppercase">
              Популярное
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Покупают чаще всего</h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TOP_TABS.map((tab, i) => (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <Card className="overflow-hidden border-border hover:border-amber-300 dark:hover:border-amber-700 transition-colors relative">
                {i === 0 && (
                  <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    #1
                  </div>
                )}
                <div className="aspect-video bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-zinc-900 flex items-center justify-center">
                  <Music className="h-10 w-10 text-amber-400" strokeWidth={1} />
                </div>
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{tab.title}</h3>
                    <span className={`shrink-0 text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(tab.difficulty)}`}>
                      {tab.difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{tab.purchase_count} покупок</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{tab.price} ₽</span>
                    <Button
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-4 text-xs"
                    >
                      Купить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
