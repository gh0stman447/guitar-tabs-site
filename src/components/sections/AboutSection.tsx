"use client"

import { motion } from "framer-motion"
import { Music, Guitar, Headphones } from "lucide-react"

const facts = [
  { icon: Guitar, label: "Гитарист", desc: "Играю более 10 лет" },
  { icon: Music, label: "Аранжировщик", desc: "Авторские обработки песен" },
  { icon: Headphones, label: "Музыкант", desc: "Разные жанры и стили" },
]

export function AboutSection() {
  return (
    <section id="about" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Photo placeholder */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="aspect-square max-w-sm mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-950/20 flex items-center justify-center border border-amber-200 dark:border-amber-800/30">
              <Guitar className="h-24 w-24 text-amber-400" strokeWidth={1} />
            </div>
            {/* Decorative element */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-amber-400/10 rounded-2xl -z-10" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-amber-500 text-sm font-medium tracking-widest uppercase">
              Обо мне
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 mb-6">
              Привет, я Олег
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Я гитарист и аранжировщик. Создаю точные табы популярных песен,
              адаптируя их под соло-гитару. Каждая аранжировка — это не просто
              ноты, а переосмысление оригинала с сохранением характера мелодии.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-8">
              Все табы написаны вручную и проверены на практике. Указываю
              уровень сложности, чтобы ты мог выбрать подходящий для себя материал.
            </p>

            <div className="grid grid-cols-3 gap-4">
              {facts.map(({ icon: Icon, label, desc }) => (
                <div key={label} className="text-center p-4 rounded-xl bg-secondary">
                  <Icon className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                  <div className="font-medium text-sm">{label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
