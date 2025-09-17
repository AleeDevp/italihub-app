import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailValues {
  from: 'verify' | 'reset';
  to: string;
  subject: string;
  text: string;
}

const fromMap = {
  verify: process.env.Italihub_VERIFY_EMAIL as string,
  reset: process.env.Italihub_RESET_EMAIL as string,
};

export async function sendEmail({ from, to, subject, text }: SendEmailValues) {
  await resend.emails.send({
    from: fromMap[from],
    to,
    subject,
    text,
  });
}
