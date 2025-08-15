export function ipfsToHttp(url?: string) {
  if (!url) return url as any;
  if (url.startsWith('ipfs://')) {
    const gateway =
      process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    return url.replace('ipfs://', gateway);
  }
  return url;
}
