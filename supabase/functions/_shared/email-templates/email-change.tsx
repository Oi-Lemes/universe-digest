/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
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

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

const LOGO_URL =
  'https://ruovikplrtcclvihfabv.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu email</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Img src={LOGO_URL} width="72" height="72" alt={siteName} style={logo} />
          <Heading style={brand}>IMPÉRIO DOS QUADRINHOS</Heading>
        </Section>

        <Section style={card}>
          <Heading style={h1}>Confirmar novo email</Heading>
          <Text style={text}>
            Você solicitou alterar seu email de{' '}
            <strong style={strong}>{email}</strong> para{' '}
            <strong style={strong}>{newEmail}</strong>.
          </Text>

          <Section style={buttonWrapper}>
            <Button style={button} href={confirmationUrl}>
              CONFIRMAR ALTERAÇÃO
            </Button>
          </Section>

          <Text style={smallText}>
            Se o botão não funcionar, copie e cole este link no navegador:
          </Text>
          <Text style={linkFallback}>{confirmationUrl}</Text>

          <Hr style={divider} />

          <Text style={footer}>
            Se você não solicitou esta alteração, proteja sua conta agora.
          </Text>
        </Section>

        <Text style={brandFooter}>
          © Império dos Quadrinhos · O maior acervo de HQs do Brasil
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

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
  margin: '0 0 28px',
  textAlign: 'center' as const,
}
const strong = { color: '#ffffff' }
const buttonWrapper = { textAlign: 'center' as const, margin: '8px 0 28px' }
const button = {
  backgroundColor: '#E11D2E',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '16px 36px',
  textDecoration: 'none',
  letterSpacing: '0.5px',
  display: 'inline-block',
  border: '2px solid #E11D2E',
}
const smallText = {
  fontSize: '12px',
  color: '#8B8F99',
  margin: '0 0 6px',
  textAlign: 'center' as const,
}
const linkFallback = {
  fontSize: '12px',
  color: '#E11D2E',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  margin: '0 0 16px',
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
