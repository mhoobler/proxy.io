import { HttpRequest, HttpResponse } from '../http-server/http-server';

export type ProxyFunction = (
  clientReq?: HttpRequest,
  clientRes?: HttpResponse,
) => void | boolean;

export type ProxyScripts = {
  [key: string]: ProxyScripts | ProxyFunction
}; 

let Memo: any = {};
let Scripts: ProxyScripts = {};
type ScriptCallback = any;

export function AddScript(path: string, cb: ScriptCallback) {
  Memo = {};

  const split = path.split('/');
  const last = split.pop() as string;

  let curr: ProxyScripts = Scripts;
  for(const s of split) {
    if(curr[s] === undefined) {
      curr[s] = {};
    }
    curr = curr[s] as ProxyScripts;
  }
  curr[last] = cb;
}

export function SearchScript(url: string | void) {
  if(!url) { return null; }
  if(Memo[url]) { return Memo[url] };

  const split = url.split('/');
  while('' === split[0]) {
    split.shift();
  }
  let lastIndex = split.length - 1;
  while('' === split[lastIndex]) {
    split.pop();
    lastIndex--;
  }

  let curr: ProxyScripts = Scripts;
  let lastStar: ProxyFunction | null = null;
  const lastKey = split[lastIndex];
  // Initialize last star to Scripts['*'] if it's a function
  if(Scripts['*'] && typeof Scripts['*'] === 'function') {
    lastStar = Scripts['*'];
  }

  const path = [];
  for(const str of split) {
    path.push(str);

    const isObject = typeof curr[str] === 'object' ? 1 : 0;
    const isLast = str === lastKey ? 2 : 0;
    let switchCase = isObject + isLast;
    switch(switchCase) {
      case 1: { // We're on an object, and need to explore it
        curr = curr[str] as ProxyScripts;
        if(curr['*'] && typeof curr['*'] === 'function') {
          lastStar = curr['*'];
        }
        break;
      }
      case 2: { // We're ending on a function/undefined
        const result = curr[str] || lastStar;
        Memo[url] = result;
        return result as ProxyFunction;
      }
      case 3: { // We're ending on an object, but path ends
        const obj = curr[str] as ProxyScripts;
        // If these object has a star, return it
        if(obj['*'] && typeof obj['*'] === 'function') {
          lastStar = obj['*'];
        }
      }
      case 0: { // We're on a function/undefined, but path continues
        Memo[url] = lastStar;
        return lastStar
      }
    }
  }
  return lastStar;
}
