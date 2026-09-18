import * as React from 'react'
import { Link, Text } from '@react-email/components'

import { AuthEmailLayout, authButton, authHeading, authText, authFooter, authLink } from './_auth-shared'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({ siteName, siteUrl, recipient, confirmationUrl }: SignupEmailProps) => (
  <AuthEmailLayout preview={`Patvirtinkite el. paštą · ${siteName}`}>
    <Text style={authHeading}>Patvirtinkite el. paštą</Text>
    <Text style={authText}>
      Sveiki! Dėkojame, kad prisiregistravote{' '}
      <Link href={siteUrl} style={authLink}>
        <strong>{siteName}</strong>
      </Link>
      .
    </Text>
    <Text style={authText}>
      Norėdami aktyvuoti paskyrą, patvirtinkite adresą {recipient} paspausdami mygtuką:
    </Text>
    <Link href={confirmationUrl} style={authButton}>
      Patvirtinti el. paštą
    </Link>
    <Text style={authFooter}>
      Jei paskyros nekūrėte, tiesiog ignoruokite šį laišką.
    </Text>
  </AuthEmailLayout>
)

export default SignupEmail
