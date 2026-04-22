import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Império dos Quadrinhos'
const LOGIN_URL = 'https://login.imperiodosquadrinhos.site'

interface AccessGrantedProps {
  productName?: string
  plan?: string
}

const AccessGrantedEmail = ({ productName, plan }: AccessGrantedProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu acesso ao {SITE_NAME} foi liberado!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={hero}>
          <Heading style={h1}>Acesso liberado! 🎉</Heading>
          <Text style={heroText}>
            Bem-vindo(a) ao {SITE_NAME}
          </Text>
        </Section>

        <Section style={content}>
          <Text style={text}>
            Sua compra foi confirmada e seu acesso já está ativo.
            {productName ? (
              <>
                {' '}Você adquiriu: <strong>{productName}</strong>.
              </>
            ) : null}
          </Text>

          <Text style={text}>
            Para entrar no acervo, é só clicar no botão abaixo e fazer login com
            <strong> este mesmo e-mail</strong> da compra (Google ou link mágico).
          </Text>

          <Section style={buttonContainer}>
            <Button href={LOGIN_URL} style={button}>
              Acessar meu acervo
            </Button>
          </Section>

          <Text style={textSmall}>
            Ou copie e cole este link no navegador:<br />
            <span style={linkText}>{LOGIN_URL}</span>
          </Text>

          <Hr style={hr} />

          <Heading style={h2}>O que você tem disponível</Heading>
          <Text style={text}>
            • Acervo completo com Marvel, DC, mangás, mais de 50 editoras<br />
            • Atualizações quinzenais com os lançamentos mais recentes<br />
            • Leitor online + downloads diretos<br />
            • Acesso vitalício pelo e-mail cadastrado
          </Text>

          <Hr style={hr} />

          <Text style={textSmall}>
            <strong>Precisa de ajuda?</strong> Responda este e-mail ou entre em
            contato pelo nosso suporte. Estamos prontos para te ajudar.
          </Text>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            {SITE_NAME} — o maior acervo de quadrinhos digitais do Brasil
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AccessGrantedEmail,
  subject: 'Seu acesso ao Império dos Quadrinhos foi liberado! 🎉',
  displayName: 'Acesso liberado (pós-compra)',
  previewData: { productName: 'Império dos Quadrinhos - Plano Top', plan: 'top' },
} satisfies TemplateEntry

// === Styles (inline, email-safe) ===
const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '0',
  backgroundColor: '#ffffff',
}

const hero = {
  background: 'linear-gradient(135deg, #e6342f 0%, #b31217 100%)',
  padding: '40px 32px',
  textAlign: 'center' as const,
  borderRadius: '12px 12px 0 0',
}

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0 0 8px',
  lineHeight: '1.2',
}

const heroText = {
  color: '#ffe680',
  fontSize: '16px',
  fontWeight: '600',
  margin: 0,
}

const content = {
  padding: '32px',
  backgroundColor: '#ffffff',
}

const h2 = {
  color: '#1a1d2e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px',
}

const text = {
  color: '#3a3f55',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const textSmall = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 12px',
}

const linkText = {
  color: '#e6342f',
  wordBreak: 'break-all' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const button = {
  backgroundColor: '#e6342f',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  textDecoration: 'none',
  fontWeight: 'bold',
  fontSize: '16px',
  display: 'inline-block',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const footer = {
  padding: '20px 32px',
  textAlign: 'center' as const,
  backgroundColor: '#f9fafb',
  borderRadius: '0 0 12px 12px',
}

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  margin: 0,
}
