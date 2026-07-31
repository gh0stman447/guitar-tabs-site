interface PaymentRedirect {
  confirmation_url: string;
  payment_method?: 'GET' | 'POST';
  payment_fields?: Record<string, string>;
}

export function submitPaymentRedirect(payment: PaymentRedirect) {
  if (payment.payment_method !== 'POST' || !payment.payment_fields) {
    window.location.href = payment.confirmation_url;
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
