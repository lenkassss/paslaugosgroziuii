import React from 'react'
import { Heading, Link, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailLayout, cta, detailRow, h1, muted, paragraph } from './_shared'

interface Props {
  customerName?: string
  salonName?: string
  serviceName?: string
  reviewUrl?: string
}

const ReviewRequest = ({ customerName, salonName, serviceName, reviewUrl }: Props) => (
  <EmailLayout preview="Kaip praėjo jūsų vizitas?">
    <Heading style={h1}>Kaip praėjo vizitas?</Heading>
    <Text style={paragraph}>
      {customerName ? `Sveiki, ${customerName}!` : 'Sveiki!'} Labai norėtume išgirsti jūsų įspūdžius —
      atsiliepimas padeda kitiems klientams pasirinkti.
    </Text>
    {salonName && <Text style={detailRow}>Salonas: {salonName}</Text>}
    {serviceName && <Text style={detailRow}>Paslauga: {serviceName}</Text>}
    {reviewUrl && (
      <Text style={{ margin: '22px 0 6px' }}>
        <Link href={reviewUrl} style={cta}>
          Palikti atsiliepimą
        </Link>
      </Text>
    )}
    <Text style={muted}>Užpildymas užima mažiau nei minutę.</Text>
  </EmailLayout>
)

export const template = {
  component: ReviewRequest,
  subject: (data: Record<string, any>) =>
    data?.salonName ? `Kaip praėjo vizitas ${data.salonName}?` : 'Kaip praėjo jūsų vizitas?',
  displayName: 'Atsiliepimo prašymas',
  previewData: {
    customerName: 'Rūta',
    salonName: 'Studija Aurum',
    serviceName: 'Manikiūras su gelio lakavimu',
    reviewUrl: 'https://testinispuslapis.online/dashboard/customer',
  },
} satisfies TemplateEntry
