import React from 'react'
import { Body, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'

export const BRAND = 'PaslaugosGrožiui'

export const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily: "'Figtree', 'Helvetica Neue', Arial, sans-serif",
  color: '#1c1917',
  margin: 0,
  padding: '24px 0',
}

export const container: React.CSSProperties = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0 24px',
}

export const card: React.CSSProperties = {
  border: '1px solid #efe6d8',
  borderRadius: '20px',
  padding: '28px 26px',
  backgroundColor: '#fffdf9',
}

export const wordmark: React.CSSProperties = {
  fontSize: '13px',
  letterSpacing: '2.4px',
  textTransform: 'uppercase',
  color: '#a1873f',
  fontWeight: 700,
  margin: '0 0 18px',
}

export const h1: React.CSSProperties = {
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: 600,
  margin: '0 0 12px',
  color: '#221c14',
}

export const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 14px',
  color: '#4a4237',
}

export const detailRow: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0 0 6px',
  color: '#221c14',
}

export const muted: React.CSSProperties = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8b8377',
  margin: '0 0 4px',
}

export const cta: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#b4924d',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '13px 26px',
  borderRadius: '999px',
  textDecoration: 'none',
}

export const hr: React.CSSProperties = {
  borderColor: '#efe6d8',
  margin: '22px 0 16px',
}

export function EmailLayout({
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
      <Body style={main}>
        <Container style={container}>
          <Text style={wordmark}>{BRAND}</Text>
          <Section style={card}>{children}</Section>
          <Hr style={hr} />
          <Text style={muted}>{BRAND} · grožio paslaugų rezervacijos Lietuvoje</Text>
        </Container>
      </Body>
    </Html>
  )
}

export { Heading }
