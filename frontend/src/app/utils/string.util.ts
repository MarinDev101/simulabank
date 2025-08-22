export function truncate(str: string, n = 50) { return str.length > n ? str.slice(0, n) + '...' : str; }
