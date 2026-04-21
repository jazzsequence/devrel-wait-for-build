interface BuildInfo {
  commitHash: string
  commitShort: string
  buildTime: string
}

let cachedBuildInfo: BuildInfo | null = null

async function fetchLatestCommit(): Promise<string | null> {
  try {
    const response = await fetch(
      'https://api.github.com/repos/jazzsequence/devrel-wait-for-build/commits/main',
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'devrel-wait-for-build',
        },
        next: { revalidate: 3600 },
      }
    )
    if (!response.ok) return null
    const data = await response.json()
    return data.sha ?? null
  } catch {
    return null
  }
}

export async function getBuildInfo(): Promise<BuildInfo> {
  if (cachedBuildInfo) return cachedBuildInfo

  const commitHash = await fetchLatestCommit()
  cachedBuildInfo = {
    commitHash: commitHash ?? 'unknown',
    commitShort: commitHash ? commitHash.substring(0, 7) : 'unknown',
    buildTime: new Date().toISOString(),
  }

  return cachedBuildInfo
}
