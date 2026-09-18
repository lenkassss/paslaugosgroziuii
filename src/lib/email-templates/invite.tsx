import * as React from 'react'
import { Link, Text } from '@react-email/components'

import { AuthEmailLayout, authButton, authFooter, authHeading, authLink, authText } from './_auth-shared'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({ siteName, siteUrl, confirmationUrl }: InviteEmailProps) => (
  <AuthEmailLayout preview={`Kvietimas prisijungti · ${siteName}`}>
    <Text style={authHeading}>Jūs pakviesti prisijungti</Text>
    <Text style={authText}>
      Gavote kvietimą prisijungti prie{' '}
      <Link href={siteUrl} style={authLink}>
        <strong>{siteName}</strong>
      </Link>
      . Paspauskite mygtuką, kad priimtumėte kvietimą ir sukurtumėte paskyrą.
    </Text>
    <Link href={confirmationUrl} style={authButton}>
      Priimti kvietimą
    </Link>
    <Text style={authFooter}>Jei kvietimo nesitikėjote, tiesiog ignoruokite šį laišką.</Text>
  </AuthEmailLayout>
)

export default InviteEmail
