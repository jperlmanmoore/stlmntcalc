import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettlementController } from './settlement.controller';
import { SettlementService } from './settlement.service';
import { Settlement, SettlementSchema } from './settlement.schema';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settlement.name, schema: SettlementSchema },
    ]),
    EmailModule,
  ],
  controllers: [SettlementController],
  providers: [SettlementService],
})
export class SettlementModule {}
