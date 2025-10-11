import { PdfService, SettlementData } from './src/communication/pdf.service';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testPdfGeneration() {
  console.log('Testing PDF generation...');

  const pdfService = new PdfService();

  // Sample settlement data
  const settlementData: SettlementData = {
    providerName: 'City General Hospital',
    providerAddress: '123 Medical Center Dr, Anytown, ST 12345',
    providerPhone: '(555) 123-4567',
    patientName: 'John Doe',
    patientDOB: '01/15/1980',
    patientAddress: '456 Patient Ave, Anytown, ST 12345',
    serviceDate: '03/15/2024',
    serviceDescription: 'Emergency Room Visit - Chest Pain',
    billedAmount: 2500.00,
    paidAmount: 500.00,
    balanceDue: 2000.00,
    settlementOffer: 800.00,
    settlementTerms: 'Full and final settlement of all claims. Payment due within 30 days.',
    contactInfo: 'Settlement Department\nPhone: (555) 987-6543\nEmail: settlements@settlementcalc.com',
  };

  try {
    console.log('Generating settlement PDF...');

    const pdfPath = await pdfService.generateSettlementPdf(settlementData);

    console.log('✅ PDF generated successfully!');
    console.log(`📄 File location: ${pdfPath}`);

    // Check if file exists
    const fs = require('fs');
    if (fs.existsSync(pdfPath)) {
      const stats = fs.statSync(pdfPath);
      console.log(`📊 File size: ${stats.size} bytes`);
    } else {
      console.log('❌ PDF file was not created');
    }

    // Test URL generation
    const pdfUrl = await pdfService.generateSettlementPdfUrl(settlementData);
    console.log(`🔗 PDF URL: ${pdfUrl}`);

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ PDF generation failed:', message);
  }
}

// Run the test
testPdfGeneration().catch(console.error);