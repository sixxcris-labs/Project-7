export async function serviceProxy<T>(
  url: string,
  demoData: T,
  init?: RequestInit,
): Promise<T> {
  try {
    const res = await fetch(url, init);

    if (!res.ok) {
      const text = await res.text().catch(() => '<no body>');
      // eslint-disable-next-line no-console
      console.warn(`Upstream ${res.status} for ${url}: ${text}`);
      return demoData;
    }

    return (await res.json()) as T;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`Upstream error for ${url}:`, err);
    return demoData;
  }
}

export async function proxyServiceJson<T = any>(
  serviceUrl: string | undefined,
  path: string,
  req: any
): Promise<T | null> {
  if (!serviceUrl) {
    return null;
  }

  try {
    const url = new URL(path, serviceUrl);
    const res = await fetch(url.toString(), {
      headers: {
        authorization: req.headers.authorization || '',
      },
    });

    if (!res.ok) {
      console.warn(`Service proxy ${res.status} for ${url}`);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.warn(`Service proxy error for ${serviceUrl}${path}:`, err);
    return null;
  }
}
