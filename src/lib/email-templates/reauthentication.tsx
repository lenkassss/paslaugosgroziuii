import * as React from 'react'
import { Text } from '@react-email/components'

import { AuthEmailLayout, authCode, authFooter, authHeading, authText } from './_auth-shared'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <AuthEmailLayout preview="Jūsų patvirtinimo kodas">
    <Text style={authHeading}>Patvirtinkite savo tapatybę</Text>
    <Text style={authText}>Įveskite šį kodą programėlėje, kad patvirtintumėte veiksmą:</Text>
    <Text style={authCode}>{token}</Text>
    <Text style={authFooter}>
      Kodas greitai nustos veikti. Jei šio veiksmo neinicijavote, ignoruokite laišką.
    </Text>
  </AuthEmailLayout>
)

export default ReauthenticationEmail
