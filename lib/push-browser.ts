export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
export async function preparePush() {
  const registration = await withTimeout(
    navigator.serviceWorker.register("/sw.js", {
      scope: "/painel",
      updateViaCache: "none",
    }),
    12000,
    "Não foi possível preparar os avisos. Toque em Atualizar aplicativo e tente novamente.",
  );
  if (registration.active?.state === "activated") return registration;
  await new Promise<void>((resolve, reject) => {
    const worker =
      registration.installing || registration.waiting || registration.active;
    if (!worker) {
      reject(
        new Error("Não foi possível iniciar os avisos. Atualize o aplicativo."),
      );
      return;
    }
    const cleanup = () => {
      clearTimeout(timer);
      worker.removeEventListener("statechange", check);
    };
    const check = () => {
      if (worker.state === "activated") {
        cleanup();
        resolve();
      } else if (worker.state === "redundant") {
        cleanup();
        reject(
          new Error("A preparação dos avisos falhou. Atualize o aplicativo."),
        );
      }
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          "A preparação dos avisos demorou demais. Atualize o aplicativo.",
        ),
      );
    }, 12000);
    worker.addEventListener("statechange", check);
    check();
  });
  return registration;
}
