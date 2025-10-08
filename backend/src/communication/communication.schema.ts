import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CommunicationDocument = Communication & Document;

@Schema()
export class Communication {
  @Prop({ required: true })
  providerId: string;

  @Prop({ required: true, enum: ['email', 'fax'] })
  type: string;

  @Prop({ required: true })
  recipient: string;

  @Prop({ required: true })
  subject?: string; // For email

  @Prop({ required: true })
  content: string; // HTML for email, PDF URL for fax

  @Prop({ default: 'sent' })
  status: string; // sent, delivered, failed, responded

  @Prop()
  sentAt: Date;

  @Prop()
  responseAt?: Date;

  @Prop()
  responseContent?: string;

  @Prop()
  externalId?: string; // Fax SID or email ID

  @Prop({
    enum: ['twilio', '8x8', 'ringcentral', 'efax', 'hellofax', 'faxburner'],
  })
  faxProvider?: string; // Only for fax type communications

  @Prop({
    enum: ['sendgrid', 'smtp', 'mailgun', 'gmail', 'outlook'],
  })
  emailProvider?: string; // Only for email type communications
}

export const CommunicationSchema = SchemaFactory.createForClass(Communication);
