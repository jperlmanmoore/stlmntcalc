import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettlementDocument = Settlement & Document;

@Schema()
export class Settlement {
  @Prop({ required: true })
  totalSettlementAmount!: number;

  @Prop({ required: true })
  caseExpenses!: number;

  @Prop({
    type: {
      type: String,
      enum: ['specific', 'percentage'],
      required: true,
    },
    amount: { type: Number, required: true },
  })
  attorneyFees!: {
    type: 'specific' | 'percentage';
    amount: number;
  };

  @Prop([
    {
      name: String,
      billedAmount: Number,
      email: String,
      reductionType: { type: String, enum: ['percentage', 'prorata'] },
      reductionValue: Number,
      includeInProrataPool: { type: Boolean, default: true },
    },
  ])
  medicalProviders!: {
    name: string;
    billedAmount: number;
    email: string;
    reductionType: 'percentage' | 'prorata';
    reductionValue: number;
    includeInProrataPool: boolean;
  }[];

  @Prop([
    {
      provider: String,
      amount: Number,
      email: String,
      reductionType: { type: String, enum: ['percentage', 'prorata'] },
      reductionValue: Number,
      includeInProrataPool: { type: Boolean, default: true },
    },
  ])
  preSettlementLoans!: {
    provider: string;
    amount: number;
    email: string;
    reductionType: 'percentage' | 'prorata';
    reductionValue: number;
    includeInProrataPool: boolean;
  }[];

  @Prop([
    {
      provider: String,
      amount: Number,
      type: { type: String, enum: ['health', 'other'] },
      email: String,
      reductionType: { type: String, enum: ['percentage', 'prorata'] },
      reductionValue: Number,
      includeInProrataPool: { type: Boolean, default: true },
    },
  ])
  liens!: {
    provider: string;
    amount: number;
    type: 'health' | 'other';
    email: string;
    reductionType: 'percentage' | 'prorata';
    reductionValue: number;
    includeInProrataPool: boolean;
  }[];

  @Prop({ required: true })
  medicalPayment!: number;

  @Prop({
    type: {
      medical: {
        type: { type: String, enum: ['percentage', 'prorata'] },
        value: Number,
      },
      loans: {
        type: { type: String, enum: ['percentage', 'prorata'] },
        value: Number,
      },
      liens: {
        type: { type: String, enum: ['percentage', 'prorata'] },
        value: Number,
      },
    },
  })
  reductions!: {
    medical: { type: 'percentage' | 'prorata'; value: number };
    loans: { type: 'percentage' | 'prorata'; value: number };
    liens: { type: 'percentage' | 'prorata'; value: number };
  };

  @Prop({
    type: Object,
    default: { includeLoansInPool: false, includeLiensInPool: false },
  })
  prorataConfig!: {
    includeLoansInPool: boolean;
    includeLiensInPool: boolean;
  };

  @Prop({ type: Object })
  calculatedResults: any;
}

export const SettlementSchema = SchemaFactory.createForClass(Settlement);
