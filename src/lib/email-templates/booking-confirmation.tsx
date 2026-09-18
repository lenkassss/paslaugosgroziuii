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

const BookingConfirmation = ({
  customerName,
  salonName,
  serviceName,
  appointmentDate,
  timeSlot,
  address,
  manageUrl,
}: Props) => (
  <EmailLayout preview={`Rezervacija patvirtinta${salonName ? ` · ${salonName}` : ''}`}>
    <Heading style={h1}>Rezervacija patvirtinta</Heading>
    <Text style={paragraph}>
      {customerName ? `Sveiki, ${customerName}!` : 'Sveiki!'} Jūsų vizitas sėkmingai užregistruotas.
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
          Peržiūrėti rezervaciją
        </Link>
      </Text>
    )}
    <Text style={muted}>
      Jei planai pasikeitė, atšaukite vizitą laiku — taip meistrė galės pasiūlyti laiką kitam klientui.
    </Text>
  </EmailLayout>
)

export const template = {
  component: BookingConfirmation,
  subject: (data: Record<string, any>) =>
    data?.salonName ? `Rezervacija patvirtinta · ${data.salonName}` : 'Rezervacija patvirtinta',
  displayName: 'Rezervacijos patvirtinimas',
  previewData: {
    customerName: 'Rūta',
    salonName: 'Studija Aurum',
    serviceName: 'Manikiūras su gelio lakavimu',
    appointmentDate: '2026-09-04',
    timeSlot: '12:00',
    address: 'Gedimino pr. 15, Vilnius',
    manageUrl: 'https://testinispuslapis.online/dashboard/customer',
  },
} satisfies TemplateEntry
