/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL =
  'https://ruovikplrtcclvihfabv.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="72" height="72" alt="Império dos Quadrinhos" style={logo} />
          <Heading style={brand}>IMPÉRIO DOS QUADRINHOS</Heading>
        </Section>

        <Section style={card}>
          <Heading style={h1}>Código de verificação</Heading>
          <Text style={text}>
            Use o código abaixo para confirmar sua identidade:
          </Text>

          <Section style={codeWrapper}>
            <Text style={codeStyle}>{token}</Text>
          </Section>

          <Hr style={divider} />

          <Text style={footer}>
            Este código expira em poucos minutos. Se você não solicitou, ignore
            este email.
          </Text>
        </Section>

        <Text style={brandFooter}>
          © Império dos Quadrinhos · O maior acervo de HQs do Brasil
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 16px' }
const header = { textAlign: 'center' as const, padding: '8px 0 24px' }
const logo = { margin: '0 auto', display: 'block', borderRadius: '12px' }
const brand = {
  fontSize: '14px',
  fontWeight: 'bold' as const,
  color: '#E11D2E',
  letterSpacing: '2px',
  margin: '12px 0 0',
  textAlign: 'center' as const,
}
const card = {
  backgroundColor: '#0F1219',
  borderRadius: '16px',
  padding: '40px 32px',
  border: '1px solid #1F2433',
}
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}
const text = {
  fontSize: '15px',
  color: '#C7CAD1',
  lineHeight: '1.6',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}
const codeWrapper = {
  backgroundColor: '#1A1F2C',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center' as const,
  border: '1px solid #E11D2E',
  margin: '0 0 24px',
}
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  color: '#E11D2E',
  letterSpacing: '8px',
  margin: 0,
}
const divider = { borderColor: '#1F2433', margin: '24px 0' }
const footer = {
  fontSize: '12px',
  color: '#8B8F99',
  textAlign: 'center' as const,
  margin: 0,
}
const brandFooter = {
  fontSize: '11px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}
