'use client'
import { PantheonLogo } from '@pantheon-systems/pds-toolkit-react'

export default function SiteHeader() {
  return (
    <header
      className="pds-background-default"
      style={{
        borderBottom: '1px solid var(--pds-color-border-default)',
        padding: '0.875rem 0',
      }}
    >
      <div
        className="pds-container pds-container--x-wide"
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
      >
        <PantheonLogo
          displayType="full"
          colorType="default"
          subBrand="jazzsequence.com"
        />
      </div>
    </header>
  )
}
