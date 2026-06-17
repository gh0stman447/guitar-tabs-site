// Yandex Metrika global
interface Window {
  ym?: (counterId: number, command: string, ...args: unknown[]) => void;
}
