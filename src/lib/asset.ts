/** Resolve a file in public/assets/ against the deploy base (/phenome-longevity-prototype/). */
export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path.replace(/^\/+/, "")}`;
}

export const icon = (name: string) => asset(`icons/${name}.svg`);
export const photo = (name: string) => asset(`photos/${name}`);
