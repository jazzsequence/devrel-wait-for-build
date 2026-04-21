'use client'
import { SiteFooter } from '@pantheon-systems/pds-toolkit-react'
import { BUILD_INFO } from '@/lib/build-info'

export default function Footer() {
  const { commitHash, commitShort, buildTime, buildYear } = BUILD_INFO
  const hasBuildInfo = commitHash !== 'unknown' && buildTime !== 'unknown'

  return (
    <SiteFooter
      hasTopBorder
      containerWidth="x-wide"
      legalLinks={['privacy', 'termsOfUse', 'cookiePolicy', 'accessibilityStatement']}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', padding: '0.75rem 0' }}>
        {hasBuildInfo && (
          <span className="pds-ts-xs pds-ff-code">
            Last built: {new Date(buildTime).toLocaleString('en-US', { timeZone: 'America/Denver' })} MT &bull;{' '}
            <a
              href={`https://github.com/jazzsequence/devrel-wait-for-build/commit/${commitHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {commitShort}
            </a>
          </span>
        )}
        <span className="pds-ts-xs pds-ff-code">&copy; {buildYear} Chris Reynolds</span>
      </div>
    </SiteFooter>
  )
}
