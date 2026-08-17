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

export function submitPaymentRedirect(payment: PaymentRedirect, widgetId?: string) {
  if (payment.payment_method !== 'POST' || !payment.payment_fields) {
    window.location.href = payment.confirmation_url;
    return;
  }

  const fields = payment.payment_fields;
  if (
    window.Robokassa?.Render &&
    fields.MerchantLogin &&
    fields.OutSum &&
    fields.SignatureValue
  ) {
    window.Robokassa.Render({
      ...fields,
      InvId: fields.InvId ? Number(fields.InvId) : undefined,
      Settings: JSON.stringify({ Mode: widgetId ? 'widget' : 'modal' }),
    }, widgetId);
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
