import * as React from 'react'
import { Body, Container, Head, Html, Preview, Section, Text } from '@react-email/components'

export const authMain: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "'Figtree', 'Helvetica Neue', Arial, sans-serif",
  color: '#1c1917',
  margin: 0,
  padding: '24px 0',
}

export const authContainer: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 24px',
}

export const authCard: React.CSSProperties = {
  border: '1px solid #efe6d8',
  borderRadius: '20px',
  padding: '28px 26px',
  backgroundColor: '#fffdf9',
}

export const authWordmark: React.CSSProperties = {
  fontSize: '13px',
  letterSpacing: '2.4px',
  textTransform: 'uppercase',
  color: '#a1873f',
  fontWeight: 700,
  margin: '0 0 18px',
}

export const authHeading: React.CSSProperties = {
  fontSize: '23px',
  lineHeight: '31px',
  fontWeight: 600,
  color: '#221c14',
  margin: '0 0 14px',
}

export const authText: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4a4237',
  margin: '0 0 16px',
}

export const authLink: React.CSSProperties = { color: '#a1873f', textDecoration: 'underline' }

export const authButton: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#b4924d',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '13px 26px',
  borderRadius: '999px',
  textDecoration: 'none',
}

export const authCode: React.CSSProperties = {
  fontSize: '30px',
  letterSpacing: '8px',
  fontWeight: 700,
  color: '#221c14',
  margin: '8px 0 18px',
}

export const authFooter: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8b8377',
  margin: '24px 0 0',
}

export function AuthEmailLayout({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html lang="lt" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={authMain}>
        <Container style={authContainer}>
          <Text style={authWordmark}>PaslaugosGrožiui</Text>
          <Section style={authCard}>{children}</Section>
          <Text style={authFooter}>PaslaugosGrožiui · grožio paslaugų rezervacijos Lietuvoje</Text>
        </Container>
      </Body>
    </Html>
  )
}
