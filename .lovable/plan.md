# Plano: Briefing UGC v2 — Império dos Quadrinhos

**Arquivo de saída:** `/mnt/documents/briefing-ugc-imperio-quadrinhos-v2.docx`

## Estrutura do documento

1. **Capa / Título**: Briefing UGC — Império dos Quadrinhos (v2)
2. **Resumo do projeto**: O que é o app, público-alvo, objetivo do vídeo
3. **Perfil ideal do creator** (nova seção):
   - Aparência típica de fã de HQs/mangás
   - Sugestões: camisetas de super-heróis/animes, óculos, ambiente nerd ao fundo (estante de quadrinhos, action figures, pôsteres)
   - Energia autêntica de quem curte o universo geek
4. **Especificações técnicas**:
   - Formato vertical 9:16
   - **Duração: máximo 30 segundos**
   - Áudio limpo (lapela ou similar)
   - Boa iluminação (natural ou ring light)
5. **Setup de gravação obrigatório**:
   - Filmar com **celular na mão** navegando o app
   - Filmar **alternando para o computador/notebook** mostrando a mesma experiência
   - Transições visíveis entre os dois dispositivos
6. **Roteiro cena-a-cena (30s total)** — em formato de tabela:
   - **Cena 1 (0–7s) — Hook**: expressão de descoberta com celular na mão
   - **Cena 2 (7–15s) — Multi-dispositivo**: alterna celular ↔ PC. Fala: *"Dá pra ver tanto no PC quanto no celular, e pode usar no Kindle também"*
   - **Cena 3 (15–23s) — Catálogo + Bônus**: mostra editoras (Marvel, DC, Vertigo…) + *"E ainda tem um bônus sensacional com mangás antigos e atualizados"*
   - **Cena 4 (23–30s) — Pitch + CTA**: *"Tudo isso por R$ 5,99 — pagamento único, sem mensalidade. Comenta EU QUERO ou clica em Saiba Mais"*
7. **Frases obrigatórias na narração** (lista destacada):
   - "Dá pra ver tanto no PC quanto no celular, e pode usar no Kindle também"
   - "Bônus sensacional com mangás antigos e atualizados"
   - "R$ 5,99 — pagamento único, sem mensalidade"
   - CTA: "Comenta EU QUERO" **ou** "Clica em Saiba Mais"
8. **Tom e estilo**: autêntico, empolgado, descoberta genuína — não robótico, não comercial
9. **Entregáveis**: vídeo final editado (MP4 vertical) + arquivos brutos (raw)
10. **Direitos de uso**: 12 meses para tráfego pago e orgânico
11. **Como se candidatar** (texto pronto pra colar como descrição da vaga no 99Freelas)

## Implementação técnica

- Usar `docx-js` com Arial como fonte padrão
- Headings sobrescritos (H1/H2) para hierarquia
- Listas com `LevelFormat.BULLET` (sem unicode manual)
- **Tabela** para o roteiro cena-a-cena: colunas `Tempo | Ação visual | Fala/Narração`
- Página US Letter, margens 1"
- Validar com `validate_document.py` após gerar
- QA: converter para PDF e imagens, revisar todas as páginas antes de entregar

## Saída final

Emitir tag `<lov-artifact>` apontando para o arquivo v2 em `/mnt/documents/`.