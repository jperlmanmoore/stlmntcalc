import { Injectable } from '@nestjs/common';
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { createTransport } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: any = createTransport({
    service: 'gmail', // or other
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    });
  }

  generateReductionEmail(
    provider: string,
    amount: number,
    reduction: number,
    type: string,
  ): { subject: string; text: string } {
    const subject = `Settlement Reduction Request for ${provider}`;
    const text = `Dear ${provider},\n\nWe are requesting a reduction of $${reduction} (${type}) on the amount of $${amount}.\n\nPlease confirm.\n\nBest regards,\nSettlement Calculator`;
    return { subject, text };
  }
}
