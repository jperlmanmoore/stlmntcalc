import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import sgMail from '@sendgrid/mail';
import * as nodemailer from 'nodemailer';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import twilio from 'twilio';
import axios from 'axios';
import OpenAI from 'openai';
import { Communication, CommunicationDocument } from './communication.schema';
import { PdfService, SettlementData } from './pdf.service';

@Injectable()
export class CommunicationService {
  private twilioClient = twilio;
  private openai?: OpenAI;

  constructor(
    @InjectModel(Communication.name)
    private communicationModel: Model<CommunicationDocument>,
    private pdfService: PdfService,
  ) {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
    }

    // Initialize OpenAI client
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    providerId: string,
    provider: 'sendgrid' | 'smtp' | 'mailgun' | 'gmail' | 'outlook' = 'smtp',
  ): Promise<CommunicationDocument> {
    switch (provider) {
      case 'sendgrid':
        return this.sendEmailSendGrid(to, subject, html, providerId);
      case 'smtp':
        return this.sendEmailSMTP(to, subject, html, providerId);
      case 'mailgun':
        return this.sendEmailMailgun(to, subject, html, providerId);
      case 'gmail':
        return this.sendEmailGmail(to, subject, html, providerId);
      case 'outlook':
        return this.sendEmailOutlook(to, subject, html, providerId);
      default:
        throw new Error(`Unsupported email provider: ${provider as string}`);
    }
  }

  private async sendEmailSendGrid(
    to: string,
    subject: string,
    html: string,
    providerId: string,
  ) {
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SendGrid API key not configured');
    }

    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@settlementcalc.com',
      subject,
      html,
    };

    await sgMail.send(msg);

    // Save to database
    const communication = new this.communicationModel({
      providerId,
      type: 'email',
      recipient: to,
      subject,
      content: html,
      status: 'sent',
      sentAt: new Date(),
      externalId: '',
      emailProvider: 'sendgrid',
    });
    await communication.save();

    return communication;
  }

  private async sendEmailSMTP(
    to: string,
    subject: string,
    html: string,
    providerId: string,
  ) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('SMTP credentials not configured');
    }

    // Determine SMTP settings based on email domain
    const emailDomain = process.env.EMAIL_USER.split('@')[1];
    let smtpConfig;

    if (emailDomain === 'gmail.com') {
      smtpConfig = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS, // App password for Gmail
        },
      };
    } else if (emailDomain === 'outlook.com' || emailDomain === 'hotmail.com') {
      smtpConfig = {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };
    } else if (emailDomain === 'yahoo.com') {
      smtpConfig = {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };
    } else {
      // Generic SMTP settings - user can configure via environment variables
      smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const transporter = nodemailer.createTransport(smtpConfig);

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const info = await transporter.sendMail(mailOptions);

    // Save to database
    const communication = new this.communicationModel({
      providerId,
      type: 'email',
      recipient: to,
      subject,
      content: html,
      status: 'sent',
      sentAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      externalId: info.messageId,
      emailProvider: 'smtp',
    });
    await communication.save();

    return communication;
  }

  private async sendEmailMailgun(
    to: string,
    subject: string,
    html: string,
    providerId: string,
  ): Promise<CommunicationDocument> {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      throw new Error('Mailgun credentials not configured');
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
    });

    const data = {
      from:
        process.env.MAILGUN_FROM_EMAIL ||
        `noreply@${process.env.MAILGUN_DOMAIN}`,
      to: [to],
      subject,
      html,
    };

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, data);

    // Save to database
    const communication = new this.communicationModel({
      providerId,
      type: 'email',
      recipient: to,
      subject,
      content: html,
      status: 'sent',
      sentAt: new Date(),
      externalId: result.id,
      emailProvider: 'mailgun',
    });
    await communication.save();

    return communication;
  }

  private async sendEmailGmail(
    to: string,
    subject: string,
    html: string,
    providerId: string,
  ): Promise<CommunicationDocument> {
    if (
      !process.env.GMAIL_CLIENT_ID ||
      !process.env.GMAIL_CLIENT_SECRET ||
      !process.env.GMAIL_REFRESH_TOKEN
    ) {
      throw new Error('Gmail API credentials not configured');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      'urn:ietf:wg:oauth:2.0:oob', // For desktop apps
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Create the email content
    const emailLines = ['To: ' + to, 'Subject: ' + subject, '', html];
    const email = emailLines.join('\r\n').trim();

    // Base64 encode the email
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });

    // Save to database
    const communication = new this.communicationModel({
      providerId,
      type: 'email',
      recipient: to,
      subject,
      content: html,
      status: 'sent',
      sentAt: new Date(),
      externalId: result.data.id,
      emailProvider: 'gmail',
    });
    await communication.save();

    return communication;
  }

  private async sendEmailOutlook(
    to: string,
    subject: string,
    html: string,
    providerId: string,
  ): Promise<CommunicationDocument> {
    if (
      !process.env.OUTLOOK_CLIENT_ID ||
      !process.env.OUTLOOK_CLIENT_SECRET ||
      !process.env.OUTLOOK_TENANT_ID ||
      !process.env.OUTLOOK_ACCESS_TOKEN
    ) {
      throw new Error('Outlook API credentials not configured');
    }

    const client = Client.init({
      authProvider: (done) => {
        done(null, process.env.OUTLOOK_ACCESS_TOKEN || null);
      },
    });

    const message = {
      subject,
      body: {
        contentType: 'html',
        content: html,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    };

    await client.api('/me/sendMail').post({ message });

    // Save to database
    const communication = new this.communicationModel({
      providerId,
      type: 'email',
      recipient: to,
      subject,
      content: html,
      status: 'sent',
      sentAt: new Date(),
      externalId: `outlook-${Date.now()}`, // Outlook doesn't return message ID immediately
      emailProvider: 'outlook',
    });
    await communication.save();

    return communication;
  }

  async sendFax(
    to: string,
    pdfUrl: string,
    providerId: string,
    provider:
      | 'twilio'
      | '8x8'
      | 'ringcentral'
      | 'efax'
      | 'hellofax'
      | 'faxburner' = 'twilio',
  ) {
    switch (provider) {
      case 'twilio':
        return this.sendFaxTwilio(to, pdfUrl, providerId);
      case '8x8':
        return this.sendFaxEightXEight(to, pdfUrl, providerId);
      case 'ringcentral':
        return this.sendFaxRingCentral(to, pdfUrl, providerId);
      case 'efax':
        return this.sendFaxEFax(to, pdfUrl, providerId);
      case 'hellofax':
        return this.sendFaxHelloFax(to, pdfUrl, providerId);
      case 'faxburner':
        return this.sendFaxFaxBurner(to, pdfUrl, providerId);
      default:
        throw new Error(`Unsupported fax provider: ${provider as string}`);
    }
  }

  async sendSettlementFax(
    to: string,
    settlementData: SettlementData,
    providerId: string,
    provider:
      | 'twilio'
      | '8x8'
      | 'ringcentral'
      | 'efax'
      | 'hellofax'
      | 'faxburner' = 'twilio',
  ): Promise<CommunicationDocument> {
    // Generate PDF from settlement data
    const pdfUrl =
      await this.pdfService.generateSettlementPdfUrl(settlementData);

    // Send fax using the generated PDF
    return this.sendFax(to, pdfUrl, providerId, provider);
  }

  private async sendFaxTwilio(to: string, pdfUrl: string, providerId: string) {
    if (
      !process.env.TWILIO_SID ||
      !process.env.TWILIO_TOKEN ||
      !process.env.TWILIO_FAX_NUMBER
    ) {
      throw new Error('Twilio credentials not configured');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const client = this.twilioClient(
      process.env.TWILIO_SID,
      process.env.TWILIO_TOKEN,
    ) as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const fax = await client.fax.faxes.create({
      to,
      from: process.env.TWILIO_FAX_NUMBER,
      mediaUrl: pdfUrl,
    });

    // Save to database
    const communication = new this.communicationModel({
      providerId,
      type: 'fax',
      recipient: to,
      content: pdfUrl,
      status: 'sent',
      sentAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      externalId: fax.sid,
      faxProvider: 'twilio',
    });
    await communication.save();

    return communication;
  }

  private async sendFaxEightXEight(
    to: string,
    pdfUrl: string,
    providerId: string,
  ) {
    if (
      !process.env.EIGHT_X_EIGHT_USERNAME ||
      !process.env.EIGHT_X_EIGHT_PASSWORD ||
      !process.env.EIGHT_X_EIGHT_FAX_NUMBER
    ) {
      throw new Error('8x8 credentials not configured');
    }

    try {
      // 8x8 Fax API integration
      // Note: This is a basic implementation. You may need to adjust based on 8x8's actual API
      const baseUrl =
        process.env.EIGHT_X_EIGHT_API_BASE_URL || 'https://api.8x8.com';

      // First, authenticate and get access token (if required)
      const authResponse = await axios.post(`${baseUrl}/oauth/token`, {
        grant_type: 'password',
        username: process.env.EIGHT_X_EIGHT_USERNAME,
        password: process.env.EIGHT_X_EIGHT_PASSWORD,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const accessToken = authResponse.data.access_token;

      // Send fax using 8x8 API
      const faxResponse = await axios.post(
        `${baseUrl}/fax/v1/faxes`,
        {
          to: to.replace(/^\+/, ''), // Remove + prefix if present
          from: process.env.EIGHT_X_EIGHT_FAX_NUMBER.replace(/^\+/, ''),
          document: pdfUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save to database
      const communication = new this.communicationModel({
        providerId,
        type: 'fax',
        recipient: to,
        content: pdfUrl,
        status: 'sent',
        sentAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        externalId: faxResponse.data.id || faxResponse.data.faxId,
        faxProvider: '8x8',
      });
      await communication.save();

      return communication;
    } catch (error) {
      console.error('8x8 Fax API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send fax via 8x8: ${message}`);
    }
  }

  private async sendFaxRingCentral(
    to: string,
    pdfUrl: string,
    providerId: string,
  ) {
    if (
      !process.env.RINGCENTRAL_CLIENT_ID ||
      !process.env.RINGCENTRAL_CLIENT_SECRET ||
      !process.env.RINGCENTRAL_USERNAME ||
      !process.env.RINGCENTRAL_PASSWORD ||
      !process.env.RINGCENTRAL_FAX_NUMBER
    ) {
      throw new Error('RingCentral credentials not configured');
    }

    try {
      const baseUrl =
        process.env.RINGCENTRAL_SERVER_URL ||
        'https://platform.ringcentral.com';

      // Step 1: Get access token
      const authResponse = await axios.post(
        `${baseUrl}/restapi/oauth/token`,
        {
          grant_type: 'password',
          username: process.env.RINGCENTRAL_USERNAME,
          password: process.env.RINGCENTRAL_PASSWORD,
          extension: process.env.RINGCENTRAL_EXTENSION || '',
        },
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${process.env.RINGCENTRAL_CLIENT_ID}:${process.env.RINGCENTRAL_CLIENT_SECRET}`,
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      const accessToken = authResponse.data.access_token;

      // Step 2: Send fax
      const faxResponse = await axios.post(
        `${baseUrl}/restapi/v1.0/account/~/extension/~/fax`,
        {
          to: [{ phoneNumber: to }],
          faxResolution: 'High',
          coverPageText: 'Settlement Reduction Request',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save to database
      const communication = new this.communicationModel({
        providerId,
        type: 'fax',
        recipient: to,
        content: pdfUrl,
        status: 'sent',
        sentAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        externalId: faxResponse.data.id,
        faxProvider: 'ringcentral',
      });
      await communication.save();

      return communication;
    } catch (error) {
      console.error('RingCentral Fax API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send fax via RingCentral: ${message}`);
    }
  }

  private async sendFaxEFax(to: string, pdfUrl: string, providerId: string) {
    if (
      !process.env.EFAX_USERNAME ||
      !process.env.EFAX_PASSWORD ||
      !process.env.EFAX_ACCOUNT_ID ||
      !process.env.EFAX_FAX_NUMBER
    ) {
      throw new Error('eFax credentials not configured');
    }

    try {
      const baseUrl = process.env.EFAX_API_BASE_URL || 'https://api.efax.com';

      // eFax typically uses SOAP or specific REST endpoints
      // This is a basic implementation - may need adjustment based on actual API
      const faxResponse = await axios.post(
        `${baseUrl}/rest/fax`,
        {
          account_id: process.env.EFAX_ACCOUNT_ID,
          recipient: to,
          sender_fax: process.env.EFAX_FAX_NUMBER,
          document_url: pdfUrl,
          resolution: 'fine',
        },
        {
          auth: {
            username: process.env.EFAX_USERNAME,
            password: process.env.EFAX_PASSWORD,
          },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // Save to database
      const communication = new this.communicationModel({
        providerId,
        type: 'fax',
        recipient: to,
        content: pdfUrl,
        status: 'sent',
        sentAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        externalId: faxResponse.data.fax_id || faxResponse.data.id,
        faxProvider: 'efax',
      });
      await communication.save();

      return communication;
    } catch (error) {
      console.error('eFax API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send fax via eFax: ${message}`);
    }
  }

  private async sendFaxHelloFax(
    to: string,
    pdfUrl: string,
    providerId: string,
  ) {
    if (
      !process.env.HELLOFAX_API_KEY ||
      !process.env.HELLOFAX_API_SECRET ||
      !process.env.HELLOFAX_FAX_NUMBER
    ) {
      throw new Error('HelloFax credentials not configured');
    }

    try {
      const baseUrl =
        process.env.HELLOFAX_API_BASE_URL || 'https://api.hellofax.com';

      // HelloFax API implementation
      const faxResponse = await axios.post(
        `${baseUrl}/v1/faxes`,
        {
          to: to,
          from: process.env.HELLOFAX_FAX_NUMBER,
          document_url: pdfUrl,
          quality: 'high',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HELLOFAX_API_KEY}`,
            'X-API-Key': process.env.HELLOFAX_API_SECRET,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save to database
      const communication = new this.communicationModel({
        providerId,
        type: 'fax',
        recipient: to,
        content: pdfUrl,
        status: 'sent',
        sentAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        externalId: faxResponse.data.id,
        faxProvider: 'hellofax',
      });
      await communication.save();

      return communication;
    } catch (error) {
      console.error('HelloFax API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send fax via HelloFax: ${message}`);
    }
  }

  private async sendFaxFaxBurner(
    to: string,
    pdfUrl: string,
    providerId: string,
  ) {
    if (
      !process.env.FAXBURNER_API_KEY ||
      !process.env.FAXBURNER_API_SECRET ||
      !process.env.FAXBURNER_FAX_NUMBER
    ) {
      throw new Error('FaxBurner credentials not configured');
    }

    try {
      const baseUrl =
        process.env.FAXBURNER_API_BASE_URL || 'https://api.faxburner.com';

      // FaxBurner API implementation
      const authString = Buffer.from(
        `${process.env.FAXBURNER_API_KEY}:${process.env.FAXBURNER_API_SECRET}`,
      ).toString('base64');

      const faxResponse = await axios.post(
        `${baseUrl}/v1/faxes`,
        {
          to_number: to,
          from_number: process.env.FAXBURNER_FAX_NUMBER,
          file_url: pdfUrl,
          quality: 'high',
        },
        {
          headers: {
            Authorization: `Basic ${authString}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Save to database
      const communication = new this.communicationModel({
        providerId,
        type: 'fax',
        recipient: to,
        content: pdfUrl,
        status: 'sent',
        sentAt: new Date(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
        externalId: faxResponse.data.fax_id || faxResponse.data.id,
        faxProvider: 'faxburner',
      });
      await communication.save();

      return communication;
    } catch (error) {
      console.error('FaxBurner API error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to send fax via FaxBurner: ${message}`);
    }
  }

  // Method to generate content using AI (placeholder for integration)
  generateContentWithAI(data: { provider?: string }): string {
    // TODO: Integrate with AI service for personalized content
    return `Generated content for ${data.provider || 'provider'}`;
  }

  async generateSettlementEmailContent(
    settlementData: SettlementData,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate a professional settlement reduction request email for a medical bill. Use the following information:

Provider: ${settlementData.providerName}
Patient: ${settlementData.patientName}
Service: ${settlementData.serviceDescription}
Original Amount: $${settlementData.billedAmount}
Amount Paid: $${settlementData.paidAmount}
Balance Due: $${settlementData.balanceDue}
Settlement Offer: $${settlementData.settlementOffer}

The email should be:
- Professional and respectful
- Clear about the settlement offer
- Include all relevant financial details
- Request prompt response
- Be concise but comprehensive

Format as HTML email content.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a legal assistant specializing in medical bill settlement negotiations. Generate professional, persuasive settlement request communications.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return (
        completion.choices[0]?.message?.content ||
        this.generateFallbackEmailContent(settlementData)
      );
    } catch (error) {
      console.error('AI content generation failed:', error);
      return this.generateFallbackEmailContent(settlementData);
    }
  }

  async generateSettlementLetterContent(
    settlementData: SettlementData,
  ): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate a formal settlement reduction request letter for a medical bill. Use the following information:

Healthcare Provider: ${settlementData.providerName}
Address: ${settlementData.providerAddress}
Phone: ${settlementData.providerPhone}

Patient Information:
Name: ${settlementData.patientName}
DOB: ${settlementData.patientDOB}
Address: ${settlementData.patientAddress}

Service Details:
Date: ${settlementData.serviceDate}
Description: ${settlementData.serviceDescription}

Financial Summary:
Original Billed Amount: $${settlementData.billedAmount}
Amount Paid to Date: $${settlementData.paidAmount}
Current Balance Due: $${settlementData.balanceDue}
Proposed Settlement Amount: $${settlementData.settlementOffer}

Settlement Terms: ${settlementData.settlementTerms}

Contact Information: ${settlementData.contactInfo}

The letter should be:
- Formal business letter format
- Professional and persuasive
- Include all financial details clearly
- Explain the settlement offer benefits
- Request written confirmation
- Include contact information

Format as plain text suitable for PDF generation.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a legal assistant drafting formal settlement correspondence. Create professional, legally sound settlement reduction requests.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.6,
      });

      return (
        completion.choices[0]?.message?.content ||
        this.generateFallbackLetterContent(settlementData)
      );
    } catch (error) {
      console.error('AI content generation failed:', error);
      return this.generateFallbackLetterContent(settlementData);
    }
  }

  private generateFallbackEmailContent(settlementData: SettlementData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Settlement Reduction Request</h2>

        <p>Dear ${settlementData.providerName} Billing Department,</p>

        <p>I am writing to request a reduction in the outstanding balance for medical services provided to ${settlementData.patientName}.</p>

        <h3>Account Summary:</h3>
        <ul>
          <li>Service: ${settlementData.serviceDescription}</li>
          <li>Service Date: ${settlementData.serviceDate}</li>
          <li>Original Amount: $${settlementData.billedAmount.toFixed(2)}</li>
          <li>Amount Paid: $${settlementData.paidAmount.toFixed(2)}</li>
          <li>Current Balance: $${settlementData.balanceDue.toFixed(2)}</li>
        </ul>

        <p><strong>Settlement Offer: $${settlementData.settlementOffer.toFixed(2)}</strong></p>

        <p>This settlement represents a significant reduction and would resolve this matter completely. ${settlementData.settlementTerms}</p>

        <p>Please contact me at your earliest convenience to discuss this settlement proposal.</p>

        <p>${settlementData.contactInfo.replace(/\n/g, '<br>')}</p>

        <p>Sincerely,<br>
        Settlement Representative</p>
      </div>
    `;
  }

  private generateFallbackLetterContent(
    settlementData: SettlementData,
  ): string {
    return `
${new Date().toLocaleDateString()}

${settlementData.providerName}
${settlementData.providerAddress}
${settlementData.providerPhone}

Re: Settlement Reduction Request - ${settlementData.patientName}
Account Balance: $${settlementData.balanceDue.toFixed(2)}

Dear Sir or Madam:

I am writing on behalf of ${settlementData.patientName} to request a reduction in the outstanding medical bill balance.

PATIENT INFORMATION:
Name: ${settlementData.patientName}
Date of Birth: ${settlementData.patientDOB}
Address: ${settlementData.patientAddress}

SERVICE INFORMATION:
Service Date: ${settlementData.serviceDate}
Description: ${settlementData.serviceDescription}

FINANCIAL SUMMARY:
Original Billed Amount: $${settlementData.billedAmount.toFixed(2)}
Amount Paid to Date: $${settlementData.paidAmount.toFixed(2)}
Current Balance Due: $${settlementData.balanceDue.toFixed(2)}

SETTLEMENT OFFER:
Proposed Settlement Amount: $${settlementData.settlementOffer.toFixed(2)}

${settlementData.settlementTerms}

This settlement offer represents a substantial reduction and would provide full and final resolution of this account. We request your prompt consideration and written confirmation of acceptance.

Please contact us immediately to discuss this settlement proposal.

${settlementData.contactInfo}

Sincerely,

Settlement Representative
    `;
  }

  async updateCommunicationStatus(externalId: string, status: string) {
    await this.communicationModel.updateOne({ externalId }, { status });
  }
}
