// The two lookups every script uses, and localStorage that never throws (a private window).
export const $ = <T extends Element = Element>(s: string, el: ParentNode = document) => el.querySelector<T>(s);
export const $$ = <T extends Element = Element>(s: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(s));
export const store = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string): void {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* private window: fine */
    }
  },
};
