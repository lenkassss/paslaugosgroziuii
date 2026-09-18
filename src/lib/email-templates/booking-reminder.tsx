import React from 'react'
import { Heading, Link, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'
import { EmailLayout, cta, detailRow, h1, muted, paragraph } from './_shared'

interface Props {
  customerName?: string
  salonName?: string
  serviceName?: string
  appointmentDate?: string
  timeSlot?: string
  address?: string
  manageUrl?: string
}

const BookingReminder = ({
  customerName,
  salonName,
  serviceName,
  appointmentDate,
  timeSlot,
  address,
  manageUrl,
}: Props) => (
  <EmailLayout preview={`Priminimas apie vizitą${timeSlot ? ` ${timeSlot}` : ''}`}>
    <Heading style={h1}>Priminimas apie vizitą</Heading>
    <Text style={paragraph}>
      {customerName ? `Sveiki, ${customerName}!` : 'Sveiki!'} Netrukus jūsų laukia rezervuotas vizitas.
    </Text>
    {salonName && <Text style={detailRow}>Salonas: {salonName}</Text>}
    {serviceName && <Text style={detailRow}>Paslauga: {serviceName}</Text>}
    {(appointmentDate || timeSlot) && (
      <Text style={detailRow}>
        Laikas: {[appointmentDate, timeSlot].filter(Boolean).join(' ')}
      </Text>
    )}
    {address && <Text style={detailRow}>Adresas: {address}</Text>}
    {manageUrl && (
      <Text style={{ margin: '22px 0 6px' }}>
        <Link href={manageUrl} style={cta}>
          Mano rezervacijos
        </Link>
      </Text>
    )}
    <Text style={muted}>Prašome atvykti kelias minutes anksčiau.</Text>
  </EmailLayout>
)

export const template = {
  component: BookingReminder,
  subject: (data: Record<string, any>) =>
    data?.timeSlot ? `Priminimas: vizitas ${data.timeSlot}` : 'Priminimas apie jūsų vizitą',
  displayName: 'Priminimas apie vizitą',
  previewData: {
    customerName: 'Rūta',
    salonName: 'Studija Aurum',
    serviceName: 'Manikiūras su gelio lakavimu',
    appointmentDate: 'rytoj',
    timeSlot: '12:00',
    address: 'Gedimino pr. 15, Vilnius',
    manageUrl: 'https://testinispuslapis.online/dashboard/customer',
  },
} satisfies TemplateEntry
