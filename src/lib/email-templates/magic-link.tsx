import * as React from 'react'
import { Link, Text } from '@react-email/components'

import { AuthEmailLayout, authButton, authFooter, authHeading, authText } from './_auth-shared'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <AuthEmailLayout preview={`Prisijungimo nuoroda · ${siteName}`}>
    <Text style={authHeading}>Prisijungimo nuoroda</Text>
    <Text style={authText}>
      Paspauskite mygtuką ir iškart prisijungsite prie {siteName} paskyros — slaptažodžio nereikia.
    </Text>
    <Link href={confirmationUrl} style={authButton}>
      Prisijungti
    </Link>
    <Text style={authFooter}>
      Nuoroda galioja ribotą laiką ir gali būti panaudota vieną kartą. Jei prisijungimo neprašėte,
      ignoruokite šį laišką.
    </Text>
  </AuthEmailLayout>
)

export default MagicLinkEmail
