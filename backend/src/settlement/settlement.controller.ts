/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { Settlement } from './settlement.schema';

@Controller('settlements')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) {}

  @Post()
  async create(@Body() settlement: Settlement) {
    const calculated = this.settlementService.calculateSettlement(settlement);
    settlement.calculatedResults = calculated;
    return this.settlementService.create(settlement);
  }

  @Get()
  async findAll() {
    return this.settlementService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.settlementService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() settlement: Partial<Settlement>,
  ) {
    if (settlement.calculatedResults) {
      settlement.calculatedResults = this.settlementService.calculateSettlement(
        settlement as Settlement,
      );
    }
    return this.settlementService.update(id, settlement);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.settlementService.delete(id);
  }

  @Post('calculate')
  calculate(@Body() settlement: Settlement) {
    return this.settlementService.calculateSettlement(settlement);
  }

  @Post('send-email')
  async sendEmail(
    @Body()
    body: {
      providerEmail: string;
      provider: string;
      amount: number;
      reduction: number;
      type: string;
    },
  ) {
    return this.settlementService.sendReductionEmail(
      body.providerEmail,
      body.provider,
      body.amount,
      body.reduction,
      body.type,
    );
  }
}
