import { BUILD_INFO } from '@/lib/build-info'

export default function Footer() {
  const { commitHash, commitShort, buildTime, buildYear } = BUILD_INFO
  const hasBuildInfo = commitHash !== 'unknown' && buildTime !== 'unknown'

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          {hasBuildInfo && (
            <span className="font-mono text-xs">
              Last built: {new Date(buildTime).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT &bull;{' '}
              <a
                href={`https://github.com/jazzsequence/devrel-wait-for-build/commit/${commitHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {commitShort}
              </a>
            </span>
          )}
          <span className="font-mono text-xs">&copy; {buildYear} Chris Reynolds</span>
        </div>
      </div>
    </footer>
  )
}
