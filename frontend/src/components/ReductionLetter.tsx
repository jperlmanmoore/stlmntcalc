import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define styles for the PDF document
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 20,
  },
  date: {
    marginBottom: 20,
  },
  recipient: {
    marginBottom: 20,
  },
  subject: {
    marginBottom: 15,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 15,
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCol1: {
    width: '40%',
    paddingLeft: 8,
  },
  tableCol2: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 8,
  },
  tableCol3: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 8,
  },
  closing: {
    marginTop: 20,
  },
  signature: {
    marginTop: 40,
    marginBottom: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface ReductionLetterProps {
  providerName: string;
  providerEmail?: string;
  originalAmount: number;
  reductionAmount: number;
  finalAmount: number;
  clientName?: string;
  lawFirm?: string;
  attorneyName?: string;
  caseNumber?: string;
}

const ReductionLetter: React.FC<ReductionLetterProps> = ({
  providerName,
  providerEmail,
  originalAmount,
  reductionAmount,
  finalAmount,
  clientName = '[Client Name]',
  lawFirm = '[Law Firm Name]',
  attorneyName = '[Attorney Name]',
  caseNumber,
}) => {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reductionPercentage = ((reductionAmount / originalAmount) * 100).toFixed(1);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header with law firm */}
        <View style={styles.header}>
          <Text style={styles.bold}>{lawFirm}</Text>
          <Text>{attorneyName}</Text>
        </View>

        {/* Date */}
        <View style={styles.date}>
          <Text>{today}</Text>
        </View>

        {/* Recipient */}
        <View style={styles.recipient}>
          <Text>{providerName}</Text>
          {providerEmail && <Text>{providerEmail}</Text>}
        </View>

        {/* Subject line */}
        <View style={styles.subject}>
          <Text>RE: Medical Bill Reduction Request - {clientName}</Text>
          {caseNumber && <Text>Case Number: {caseNumber}</Text>}
        </View>

        {/* Salutation */}
        <View style={styles.body}>
          <Text>Dear {providerName},</Text>
        </View>

        {/* Body paragraph 1 */}
        <View style={styles.body}>
          <Text>
            I am writing on behalf of my client, {clientName}, regarding medical services provided by your
            facility. My client was injured in an accident and has retained our firm to pursue compensation
            for their injuries.
          </Text>
        </View>

        {/* Body paragraph 2 */}
        <View style={styles.body}>
          <Text>
            We have successfully negotiated a settlement on behalf of our client. However, given the
            limitations of the settlement amount and the multiple creditors involved, we respectfully request
            a reduction of the outstanding medical balance to allow our client to receive adequate compensation
            for their injuries while honoring their obligation to your facility.
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCol1}>Description</Text>
            <Text style={styles.tableCol2}>Amount</Text>
            <Text style={styles.tableCol3}>Percentage</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Original Billed Amount</Text>
            <Text style={styles.tableCol2}>${originalAmount.toFixed(2)}</Text>
            <Text style={styles.tableCol3}>100%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Requested Reduction</Text>
            <Text style={styles.tableCol2}>-${reductionAmount.toFixed(2)}</Text>
            <Text style={styles.tableCol3}>-{reductionPercentage}%</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: '#f5f5f5' }]}>
            <Text style={[styles.tableCol1, styles.bold]}>Proposed Final Amount</Text>
            <Text style={[styles.tableCol2, styles.bold]}>${finalAmount.toFixed(2)}</Text>
            <Text style={[styles.tableCol3, styles.bold]}>{(100 - parseFloat(reductionPercentage)).toFixed(1)}%</Text>
          </View>
        </View>

        {/* Body paragraph 3 */}
        <View style={styles.body}>
          <Text>
            We understand that this represents a significant reduction from the original balance. However,
            accepting this reduced amount ensures prompt payment from the settlement proceeds, whereas
            pursuing the full amount may result in prolonged collection efforts with uncertain outcomes.
          </Text>
        </View>

        {/* Body paragraph 4 */}
        <View style={styles.body}>
          <Text>
            If you agree to this reduction, please confirm in writing at your earliest convenience. Payment
            will be issued promptly upon receiving your confirmation. We sincerely appreciate your consideration
            of this request and your willingness to work with our client during this difficult time.
          </Text>
        </View>

        {/* Closing */}
        <View style={styles.closing}>
          <Text>Sincerely,</Text>
        </View>

        {/* Signature line */}
        <View style={styles.signature}>
          <Text>{attorneyName}</Text>
          <Text>{lawFirm}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReductionLetter;
