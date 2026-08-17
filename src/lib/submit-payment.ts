interface PaymentRedirect {
  confirmation_url: string;
  payment_method?: 'GET' | 'POST';
  payment_fields?: Record<string, string>;
}

interface RobokassaIframe {
  Render: (params: Record<string, unknown>, targetId?: string) => void;
}

declare global {
  interface Window {
    Robokassa?: RobokassaIframe;
  }
}

function showPaymentBackdrop() {
  const id = 'robokassa-payment-backdrop';
  if (document.getElementById(id)) return;

  const backdrop = document.createElement('div');
  backdrop.id = id;
  backdrop.setAttribute('aria-hidden', 'true');
  Object.assign(backdrop.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '9998',
    pointerEvents: 'none',
    background: 'rgb(8 12 20 / 38%)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  });
  document.body.appendChild(backdrop);
}

export function submitPaymentRedirect(payment: PaymentRedirect) {
  if (payment.payment_method !== 'POST' || !payment.payment_fields) {
    window.location.href = payment.confirmation_url;
    return;
  }

  const fields = payment.payment_fields;
  if (window.Robokassa?.Render && fields.MerchantLogin && fields.OutSum && fields.SignatureValue) {
    showPaymentBackdrop();
    window.Robokassa.Render({
      ...fields,
      InvId: fields.InvId ? Number(fields.InvId) : undefined,
      Settings: JSON.stringify({ Mode: 'modal' }),
    });
    return;
  }

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payment.confirmation_url;
  form.style.display = 'none';

  for (const [name, value] of Object.entries(payment.payment_fields)) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
