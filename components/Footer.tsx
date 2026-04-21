import { cacheLife } from 'next/cache'
import { getBuildInfo } from '@/lib/build-info'

export default async function Footer() {
  'use cache'
  cacheLife('blog')
  const currentYear = new Date().getFullYear()
  const buildInfo = await getBuildInfo().catch(() => null)

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          {buildInfo && (
            <span className="font-mono text-xs">
              Last built: {new Date(buildInfo.buildTime).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT &bull;{' '}
              <a
                href={`https://github.com/jazzsequence/devrel-wait-for-build/commit/${buildInfo.commitHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {buildInfo.commitShort}
              </a>
            </span>
          )}
          <span className="font-mono text-xs">&copy; {currentYear} Chris Reynolds</span>
        </div>
      </div>
    </footer>
  )
}
