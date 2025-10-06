# Settlement Calculator

A comprehensive settlement calculator application for legal professionals to calculate settlement distributions, including attorney fees, medical bills, pre-settlement loans, and liens with individual reduction controls.

## Features

### Core Functionality
- **Settlement Calculation**: Calculate net proceeds from gross settlement amounts
- **Attorney Fees**: Support for percentage-based or specific dollar amount fees
- **Medical Payment**: Track medical payments that add to net proceeds
- **Case Expenses**: Account for case-related expenses

### Advanced Features
- **Individual Reduction Controls**: Each medical provider, loan, and lien can have:
  - Percentage reduction
  - Pro rata reduction based on proportional share
- **Pro Rata Pool Configuration**: Choose which items to include in the pro rata calculation pool
- **Real-time Calculations**: See results update as you adjust inputs
- **Detailed Breakdown**: View itemized reductions for each provider, lender, and lienholder

### User Interface
- **Two-Column Layout**: Inputs on the left, results on the right for efficient workflow
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Compact Tables**: Space-efficient design with clear data presentation
- **Professional Results Display**: Color-coded summary with detailed breakdowns

## Tech Stack

### Frontend
- **Next.js 15.5.4**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client for API communication

### Backend
- **Nest.js**: Progressive Node.js framework
- **MongoDB**: Database with Mongoose ODM
- **TypeScript**: Consistent typing across the stack

## Project Structure

```
stlmntcalc/
├── frontend/               # Next.js frontend application
│   ├── src/
│   │   └── app/
│   │       └── page.tsx    # Main calculator component
│   ├── package.json
│   └── ...
├── backend/                # Nest.js backend API
│   ├── src/
│   │   ├── settlement/     # Settlement module
│   │   │   ├── settlement.controller.ts
│   │   │   ├── settlement.service.ts
│   │   │   └── settlement.schema.ts
│   │   └── email/          # Email service module
│   ├── package.json
│   └── ...
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stlmntcalc.git
cd stlmntcalc
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

### Configuration

1. Create a `.env` file in the backend directory:
```env
MONGODB_URI=mongodb://localhost:27017/settlement-calculator
PORT=3001
```

2. Update the frontend API URL if needed in `frontend/src/app/page.tsx`

### Running the Application

1. Start the backend server:
```bash
cd backend
npm run start:dev
```

2. In a new terminal, start the frontend:
```bash
cd frontend
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Usage

1. **Enter Settlement Details**:
   - Total settlement amount
   - Case expenses
   - Attorney fees (percentage or specific amount)
   - Medical payment

2. **Add Medical Providers**:
   - Click "Add Medical Provider"
   - Enter provider name and billed amount
   - Choose reduction type (percentage or pro rata)
   - Set reduction percentage if applicable
   - Check/uncheck "Include in Pro Rata Pool"

3. **Add Loans and Liens** (optional):
   - Similar process to medical providers
   - Loans and liens can also have individual reduction controls

4. **Calculate**:
   - Click "Calculate Settlement"
   - View detailed results on the right panel

## Pro Rata Calculation

The pro rata reduction distributes 1/3 of the total settlement amount proportionally based on each item's share of the total damages pool. Only items marked "Include in Pro Rata Pool" are included in the calculation.

**Example**:
- Settlement: $30,000
- Provider A: $8,000 (included in pool)
- Provider B: $4,000 (excluded from pool)
- Total damages pool: $8,000
- Pro rata pool (1/3 settlement): $10,000
- Provider A receives full $10,000 (since they're 100% of pool)

## Future Enhancements

- [ ] Email functionality for sending reduction letters
- [ ] PDF/Word export for settlement summaries
- [ ] Save/load settlement calculations
- [ ] User authentication and authorization
- [ ] Settlement history and templates
- [ ] Batch email sending

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Contact

For questions or support, please contact the development team.
