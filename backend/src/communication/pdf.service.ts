import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SettlementData {
  providerName: string;
  providerAddress: string;
  providerPhone: string;
  patientName: string;
  patientDOB: string;
  patientAddress: string;
  serviceDate: string;
  serviceDescription: string;
  billedAmount: number;
  paidAmount: number;
  balanceDue: number;
  settlementOffer: number;
  settlementTerms: string;
  contactInfo: string;
}

@Injectable()
export class PdfService {
  private readonly pdfDir = path.join(process.cwd(), 'pdfs');

  constructor() {
    // Ensure PDF directory exists
    if (!fs.existsSync(this.pdfDir)) {
      fs.mkdirSync(this.pdfDir, { recursive: true });
    }
  }

  async generateSettlementPdf(settlementData: SettlementData): Promise<string> {
    const filename = `settlement-${uuidv4()}.pdf`;
    const filepath = path.join(this.pdfDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'LETTER',
          margin: 50,
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('SETTLEMENT REDUCTION REQUEST', { align: 'center' });
        doc.moveDown(2);

        // Provider Information
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('Healthcare Provider Information:');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Provider Name: ${settlementData.providerName}`);
        doc.text(`Address: ${settlementData.providerAddress}`);
        doc.text(`Phone: ${settlementData.providerPhone}`);
        doc.moveDown();

        // Patient Information
        doc.fontSize(14).font('Helvetica-Bold').text('Patient Information:');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Patient Name: ${settlementData.patientName}`);
        doc.text(`Date of Birth: ${settlementData.patientDOB}`);
        doc.text(`Address: ${settlementData.patientAddress}`);
        doc.moveDown();

        // Service Information
        doc.fontSize(14).font('Helvetica-Bold').text('Service Information:');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Service Date: ${settlementData.serviceDate}`);
        doc.text(`Description: ${settlementData.serviceDescription}`);
        doc.moveDown();

        // Financial Information
        doc.fontSize(14).font('Helvetica-Bold').text('Financial Summary:');
        doc.fontSize(12).font('Helvetica');
        doc.text(
          `Original Billed Amount: $${settlementData.billedAmount.toFixed(2)}`,
        );
        doc.text(`Amount Paid: $${settlementData.paidAmount.toFixed(2)}`);
        doc.text(
          `Current Balance Due: $${settlementData.balanceDue.toFixed(2)}`,
        );
        doc.moveDown();

        // Settlement Offer
        doc.fontSize(14).font('Helvetica-Bold').text('Settlement Offer:');
        doc.fontSize(12).font('Helvetica');
        doc.text(
          `Proposed Settlement Amount: $${settlementData.settlementOffer.toFixed(2)}`,
        );
        doc.text(`Settlement Terms: ${settlementData.settlementTerms}`);
        doc.moveDown(2);

        // Contact Information
        doc.fontSize(14).font('Helvetica-Bold').text('Contact Information:');
        doc.fontSize(12).font('Helvetica');
        doc.text(settlementData.contactInfo);
        doc.moveDown(2);

        // Footer
        doc.fontSize(10).font('Helvetica');
        doc.text(
          'This settlement offer is valid for 30 days from the date of this letter.',
          { align: 'center' },
        );
        doc.text('Please contact us to discuss this settlement proposal.', {
          align: 'center',
        });
        doc.moveDown();
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, {
          align: 'center',
        });

        doc.end();

        stream.on('finish', () => {
          // Return the file path - in a real application, this would be a URL
          // For now, we'll return the local file path
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(
            new Error(
              `PDF generation failed: ${error instanceof Error ? error.message : String(error)}`,
            ),
          );
        });
      } catch (error) {
        reject(
          new Error(
            `PDF generation failed: ${error instanceof Error ? error.message : String(error)}`,
          ),
        );
      }
    });
  }

  async generateSettlementPdfUrl(
    settlementData: SettlementData,
  ): Promise<string> {
    const filepath = await this.generateSettlementPdf(settlementData);

    // In a production environment, you would upload this to a cloud storage service
    // and return a public URL. For now, we'll return a file:// URL for local testing
    const fileUrl = `file://${filepath}`;

    return fileUrl;
  }

  // Method to clean up old PDF files (optional utility)
  cleanupOldPdfs(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

    try {
      const files = fs.readdirSync(this.pdfDir);

      for (const file of files) {
        const filepath = path.join(this.pdfDir, file);
        const stats = fs.statSync(filepath);

        if (stats.mtime.getTime() < cutoffTime && file.endsWith('.pdf')) {
          fs.unlinkSync(filepath);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old PDFs:', error);
    }
  }
}
