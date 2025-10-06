'use client';

import { useState } from 'react';
import axios from 'axios';
import { pdf } from '@react-pdf/renderer';
import ReductionLetter from '../components/ReductionLetter';

interface CalculationResult {
  grossSettlement: number;
  caseExpenses: number;
  attorneyFees: number;
  netProceeds: number;
  medicalPayment: number;
  reductions: {
    medical: {
      total: number;
      perProvider: { name: string; billedAmount: number; reduction: number; finalAmount: number }[];
    };
    loans: {
      total: number;
      perProvider: { provider: string; amount: number; reduction: number; finalAmount: number }[];
    };
    liens: {
      total: number;
      perProvider: { provider: string; amount: number; reduction: number; finalAmount: number }[];
    };
  };
}

interface MedicalProvider {
  name: string;
  billedAmount: number;
  email: string;
  reductionType: 'percentage' | 'prorata';
  reductionValue: number;
  includeInProrataPool: boolean;
}

interface Loan {
  provider: string;
  amount: number;
  email: string;
  reductionType: 'percentage' | 'prorata';
  reductionValue: number;
  includeInProrataPool: boolean;
}

interface Lien {
  provider: string;
  amount: number;
  type: 'health' | 'other';
  email: string;
  reductionType: 'percentage' | 'prorata';
  reductionValue: number;
  includeInProrataPool: boolean;
}

interface Reduction {
  type: 'percentage' | 'prorata';
  value: number;
}

interface Settlement {
  totalSettlementAmount: number;
  caseExpenses: number;
  attorneyFees: { type: 'specific' | 'percentage'; amount: number };
  medicalProviders: MedicalProvider[];
  preSettlementLoans: Loan[];
  liens: Lien[];
  medicalPayment: number;
  reductions: {
    medical: Reduction;
    loans: Reduction;
    liens: Reduction;
  };
}

