import { Body, Controller, Post } from '@nestjs/common';
import { CommunicationService } from './communication.service';
import { SettlementData } from './pdf.service';

interface SendGridEvent {
  event: string;
  sg_message_id: string;
  [key: string]: any;
}

interface TwilioFaxWebhook {
  FaxSid: string;
  FaxStatus: string;
  [key: string]: any;
}

@Controller('communication')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post('send-email')
  async sendEmail(
    @Body()
    body: {
      to: string;
      subject: string;
      html: string;
      providerId: string;
      provider?: 'sendgrid' | 'smtp' | 'mailgun' | 'gmail' | 'outlook';
    },
  ) {
    const result = await this.communicationService.sendEmail(
      body.to,
      body.subject,
      body.html,
      body.providerId,
      body.provider,
    );
    return { message: 'Email sent successfully', id: result._id };
  }

  @Post('send-fax')
  async sendFax(
    @Body()
    body: {
      to: string;
      pdfUrl: string;
      providerId: string;
    },
  ) {
    const result = await this.communicationService.sendFax(
      body.to,
      body.pdfUrl,
      body.providerId,
    );
    return {
      message: 'Fax sent successfully',
      id: result._id,
      faxSid: result.externalId,
    };
  }

  @Post('send-settlement-fax')
  async sendSettlementFax(
    @Body()
    body: {
      to: string;
      settlementData: SettlementData;
      providerId: string;
      provider?:
        | 'twilio'
        | '8x8'
        | 'ringcentral'
        | 'efax'
        | 'hellofax'
        | 'faxburner';
    },
  ) {
    const result = await this.communicationService.sendSettlementFax(
      body.to,
      body.settlementData,
      body.providerId,
      body.provider,
    );
    return {
      message: 'Settlement fax sent successfully',
      id: result._id,
      faxSid: result.externalId,
    };
  }

  @Post('generate-email-content')
  async generateEmailContent(
    @Body()
    body: {
      settlementData: SettlementData;
    },
  ) {
    const content =
      await this.communicationService.generateSettlementEmailContent(
        body.settlementData,
      );
    return {
      content,
      contentType: 'html',
    };
  }

  @Post('generate-letter-content')
  async generateLetterContent(
    @Body()
    body: {
      settlementData: SettlementData;
    },
  ) {
    const content =
      await this.communicationService.generateSettlementLetterContent(
        body.settlementData,
      );
    return {
      content,
      contentType: 'text',
    };
  }

  @Post('webhook/sendgrid')
  async handleSendgridWebhook(@Body() events: SendGridEvent[]) {
    for (const event of events) {
      if (event.event === 'delivered' || event.event === 'bounce') {
        await this.communicationService.updateCommunicationStatus(
          event.sg_message_id,
          event.event,
        );
      }
    }
    return { status: 'ok' };
  }

  @Post('webhook/twilio-fax')
  async handleTwilioFaxWebhook(@Body() body: TwilioFaxWebhook) {
    const { FaxSid, FaxStatus } = body;
    await this.communicationService.updateCommunicationStatus(
      FaxSid,
      FaxStatus,
    );
    return { status: 'ok' };
  }
}
