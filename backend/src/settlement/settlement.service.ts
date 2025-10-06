import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settlement, SettlementDocument } from './settlement.schema';
import { EmailService } from '../email/email.service';

@Injectable()
export class SettlementService {
  constructor(
    @InjectModel(Settlement.name)
    private settlementModel: Model<SettlementDocument>,
    private emailService: EmailService,
  ) {}

  async create(settlement: Settlement): Promise<Settlement> {
    const createdSettlement = new this.settlementModel(settlement);
    return createdSettlement.save();
  }

  async findAll(): Promise<Settlement[]> {
    return this.settlementModel.find().exec();
  }

  async findOne(id: string): Promise<Settlement | null> {
    return this.settlementModel.findById(id).exec();
  }

  async update(
    id: string,
    settlement: Partial<Settlement>,
  ): Promise<Settlement | null> {
    return this.settlementModel
      .findByIdAndUpdate(id, settlement, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Settlement | null> {
    return this.settlementModel.findByIdAndDelete(id).exec();
  }

  calculateSettlement(settlement: Settlement): any {
    const attorneyFeeAmount =
      settlement.attorneyFees.type === 'percentage'
        ? (settlement.totalSettlementAmount * settlement.attorneyFees.amount) /
          100
        : settlement.attorneyFees.amount;

    // Calculate total damages for pro rata calculations based on individual item flags
    const totalDamages =
      settlement.medicalProviders
        .filter((p) => p.includeInProrataPool)
        .reduce((sum, p) => sum + p.billedAmount, 0) +
      settlement.preSettlementLoans
        .filter((l) => l.includeInProrataPool)
        .reduce((sum, l) => sum + l.amount, 0) +
      settlement.liens
        .filter((l) => l.includeInProrataPool)
        .reduce((sum, l) => sum + l.amount, 0);

    const reductionPool = settlement.totalSettlementAmount / 3;

    // Calculate individual reductions for medical providers
    const medicalReductions = settlement.medicalProviders.map((p) => {
      const reduction = this.calculateItemReduction(
        p.billedAmount,
        p.reductionType,
        p.reductionValue,
        totalDamages,
        reductionPool,
      );
      return {
        name: p.name,
        billedAmount: p.billedAmount,
        reduction,
        finalAmount: p.billedAmount - reduction,
      };
    });

    // Calculate individual reductions for loans
    const loanReductions = settlement.preSettlementLoans.map((l) => {
      const reduction = this.calculateItemReduction(
        l.amount,
        l.reductionType,
        l.reductionValue,
        totalDamages,
        reductionPool,
      );
      return {
        provider: l.provider,
        amount: l.amount,
        reduction,
        finalAmount: l.amount - reduction,
      };
    });

    // Calculate individual reductions for liens
    const lienReductions = settlement.liens.map((l) => {
      const reduction = this.calculateItemReduction(
        l.amount,
        l.reductionType,
        l.reductionValue,
        totalDamages,
        reductionPool,
      );
      return {
        provider: l.provider,
        amount: l.amount,
        reduction,
        finalAmount: l.amount - reduction,
      };
    });

    const totalMedicalFinal = medicalReductions.reduce(
      (sum, m) => sum + m.finalAmount,
      0,
    );
    const totalLoansFinal = loanReductions.reduce(
      (sum, l) => sum + l.finalAmount,
      0,
    );
    const totalLiensFinal = lienReductions.reduce(
      (sum, l) => sum + l.finalAmount,
      0,
    );

    // Net proceeds = Gross + Medical Payment - Case Expenses - Attorney Fees - Medical Bills - Loans - Liens
    const netProceeds =
      settlement.totalSettlementAmount +
      settlement.medicalPayment -
      settlement.caseExpenses -
      attorneyFeeAmount -
      totalMedicalFinal -
      totalLoansFinal -
      totalLiensFinal;

    return {
      grossSettlement: settlement.totalSettlementAmount,
      caseExpenses: settlement.caseExpenses,
      attorneyFees: attorneyFeeAmount,
      netProceeds,
      medicalPayment: settlement.medicalPayment,
      reductions: {
        medical: {
          total: medicalReductions.reduce((sum, m) => sum + m.reduction, 0),
          perProvider: medicalReductions,
        },
        loans: {
          total: loanReductions.reduce((sum, l) => sum + l.reduction, 0),
          perProvider: loanReductions,
        },
        liens: {
          total: lienReductions.reduce((sum, l) => sum + l.reduction, 0),
          perProvider: lienReductions,
        },
      },
    };
  }

  private calculateItemReduction(
    itemAmount: number,
    reductionType: 'percentage' | 'prorata',
    reductionValue: number,
    totalDamages: number,
    reductionPool: number,
  ): number {
    if (reductionType === 'percentage') {
      return (itemAmount * reductionValue) / 100;
    } else {
      // Pro rata: distribute the reduction pool proportionally
      return totalDamages > 0
        ? itemAmount - (itemAmount / totalDamages) * reductionPool
        : 0;
    }
  }

  async sendReductionEmail(
    providerEmail: string,
    provider: string,
    amount: number,
    reduction: number,
    type: string,
  ) {
    const email = this.emailService.generateReductionEmail(
      provider,
      amount,
      reduction,
      type,
    );
    await this.emailService.sendEmail(providerEmail, email.subject, email.text);
  }
}
