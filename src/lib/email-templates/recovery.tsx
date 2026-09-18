import * as React from 'react'
import { Link, Text } from '@react-email/components'

import { AuthEmailLayout, authButton, authFooter, authHeading, authText } from './_auth-shared'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({ siteName, confirmationUrl }: RecoveryEmailProps) => (
  <AuthEmailLayout preview={`Slaptažodžio atkūrimas · ${siteName}`}>
    <Text style={authHeading}>Slaptažodžio atkūrimas</Text>
    <Text style={authText}>
      Gavome prašymą atkurti {siteName} paskyros slaptažodį. Paspauskite mygtuką ir nustatykite naują.
    </Text>
    <Link href={confirmationUrl} style={authButton}>
      Nustatyti naują slaptažodį
    </Link>
    <Text style={authFooter}>
      Jei slaptažodžio atkūrimo neprašėte, nieko daryti nereikia — jūsų slaptažodis nepasikeis.
    </Text>
  </AuthEmailLayout>
)

export default RecoveryEmail
