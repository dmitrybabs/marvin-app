// Upstash Redis REST client (работает на Vercel Serverless)
const getClient = () => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Mock для локальной разработки
    const store = {};
    return {
      async exec(cmd, ...args) {
        const key = args[0];
        if (cmd === 'GET') return store[key] ?? null;
        if (cmd === 'SET') { store[args[0]] = args[1]; return 'OK'; }
        if (cmd === 'HGETALL') {
          if (!store[key]) return [];
          const out = [];
          for (const [k, v] of Object.entries(store[key])) out.push(k, v);
          return out;
        }
        if (cmd === 'HSET') {
          store[key] = store[key] || {};
          for (let i = 1; i < args.length; i += 2) store[key][args[i]] = args[i + 1];
          return 1;
        }
        if (cmd === 'INCRBY') { store[key] = (parseInt(store[key]) || 0) + parseInt(args[1]); return store[key]; }
        if (cmd === 'ZADD') {
          store[key] = store[key] || [];
          const score = parseFloat(args[1]), member = args[2];
          store[key] = store[key].filter(x => x.m !== member);
          store[key].push({ s: score, m: member });
          return 1;
        }
        if (cmd === 'ZREVRANGE') {
          const arr = (store[key] || []).sort((a, b) => b.s - a.s);
          const end = args[2] === -1 ? undefined : parseInt(args[2]) + 1;
          return arr.slice(parseInt(args[1]), end).map(x => x.m);
        }
        if (cmd === 'ZSCORE') {
          const item = (store[key] || []).find(x => x.m === args[1]);
          return item ? String(item.s) : null;
        }
        if (cmd === 'LPUSH') { store[key] = [args[1], ...(store[key] || [])]; return store[key].length; }
        if (cmd === 'LRANGE') { return (store[key] || []).slice(parseInt(args[1]), args[2] === -1 ? undefined : parseInt(args[2]) + 1); }
        if (cmd === 'LTRIM') { store[key] = (store[key] || []).slice(parseInt(args[1]), parseInt(args[2]) + 1); return 'OK'; }
        return null;
      }
    };
  }

  return {
    async exec(cmd, ...args) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([cmd, ...args]),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data.result;
    }
  };
};

const client = getClient();

export const kv = {
  get: (k) => client.exec('GET', k),
  set: (k, v) => client.exec('SET', k, typeof v === 'object' ? JSON.stringify(v) : String(v)),

  hgetall: async (k) => {
    const result = await client.exec('HGETALL', k);
    if (!result || result.length === 0) return null;
    if (Array.isArray(result)) {
      const obj = {};
      for (let i = 0; i < result.length; i += 2) obj[result[i]] = result[i + 1];
      return obj;
    }
    return result;
  },

  hset: (k, obj) => {
    const pairs = [];
    for (const [field, val] of Object.entries(obj)) pairs.push(field, String(val));
    return client.exec('HSET', k, ...pairs);
  },

  incrby: (k, n) => client.exec('INCRBY', k, String(n)),
  decrby: (k, n) => client.exec('DECRBY', k, String(n)),

  zadd: (k, opts, member) => {
    const score = typeof opts === 'object' ? opts.score : opts;
    return client.exec('ZADD', k, String(score), String(member));
  },

  zrevrange: async (k, start, stop) => {
    const result = await client.exec('ZREVRANGE', k, String(start), String(stop));
    return result || [];
  },

  zscore: (k, member) => client.exec('ZSCORE', k, String(member)),

  lpush: (k, val) => client.exec('LPUSH', k, typeof val === 'object' ? JSON.stringify(val) : String(val)),

  lrange: async (k, start, stop) => {
    const result = await client.exec('LRANGE', k, String(start), String(stop));
    return result || [];
  },

  ltrim: (k, start, stop) => client.exec('LTRIM', k, String(start), String(stop)),
};
