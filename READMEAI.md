# Settlement Calculator

A web application for calculating personal injury settlement proceeds, managing medical provider reductions, and generating professional reduction request letters.

## Features

- **Settlement Calculation**: Input gross settlement, expenses, attorney fees, and medical payments to calculate net proceeds
- **Medical Provider Management**: Add providers with billed amounts, reduction types (percentage or pro rata), and contact info
- **Reduction Strategies**: Support for percentage-based or pro rata reductions across medical bills, loans, and liens
- **PDF Export**: Generate professional reduction request letters for medical providers with customizable law firm details
- **Two-Column Layout**: Efficient input form on the left, results display on the right
- **Real-Time Calculations**: Live updates as you modify inputs

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: NestJS, MongoDB, TypeScript
- **PDF Generation**: @react-pdf/renderer
- **Deployment**: Ready for Vercel/Netlify (frontend) and cloud providers (backend)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/stlmntcalc.git
cd stlmntcalc
```

2. Install dependencies:
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

3. Set up environment variables:
```bash
# backend/.env
MONGO_URI=mongodb://localhost:27017/stlmntcalc
PORT=3001
```

4. Start the services:
```bash
# Backend (terminal 1)
cd backend
npm run start:dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter law firm information (optional for PDF generation)
2. Input settlement details and add medical providers/loans/liens
3. Configure reduction types and amounts
4. Click "Calculate" to see results
5. Export PDF reduction letters for each provider

## AI Integration Ideas

### 3. Personalized Letter Generation
Use AI (e.g., OpenAI GPT-4) to generate customized reduction request letters based on specific case details, provider history, and negotiation strategies.

**Implementation Steps:**
1. **Backend Setup:**
   - Install OpenAI SDK: `npm install openai`
   - Create environment variable for OpenAI API key: `OPENAI_API_KEY=your_key_here`
   - Create a new service `ai.service.ts` in the backend for AI interactions

2. **Create AI Service:**
   ```typescript
   // backend/src/ai/ai.service.ts
   import { Injectable } from '@nestjs/common';
   import OpenAI from 'openai';

   @Injectable()
   export class AiService {
     private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

     async generateLetter(data: {
       providerName: string;
       clientName: string;
       originalAmount: number;
       reductionAmount: number;
       finalAmount: number;
       caseDetails: string;
     }) {
       const prompt = `Generate a professional reduction request letter for medical provider ${data.providerName}...`;
       
       const response = await this.openai.chat.completions.create({
         model: 'gpt-4',
         messages: [{ role: 'user', content: prompt }],
         max_tokens: 1000,
       });
       
       return response.choices[0].message.content;
     }
   }
   ```

3. **Add Backend Endpoint:**
   - Create `ai.controller.ts` with POST `/generate-letter`
   - Inject AiService and handle requests

4. **Frontend Integration:**
   - Add "Generate with AI" button next to PDF export
   - Send settlement data to new endpoint
   - Preview/edit generated text before PDF creation
   - Update ReductionLetter component to accept custom text

**Tools & Libraries:**
- `openai` npm package for API integration
- Existing `@react-pdf/renderer` for PDF generation
- Axios for API calls

**Considerations:**
- API costs: GPT-4 is ~$0.03/1K tokens
- Prompt engineering for consistent professional tone
- Error handling for API failures
- User ability to edit AI-generated content
- Rate limiting to control costs

### 5. Predictive Settlement Analytics
Implement machine learning to predict settlement outcomes based on historical data, helping attorneys make informed decisions.

**Implementation Steps:**
1. **Data Collection:**
   - Create MongoDB collection for historical settlements
   - Schema: case details, amounts, reduction types, final outcomes
   - Add data entry interface or import from Excel

2. **Model Development:**
   - Use TensorFlow.js for client-side predictions
   - Install: `npm install @tensorflow/tfjs @tensorflow/tfjs-node`
   - Train linear regression model on historical data
   - Features: total damages, medical amounts, case type, etc.

3. **Backend Implementation:**
   ```typescript
   // backend/src/ai/predictive.service.ts
   import * as tf from '@tensorflow/tfjs-node';

   @Injectable()
   export class PredictiveService {
     private model: tf.Sequential;

     async predictOutcome(features: number[]) {
       // Load trained model
       const prediction = this.model.predict(tf.tensor2d([features]));
       return prediction.dataSync()[0];
     }
   }
   ```

4. **Frontend Display:**
   - Add "Predict Outcome" button
   - Display predicted settlement range with confidence intervals
   - Show in results section with disclaimer

**Tools & Libraries:**
- `@tensorflow/tfjs` for browser-based ML
- `scikit-learn` or `tensorflow` for initial model training
- Chart.js for displaying predictions

**Considerations:**
- Data privacy and security for sensitive case information
- Model accuracy validation with cross-validation
- Regular model retraining as new data becomes available
- Clear disclaimers about prediction uncertainty
- Start with simple linear regression before complex models

### 7. Automated Email/Fax Integration
AI-powered system to automatically send reduction requests via email or fax, track responses, and suggest follow-ups.

**Implementation Steps:**
1. **Communication Setup:**
   - Choose providers: SendGrid for email, Twilio for fax
   - Install SDKs: `npm install sendgrid twilio`
   - Set up API keys and verify domains/phone numbers

2. **Backend Services:**
   ```typescript
   // backend/src/communication/communication.service.ts
   import * as sendgrid from '@sendgrid/mail';
   import twilio from 'twilio';

   @Injectable()
   export class CommunicationService {
     async sendEmail(to: string, subject: string, html: string) {
       sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
       await sendgrid.send({ to, from: 'your@email.com', subject, html });
     }

     async sendFax(to: string, pdfUrl: string) {
       const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
       await client.fax.faxes.create({ to, from: process.env.TWILIO_FAX_NUMBER, mediaUrl: pdfUrl });
     }
   }
   ```

3. **AI-Enhanced Content:**
   - Reuse letter generation AI for email/fax body
   - Add personalization based on provider communication preferences
   - Generate follow-up suggestions using AI

4. **Frontend Controls:**
   - Add send options in provider table: Email/Fax buttons
   - Preview content before sending
   - Track sent status and responses

5. **Response Tracking:**
   - Webhook endpoints for email replies and fax status
   - Store communication history in database
   - AI analysis of responses for sentiment and next steps

**Tools & Libraries:**
- `@sendgrid/mail` for email sending
- `twilio` for fax and SMS
- `openai` for content generation and response analysis
- Webhook handlers for tracking

**Considerations:**
- Compliance with legal communication standards
- Cost management for fax/email services
- Provider opt-out handling
- Secure storage of communication logs
- Integration with existing PDF generation
- AI for analyzing response sentiment and suggesting actions

## Project Structure

```
stlmntcalc/
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/# Reusable components
│   │   └── lib/       # Utilities
│   └── package.json
├── backend/           # NestJS API
│   ├── src/
│   │   ├── settlement/# Settlement logic
│   │   └── main.ts
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test
4. Submit a pull request

## License

MIT License - see LICENSE file for details.