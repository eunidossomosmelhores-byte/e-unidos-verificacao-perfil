// Function da Vercel que recebe o aviso do Supabase (Database Webhook) toda vez
// que um lead novo é gravado na tabela "leads", e manda um e-mail para a
// captadora SOMENTE quando a pontuação de ICP for boa (>= 55).
//
// Não usa nenhuma biblioteca externa (usa o fetch nativo do Node 18+ da Vercel),
// então não precisa de "npm install" nem de package.json com dependências.
//
// Variáveis de ambiente exigidas (configurar no painel da Vercel, nunca aqui no código):
//   NOTIFY_SECRET     -> senha simples só para o Supabase e esta function combinarem entre si
//   RESEND_API_KEY    -> chave da conta Resend, usada para enviar o e-mail
//   NOTIFY_EMAIL_TO   -> seu e-mail, para onde o aviso de lead bom deve chegar
//   NOTIFY_EMAIL_FROM -> remetente do e-mail (opcional; padrão é o de teste do Resend)

const PONTUACAO_MINIMA = 55;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ erro: 'Método não permitido' });
    return;
  }

  // Confere a senha combinada com o Supabase, para que só ele (e não qualquer
  // pessoa na internet) consiga acionar o envio de e-mail por esta function.
  const secretRecebido = req.query.secret || req.headers['x-notify-secret'];
  if (!process.env.NOTIFY_SECRET || secretRecebido !== process.env.NOTIFY_SECRET) {
    res.status(401).json({ erro: 'Não autorizado' });
    return;
  }

  const payload = req.body || {};
  const lead = payload.record || {};

  const pontuacao = Number(lead.pontuacao || 0);
  if (pontuacao < PONTUACAO_MINIMA) {
    // Lead de pontuação baixa: fica só salvo no Supabase, sem gerar e-mail.
    res.status(200).json({ ok: true, notificado: false, motivo: 'pontuação abaixo do mínimo' });
    return;
  }

  const remetente = process.env.NOTIFY_EMAIL_FROM || 'E-Unidos Leads <onboarding@resend.dev>';
  const destinatario = process.env.NOTIFY_EMAIL_TO;

  if (!process.env.RESEND_API_KEY || !destinatario) {
    res.status(500).json({ erro: 'Configuração de e-mail incompleta (RESEND_API_KEY ou NOTIFY_EMAIL_TO ausente)' });
    return;
  }

  const assunto = `Lead ${lead.faixa || ''} (${pontuacao}/110): ${lead.osc || 'OSC sem nome'}`;

  const corpoHtml = `
    <h2>Novo lead qualificado no formulário de verificação de perfil</h2>
    <p><strong>Pontuação:</strong> ${pontuacao}/110 — ${lead.faixa || ''}</p>
    <hr>
    <p><strong>Nome:</strong> ${lead.nome || '-'}</p>
    <p><strong>Contato (WhatsApp):</strong> ${lead.contato || '-'}</p>
    <p><strong>OSC:</strong> ${lead.osc || '-'}</p>
    <p><strong>Tempo de existência:</strong> ${lead.tempo_existencia || '-'}</p>
    <p><strong>Orçamento anual:</strong> ${lead.orcamento_anual || '-'}</p>
    <p><strong>Temas:</strong> ${lead.temas || '-'}${lead.outro_tema ? ' (' + lead.outro_tema + ')' : ''}</p>
    <p><strong>Estado:</strong> ${lead.estado || '-'}</p>
    <p><strong>Povos e comunidades tradicionais:</strong> ${lead.comunidades_tradicionais || '-'}</p>
    <hr>
    <p>Este lead está salvo na tabela "leads" do seu projeto Supabase. Decida você se e quando entrar em contato.</p>
  `;

  const respostaResend = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: remetente,
      to: [destinatario],
      subject: assunto,
      html: corpoHtml
    })
  });

  if (!respostaResend.ok) {
    const erroTexto = await respostaResend.text();
    res.status(502).json({ erro: 'Falha ao enviar e-mail pelo Resend', detalhe: erroTexto });
    return;
  }

  res.status(200).json({ ok: true, notificado: true });
}
