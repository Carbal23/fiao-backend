import { Resend } from 'resend';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailProvider {
  private resend = new Resend(process.env.RESEND_API_KEY);
  private from = process.env.EMAIL_FROM || 'FIAO <onboarding@resend.dev>';
  private appUrl = process.env.APP_URL || 'http://localhost:3000';

  async sendDebtorInvitation(to: string, code: string, businessName: string) {
    const inviteUrl = `${this.appUrl}/invite/${code}`;

    return this.resend.emails.send({
      from: this.from,
      to,
      subject: `Consulta tus deudas en ${businessName}`,
      html: `
      <h2>Tienes deudas registradas</h2>
      <p>El negocio <strong>${businessName}</strong> te invita a ver tus deudas.</p>
      <a href="${inviteUrl}">Ver deudas</a>
    `,
    });
  }

  async sendBusinessInvitation(
    to: string,
    code: string,
    businessName: string,
    role: string,
  ) {
    const inviteUrl = `${this.appUrl}/invite/${code}`;

    return this.resend.emails.send({
      from: this.from,
      to,
      subject: `Invitación para trabajar en ${businessName}`,
      html: `
      <h2>Te invitaron a trabajar en ${businessName}</h2>
      <p>Rol asignado: <strong>${role}</strong></p>
      <a href="${inviteUrl}">Aceptar invitación</a>
    `,
    });
  }
}
