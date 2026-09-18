import * as React from 'react'
import { Text } from '@react-email/components'

import { AuthEmailLayout, authButton, authFooter, authHeading, authText } from './_auth-shared'
import { Link } from '@react-email/components'

interface EmailChangeEmailProps {
  siteName: string
  // oldEmail is the user's current address (HookData.OldEmail). For the
  // NEW-recipient half of a secure email_change fanout, `email` equals the
  // recipient (NEW), so the "from" line must render oldEmail.
  oldEmail: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  oldEmail,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <AuthEmailLayout preview={`El. pašto pakeitimo patvirtinimas · ${siteName}`}>
    <Text style={authHeading}>Patvirtinkite el. pašto pakeitimą</Text>
    <Text style={authText}>
      Gavome prašymą pakeisti {siteName} paskyros el. paštą iš {oldEmail} į {newEmail}.
    </Text>
    <Link href={confirmationUrl} style={authButton}>
      Patvirtinti pakeitimą
    </Link>
    <Text style={authFooter}>
      Jei šio pakeitimo neprašėte, nedelsdami pasikeiskite slaptažodį ir susisiekite su mumis.
    </Text>
  </AuthEmailLayout>
)

export default EmailChangeEmail
