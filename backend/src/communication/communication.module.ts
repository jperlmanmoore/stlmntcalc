import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommunicationService } from './communication.service';
import { CommunicationController } from './communication.controller';
import { Communication, CommunicationSchema } from './communication.schema';
import { PdfService } from './pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Communication.name, schema: CommunicationSchema },
    ]),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, PdfService],
  exports: [CommunicationService, PdfService],
})
export class CommunicationModule {}