export default function Home() {
  const [settlement, setSettlement] = useState<Settlement>({
    totalSettlementAmount: 0,
    caseExpenses: 0,
    attorneyFees: { type: 'percentage', amount: 0 },
    medicalProviders: [],
    preSettlementLoans: [],
    liens: [],
    medicalPayment: 0,
    reductions: {
      medical: { type: 'percentage', value: 0 },
      loans: { type: 'percentage', value: 0 },
      liens: { type: 'percentage', value: 0 },
    },
  });

  const [results, setResults] = useState<CalculationResult | null>(null);
  
  // Law firm information for PDF letters
  const [lawFirmInfo, setLawFirmInfo] = useState({
    lawFirm: '',
    attorneyName: '',
    clientName: '',
    caseNumber: '',
    dateOfIncident: '',
    includeSettlementAmount: false,
    includeTotalDamages: false,
  });

  // PDF generation function
  const generatePDF = async (provider: { name: string; billedAmount: number; reduction: number; finalAmount: number; email?: string }) => {
    try {
      const blob = await pdf(
        <ReductionLetter
          providerName={provider.name}
          providerEmail={provider.email}
          originalAmount={provider.billedAmount}
          reductionAmount={provider.reduction}
          finalAmount={provider.finalAmount}
          clientName={lawFirmInfo.clientName || '[Client Name]'}
          lawFirm={lawFirmInfo.lawFirm || '[Law Firm Name]'}
          attorneyName={lawFirmInfo.attorneyName || '[Attorney Name]'}
          caseNumber={lawFirmInfo.caseNumber}
          dateOfIncident={lawFirmInfo.dateOfIncident}
          settlementAmount={lawFirmInfo.includeSettlementAmount ? settlement.totalSettlementAmount : undefined}
          totalDamages={lawFirmInfo.includeTotalDamages ? calculateTotalDamages() : undefined}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reduction-letter-${provider.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Helper functions for calculations
  const calculatePercentageReduction = (amount: number, percentage: number) => amount * (percentage / 100);

    const calculateTotalDamages = () => {
    const medicalTotal = settlement.medicalProviders
      .filter((p) => p.includeInProrataPool)
      .reduce((sum, p) => sum + p.billedAmount, 0);
    const loansTotal = settlement.preSettlementLoans
      .filter((l) => l.includeInProrataPool)
      .reduce((sum, l) => sum + l.amount, 0);
    const liensTotal = settlement.liens
      .filter((l) => l.includeInProrataPool)
      .reduce((sum, l) => sum + l.amount, 0);
    return medicalTotal + loansTotal + liensTotal;
  };

  const calculateProrataReduction = (itemAmount: number, totalSettlement: number) => {
    const totalDamages = calculateTotalDamages();
    if (totalDamages === 0) return 0;
    const oneThirdSettlement = totalSettlement / 3;
    // Calculate this item's proportional share of the 1/3 pool
    const prorataShare = (itemAmount / totalDamages) * oneThirdSettlement;
    // The reduction is the original amount minus what they get from the pool
    return itemAmount - prorataShare;
  };

  const handleCalculate = async () => {
    try {
      const response = await axios.post('http://localhost:3001/settlements/calculate', settlement);
      setResults(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const addMedicalProvider = () => {
    setSettlement({
      ...settlement,
      medicalProviders: [...settlement.medicalProviders, { name: '', billedAmount: 0, email: '', reductionType: 'percentage', reductionValue: 0, includeInProrataPool: true }],
    });
  };

  const updateMedicalProvider = (index: number, field: keyof MedicalProvider, value: string | number | boolean) => {
    const updated = [...settlement.medicalProviders];
    if (field === 'billedAmount' || field === 'reductionValue') {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else if (field === 'includeInProrataPool') {
      updated[index] = { ...updated[index], [field]: value as boolean };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setSettlement({ ...settlement, medicalProviders: updated });
  };

  const removeMedicalProvider = (index: number) => {
    setSettlement({
      ...settlement,
      medicalProviders: settlement.medicalProviders.filter((_, i) => i !== index),
    });
  };

  // Similar for loans and liens

  const addLoan = () => {
    setSettlement({
      ...settlement,
      preSettlementLoans: [...settlement.preSettlementLoans, { provider: '', amount: 0, email: '', reductionType: 'percentage', reductionValue: 0, includeInProrataPool: true }],
    });
  };

  const updateLoan = (index: number, field: keyof Loan, value: string | number | boolean) => {
    const updated = [...settlement.preSettlementLoans];
    if (field === 'amount' || field === 'reductionValue') {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else if (field === 'includeInProrataPool') {
      updated[index] = { ...updated[index], [field]: value as boolean };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setSettlement({ ...settlement, preSettlementLoans: updated });
  };

  const removeLoan = (index: number) => {
    setSettlement({
      ...settlement,
      preSettlementLoans: settlement.preSettlementLoans.filter((_, i) => i !== index),
    });
  };

  const addLien = () => {
    setSettlement({
      ...settlement,
      liens: [...settlement.liens, { provider: '', amount: 0, type: 'health', email: '', reductionType: 'percentage', reductionValue: 0, includeInProrataPool: true }],
    });
  };

  const updateLien = (index: number, field: keyof Lien, value: string | number | boolean) => {
    const updated = [...settlement.liens];
    if (field === 'amount' || field === 'reductionValue') {
      updated[index] = { ...updated[index], [field]: Number(value) };
    } else if (field === 'includeInProrataPool') {
      updated[index] = { ...updated[index], [field]: value as boolean };
    } else {
      updated[index] = { ...updated[index], [field]: value as string };
    }
    setSettlement({ ...settlement, liens: updated });
  };

  const removeLien = (index: number) => {
    setSettlement({
      ...settlement,
      liens: settlement.liens.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-black">Settlement Calculator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT COLUMN - INPUTS */}
          <div className="bg-white shadow-lg rounded-lg p-6 h-fit max-h-screen overflow-y-auto sticky top-4">
            <h2 className="text-xl font-semibold mb-4 text-black border-b pb-2">Input Information</h2>

        {/* Law Firm Information for PDF Letters */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-black mb-3">Law Firm Information (for PDF letters)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-black mb-1">Law Firm Name</label>
              <input
                type="text"
                value={lawFirmInfo.lawFirm}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, lawFirm: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
                placeholder="Your Law Firm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">Attorney Name</label>
              <input
                type="text"
                value={lawFirmInfo.attorneyName}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, attorneyName: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
                placeholder="Attorney Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">Client Name</label>
              <input
                type="text"
                value={lawFirmInfo.clientName}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, clientName: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
                placeholder="Client Name"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">Case Number (optional)</label>
              <input
                type="text"
                value={lawFirmInfo.caseNumber}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, caseNumber: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
                placeholder="Case #"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-black mb-1">Date of Incident</label>
              <input
                type="date"
                value={lawFirmInfo.dateOfIncident}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, dateOfIncident: e.target.value })}
                className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
                aria-label="Date of incident"
              />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <label className="flex items-center text-xs text-black">
              <input
                type="checkbox"
                checked={lawFirmInfo.includeSettlementAmount}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, includeSettlementAmount: e.target.checked })}
                className="mr-2 h-4 w-4"
                title="Include total settlement amount in PDF letter"
              />
              Include Total Settlement Amount in PDF
            </label>
            <label className="flex items-center text-xs text-black">
              <input
                type="checkbox"
                checked={lawFirmInfo.includeTotalDamages}
                onChange={(e) => setLawFirmInfo({ ...lawFirmInfo, includeTotalDamages: e.target.checked })}
                className="mr-2 h-4 w-4"
                title="Include total damages amount in PDF letter"
              />
              Include Total Damages Amount in PDF
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-black mb-1">Total Settlement Amount</label>
            <input
              type="number"
              value={settlement.totalSettlementAmount}
              onChange={(e) => setSettlement({ ...settlement, totalSettlementAmount: +e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm placeholder-gray-700 text-black text-sm p-2"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Case Expenses</label>
            <input
              type="number"
              value={settlement.caseExpenses}
              onChange={(e) => setSettlement({ ...settlement, caseExpenses: +e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
              placeholder="Enter expenses"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Attorney Fees Type</label>
            <select
              value={settlement.attorneyFees.type}
              onChange={(e) => setSettlement({ ...settlement, attorneyFees: { ...settlement.attorneyFees, type: e.target.value as 'specific' | 'percentage' } })}
              className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
              title="Attorney fees type"
            >
              <option value="percentage">Percentage</option>
              <option value="specific">Specific Amount</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Attorney Fees Amount</label>
            <input
              type="number"
              value={settlement.attorneyFees.amount}
              onChange={(e) => setSettlement({ ...settlement, attorneyFees: { ...settlement.attorneyFees, amount: +e.target.value } })}
              className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
              placeholder="Enter amount"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-black mb-1">Medical Payment</label>
            <input
              type="number"
              value={settlement.medicalPayment}
              onChange={(e) => setSettlement({ ...settlement, medicalPayment: +e.target.value })}
              className="block w-full border-gray-300 rounded-md shadow-sm text-black text-sm p-2"
              placeholder="Enter payment"
            />
          </div>
        </div>

        {/* Pro Rata Pool Summary */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 className="text-sm font-semibold mb-2 text-black">Pro Rata Pool Summary</h3>
          <div className="text-xs text-gray-700">
            <div className="bg-white p-2 rounded text-xs">
              <div><strong>Total Damages Pool:</strong> ${calculateTotalDamages().toFixed(2)}</div>
              <div><strong>Pro Rata Pool (1/3):</strong> ${(settlement.totalSettlementAmount / 3).toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold mb-2 text-black">Medical Providers</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-1 text-black">Provider</th>
                  <th className="border border-gray-300 p-1 text-black">Amount</th>
                  <th className="border border-gray-300 p-1 text-black">Type</th>
                  <th className="border border-gray-300 p-1 text-black">%</th>
                  <th className="border border-gray-300 p-1 text-black">Reduction</th>
                  <th className="border border-gray-300 p-1 text-black">Final</th>
                  <th className="border border-gray-300 p-1 text-black">Pool</th>
                  <th className="border border-gray-300 p-1 text-black">Action</th>
                </tr>
              </thead>
            <tbody>
              {settlement.medicalProviders.map((provider, index) => {
                const percReduction = calculatePercentageReduction(provider.billedAmount, provider.reductionValue);
                const prorataReduction = calculateProrataReduction(provider.billedAmount, settlement.totalSettlementAmount);
                const reductionAmount = provider.reductionType === 'percentage' ? percReduction : prorataReduction;
                const final = provider.billedAmount - reductionAmount;
                return (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={provider.name}
                        onChange={(e) => updateMedicalProvider(index, 'name', e.target.value)}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Medical provider name"
                        placeholder="Name"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="number"
                        value={provider.billedAmount}
                        onChange={(e) => updateMedicalProvider(index, 'billedAmount', +e.target.value)}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Medical provider billed amount"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <select
                        value={provider.reductionType}
                        onChange={(e) => updateMedicalProvider(index, 'reductionType', e.target.value as 'percentage' | 'prorata')}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Medical provider reduction type"
                      >
                        <option value="percentage">%</option>
                        <option value="prorata">Pro Rata</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-1">
                      {provider.reductionType === 'percentage' ? (
                        <input
                          type="number"
                          value={provider.reductionValue}
                          onChange={(e) => updateMedicalProvider(index, 'reductionValue', +e.target.value)}
                          className="w-full border-none bg-transparent text-black text-xs p-0.5"
                          aria-label="Medical provider reduction value"
                          placeholder="%"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-1 text-black text-xs">${reductionAmount.toFixed(0)}</td>
                    <td className="border border-gray-300 p-1 text-black text-xs">${final.toFixed(0)}</td>
                    <td className="border border-gray-300 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={provider.includeInProrataPool}
                        onChange={(e) => updateMedicalProvider(index, 'includeInProrataPool', e.target.checked)}
                        className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                        aria-label="Include in pro rata pool"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <button onClick={() => removeMedicalProvider(index)} className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <button onClick={addMedicalProvider} className="bg-blue-500 text-white px-3 py-1.5 rounded mt-2 text-sm">Add Medical Provider</button>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold mb-2 text-black">Pre-Settlement Loans</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-1 text-black">Lender</th>
                  <th className="border border-gray-300 p-1 text-black">Amount</th>
                  <th className="border border-gray-300 p-1 text-black">Type</th>
                  <th className="border border-gray-300 p-1 text-black">%</th>
                  <th className="border border-gray-300 p-1 text-black">Reduction</th>
                  <th className="border border-gray-300 p-1 text-black">Final</th>
                  <th className="border border-gray-300 p-1 text-black">Pool</th>
                  <th className="border border-gray-300 p-1 text-black">Action</th>
                </tr>
              </thead>
            <tbody>
              {settlement.preSettlementLoans.map((loan, index) => {
                const percReduction = calculatePercentageReduction(loan.amount, loan.reductionValue);
                const prorataReduction = calculateProrataReduction(loan.amount, settlement.totalSettlementAmount);
                const reductionAmount = loan.reductionType === 'percentage' ? percReduction : prorataReduction;
                const final = loan.amount - reductionAmount;
                return (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={loan.provider}
                        onChange={(e) => updateLoan(index, 'provider', e.target.value)}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Loan provider name"
                        placeholder="Lender"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="number"
                        value={loan.amount}
                        onChange={(e) => updateLoan(index, 'amount', +e.target.value)}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Loan amount"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <select
                        value={loan.reductionType}
                        onChange={(e) => updateLoan(index, 'reductionType', e.target.value as 'percentage' | 'prorata')}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Loan reduction type"
                      >
                        <option value="percentage">%</option>
                        <option value="prorata">Pro Rata</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-1">
                      {loan.reductionType === 'percentage' ? (
                        <input
                          type="number"
                          value={loan.reductionValue}
                          onChange={(e) => updateLoan(index, 'reductionValue', +e.target.value)}
                          className="w-full border-none bg-transparent text-black text-xs p-0.5"
                          aria-label="Loan reduction value"
                          placeholder="%"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-1 text-black text-xs">${reductionAmount.toFixed(0)}</td>
                    <td className="border border-gray-300 p-1 text-black text-xs">${final.toFixed(0)}</td>
                    <td className="border border-gray-300 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={loan.includeInProrataPool}
                        onChange={(e) => updateLoan(index, 'includeInProrataPool', e.target.checked)}
                        className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                        aria-label="Include in pro rata pool"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <button onClick={() => removeLoan(index)} className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <button onClick={addLoan} className="bg-blue-500 text-white px-3 py-1.5 rounded mt-2 text-sm">Add Loan</button>
        </div>

        <div className="mt-6">
          <h3 className="text-base font-semibold mb-2 text-black">Liens</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-1 text-black">Lienholder</th>
                  <th className="border border-gray-300 p-1 text-black">Amount</th>
                  <th className="border border-gray-300 p-1 text-black">Type</th>
                  <th className="border border-gray-300 p-1 text-black">Red. Type</th>
                  <th className="border border-gray-300 p-1 text-black">%</th>
                  <th className="border border-gray-300 p-1 text-black">Reduction</th>
                  <th className="border border-gray-300 p-1 text-black">Final</th>
                  <th className="border border-gray-300 p-1 text-black">Pool</th>
                  <th className="border border-gray-300 p-1 text-black">Action</th>
                </tr>
              </thead>
            <tbody>
              {settlement.liens.map((lien, index) => {
                const percReduction = calculatePercentageReduction(lien.amount, lien.reductionValue);
                const prorataReduction = calculateProrataReduction(lien.amount, settlement.totalSettlementAmount);
                const reductionAmount = lien.reductionType === 'percentage' ? percReduction : prorataReduction;
                const final = lien.amount - reductionAmount;
                return (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="text"
                        value={lien.provider}
                        onChange={(e) => updateLien(index, 'provider', e.target.value)}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Lien provider name"
                        placeholder="Lienholder"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <input
                        type="number"
                        value={lien.amount}
                        onChange={(e) => updateLien(index, 'amount', +e.target.value)}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Lien amount"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <select
                        value={lien.type}
                        onChange={(e) => updateLien(index, 'type', e.target.value as 'health' | 'other')}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Lien type"
                      >
                        <option value="health">Health</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-1">
                      <select
                        value={lien.reductionType}
                        onChange={(e) => updateLien(index, 'reductionType', e.target.value as 'percentage' | 'prorata')}
                        className="w-full border-none bg-transparent text-black text-xs p-0.5"
                        aria-label="Lien reduction type"
                      >
                        <option value="percentage">%</option>
                        <option value="prorata">Pro Rata</option>
                      </select>
                    </td>
                    <td className="border border-gray-300 p-1">
                      {lien.reductionType === 'percentage' ? (
                        <input
                          type="number"
                          value={lien.reductionValue}
                          onChange={(e) => updateLien(index, 'reductionValue', +e.target.value)}
                          className="w-full border-none bg-transparent text-black text-xs p-0.5"
                          aria-label="Lien reduction value"
                          placeholder="%"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="border border-gray-300 p-1 text-black text-xs">${reductionAmount.toFixed(0)}</td>
                    <td className="border border-gray-300 p-1 text-black text-xs">${final.toFixed(0)}</td>
                    <td className="border border-gray-300 p-1 text-center">
                      <input
                        type="checkbox"
                        checked={lien.includeInProrataPool}
                        onChange={(e) => updateLien(index, 'includeInProrataPool', e.target.checked)}
                        className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                        aria-label="Include in pro rata pool"
                      />
                    </td>
                    <td className="border border-gray-300 p-1">
                      <button onClick={() => removeLien(index)} className="bg-red-500 text-white px-1.5 py-0.5 rounded text-xs">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <button onClick={addLien} className="bg-blue-500 text-white px-3 py-1.5 rounded mt-2 text-sm">Add Lien</button>
        </div>

        <div className="mt-6 text-center">
          <button onClick={handleCalculate} className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg w-full">Calculate Settlement</button>
        </div>
      </div>
      
      {/* RIGHT COLUMN - RESULTS */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-black border-b pb-2">Settlement Results</h2>
        
        {!results ? (
          <div className="text-center py-20 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No results yet</p>
            <p className="text-sm mt-2">Fill in the settlement information and click &quot;Calculate Settlement&quot;</p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-black">Settlement Summary</h3>
            
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <div className="space-y-3 text-black">
                <div className="flex justify-between text-lg">
                  <span className="font-medium">Gross Settlement:</span>
                  <span className="font-semibold">${results.grossSettlement.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Payment:</span>
                  <span className="text-green-600">+${results.medicalPayment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Case Expenses:</span>
                  <span className="text-red-600">-${results.caseExpenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Attorney Fees:</span>
                  <span className="text-red-600">-${results.attorneyFees.toFixed(2)}</span>
                </div>
                {results.reductions.medical.perProvider.length > 0 && (
                  <div className="flex justify-between">
                    <span>Medical Bills (after reductions):</span>
                    <span className="text-red-600">-${results.reductions.medical.perProvider.reduce((sum, p) => sum + p.finalAmount, 0).toFixed(2)}</span>
                  </div>
                )}
                {results.reductions.loans.perProvider.length > 0 && (
                  <div className="flex justify-between">
                    <span>Pre-Settlement Loans (after reductions):</span>
                    <span className="text-red-600">-${results.reductions.loans.perProvider.reduce((sum, l) => sum + l.finalAmount, 0).toFixed(2)}</span>
                  </div>
                )}
                {results.reductions.liens.perProvider.length > 0 && (
                  <div className="flex justify-between">
                    <span>Liens (after reductions):</span>
                    <span className="text-red-600">-${results.reductions.liens.perProvider.reduce((sum, l) => sum + l.finalAmount, 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t-2 border-gray-300 pt-3 mt-3 text-lg">
                  <span className="font-bold">Net Proceeds:</span>
                  <span className="font-bold text-green-600">${results.netProceeds.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {results.reductions.medical.perProvider.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-black">Medical Provider Reductions</h4>
                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 text-left text-black">Provider</th>
                        <th className="p-2 text-right text-black">Original</th>
                        <th className="p-2 text-right text-black">Reduction</th>
                        <th className="p-2 text-right text-black">Final</th>
                        <th className="p-2 text-center text-black">PDF</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.reductions.medical.perProvider.map((provider, index) => {
                        // Find the corresponding provider from input to get email
                        const inputProvider = settlement.medicalProviders[index];
                        const providerWithEmail = { ...provider, email: inputProvider?.email };
                        
                        return (
                          <tr key={index} className="border-t border-gray-200">
                            <td className="p-2 text-black">{provider.name || `Provider ${index + 1}`}</td>
                            <td className="p-2 text-right text-black">${provider.billedAmount.toFixed(2)}</td>
                            <td className="p-2 text-right text-black">${provider.reduction.toFixed(2)}</td>
                            <td className="p-2 text-right text-black">${provider.finalAmount.toFixed(2)}</td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => generatePDF(providerWithEmail)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs transition-colors"
                                title="Export PDF Letter"
                              >
                                📄 Export
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td className="p-2 font-semibold text-black">Total:</td>
                        <td className="p-2 text-right font-semibold text-black"></td>
                        <td className="p-2 text-right font-semibold text-black">${results.reductions.medical.total.toFixed(2)}</td>
                        <td className="p-2 text-right font-semibold text-black"></td>
                        <td className="p-2"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {results.reductions.loans.perProvider.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-black">Loan Reductions</h4>
                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 text-left text-black">Lender</th>
                        <th className="p-2 text-right text-black">Reduction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.reductions.loans.perProvider.map((loan, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="p-2 text-black">{loan.provider || `Lender ${index + 1}`}</td>
                          <td className="p-2 text-right text-black">${loan.reduction.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td className="p-2 font-semibold text-black">Total:</td>
                        <td className="p-2 text-right font-semibold text-black">${results.reductions.loans.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {results.reductions.liens.perProvider.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 text-black">Lien Reductions</h4>
                <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-200">
                      <tr>
                        <th className="p-2 text-left text-black">Lienholder</th>
                        <th className="p-2 text-right text-black">Reduction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.reductions.liens.perProvider.map((lien, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="p-2 text-black">{lien.provider || `Lienholder ${index + 1}`}</td>
                          <td className="p-2 text-right text-black">${lien.reduction.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gray-300 bg-gray-50">
                        <td className="p-2 font-semibold text-black">Total:</td>
                        <td className="p-2 text-right font-semibold text-black">${results.reductions.liens.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* END RIGHT COLUMN */}
    </div>
    {/* END GRID */}
  </div>
  {/* END CONTAINER */}
  </div>
  );
}
